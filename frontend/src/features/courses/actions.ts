"use server";

import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/permissions/rbac";
import { RoleKey } from "@prisma/client";
import { createNotification } from "@/services/notifications";
import {
  createCourseSchema,
  createModuleSchema,
  enrollStudentSchema,
} from "./schemas";

export type CourseFormState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function fieldErrorsFromZod(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

export async function submitCreateCourse(
  _previous: CourseFormState | null,
  formData: FormData,
): Promise<CourseFormState> {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;

  if (!institutionId) {
    return { ok: false, error: "No active institution membership found." };
  }

  const parsed = createCourseSchema.safeParse({
    code: formData.get("code"),
    title: formData.get("title"),
    description: formData.get("description"),
    lecturerProfileId: formData.get("lecturerProfileId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const codeUpper = parsed.data.code.trim().toUpperCase();

    const existingCourse = await prisma.course.findUnique({
      where: {
        institutionId_code: {
          institutionId,
          code: codeUpper,
        },
      },
    });

    if (existingCourse) {
      return {
        ok: false,
        error: "A course with this code already exists in your institution.",
        fieldErrors: { code: "Course code already in use." },
      };
    }

    await prisma.course.create({
      data: {
        institutionId,
        code: codeUpper,
        title: parsed.data.title,
        description: parsed.data.description || null,
        lecturerProfileId: parsed.data.lecturerProfileId || null,
      },
    });

    revalidatePath("/admin/courses");
    revalidatePath("/institution-admin/courses");
    revalidatePath("/institution-admin");
    return { ok: true, message: "Course created successfully!" };
  } catch (error) {
    console.error("Create course error:", error);
    return { ok: false, error: "Failed to create course." };
  }
}

export async function submitCreateModule(
  _previous: CourseFormState | null,
  formData: FormData,
): Promise<CourseFormState> {
  await requireRole([RoleKey.INSTITUTION_ADMIN, RoleKey.LECTURER]);

  const parsed = createModuleSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const moduleCount = await prisma.courseModule.count({
      where: { courseId: parsed.data.courseId },
    });

    await prisma.courseModule.create({
      data: {
        courseId: parsed.data.courseId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        sortOrder: moduleCount + 1,
      },
    });

    revalidatePath(`/admin/courses/${parsed.data.courseId}`);
    return { ok: true, message: "Module added successfully!" };
  } catch (error) {
    console.error("Create module error:", error);
    return { ok: false, error: "Failed to add module." };
  }
}

export async function submitEnrollStudent(
  _previous: CourseFormState | null,
  formData: FormData,
): Promise<CourseFormState> {
  await requireRole([RoleKey.INSTITUTION_ADMIN]);

  const parsed = enrollStudentSchema.safeParse({
    courseId: formData.get("courseId"),
    studentProfileId: formData.get("studentProfileId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentProfileId: {
          courseId: parsed.data.courseId,
          studentProfileId: parsed.data.studentProfileId,
        },
      },
    });

    if (!existing) {
      await prisma.courseEnrollment.create({
        data: {
          courseId: parsed.data.courseId,
          studentProfileId: parsed.data.studentProfileId,
        },
      });

      const [course, student] = await Promise.all([
        prisma.course.findUnique({
          where: { id: parsed.data.courseId },
          select: { id: true, code: true, title: true, institutionId: true },
        }),
        prisma.studentProfile.findUnique({
          where: { id: parsed.data.studentProfileId },
          select: {
            institutionUser: { select: { userId: true } },
          },
        }),
      ]);

      const enrolledUserId = student?.institutionUser.userId;
      if (course && enrolledUserId) {
        await createNotification({
          institutionId: course.institutionId,
          userId: enrolledUserId,
          type: "ENROLLMENT",
          title: "Course enrollment",
          body: `You have been enrolled in ${course.code} — ${course.title}.`,
          resourceType: "Course",
          resourceId: course.id,
        });
      }
    }

    revalidatePath(`/admin/courses/${parsed.data.courseId}`);
    revalidatePath("/student/notifications");
    return { ok: true, message: "Student enrolled successfully!" };
  } catch (error) {
    console.error("Enroll student error:", error);
    return { ok: false, error: "Failed to enroll student into course." };
  }
}

export async function submitRemoveStudent(enrollmentId: string, courseId: string): Promise<void> {
  await requireRole([RoleKey.INSTITUTION_ADMIN]);

  await prisma.courseEnrollment.delete({
    where: { id: enrollmentId },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}
