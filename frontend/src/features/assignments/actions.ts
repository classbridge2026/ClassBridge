"use server";

import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/permissions/rbac";
import {
  createAssignment,
  gradeSubmission,
  publishAssignment,
  submitAssignmentWork,
} from "@/services/assignments";
import {
  createAssignmentSchema,
  gradeSubmissionSchema,
  publishAssignmentSchema,
  submitWorkSchema,
} from "./schemas";

export type AssignmentFormState = {
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

function revalidateCourse(courseId: string) {
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/lecturer/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath("/student/assignments");
  revalidatePath("/lecturer/assignments");
}

async function assertCourseAccess(
  role: RoleKey,
  institutionId: string,
  institutionUserId: string,
  courseId: string,
) {
  if (role === RoleKey.INSTITUTION_ADMIN) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, institutionId },
    });
    if (!course) throw new Error("Course not found.");
    return course;
  }

  const lecturerProfile = await prisma.lecturerProfile.findUnique({
    where: { institutionUserId },
  });
  if (!lecturerProfile) throw new Error("Lecturer profile not found.");

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      institutionId,
      lecturerProfileId: lecturerProfile.id,
    },
  });
  if (!course) throw new Error("Course not found or not assigned to you.");
  return course;
}

export async function submitCreateAssignment(
  _prev: AssignmentFormState | null,
  formData: FormData,
): Promise<AssignmentFormState> {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN, RoleKey.LECTURER]);
  const institutionId = user.activeMembership?.institutionId;
  const institutionUserId = user.activeMembership?.institutionUserId;
  const role = user.activeMembership?.roleKey;

  if (!institutionId || !institutionUserId || !role) {
    return { ok: false, error: "No active institution membership found." };
  }

  const parsed = createAssignmentSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    description: formData.get("description"),
    dueAt: formData.get("dueAt"),
    published: formData.get("published") === "on" || formData.get("published") === "true",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await assertCourseAccess(role, institutionId, institutionUserId, parsed.data.courseId);

    const dueAt =
      parsed.data.dueAt && parsed.data.dueAt.length > 0
        ? new Date(parsed.data.dueAt)
        : null;

    const assignment = await createAssignment({
      institutionId,
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      dueAt,
      createdByUserId: user.id,
      published: parsed.data.published ?? false,
    });

    if (assignment.published) {
      await publishAssignment(assignment.id, institutionId);
    }

    revalidateCourse(parsed.data.courseId);
    return { ok: true, message: "Assignment created." };
  } catch (error) {
    console.error("Create assignment error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create assignment.",
    };
  }
}

export async function submitPublishAssignment(
  assignmentId: string,
  courseId: string,
): Promise<AssignmentFormState> {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN, RoleKey.LECTURER]);
  const institutionId = user.activeMembership?.institutionId;
  const institutionUserId = user.activeMembership?.institutionUserId;
  if (!institutionId || !institutionUserId) {
    return { ok: false, error: "No active institution." };
  }

  try {
    await assertCourseAccess(
      user.activeMembership!.roleKey,
      institutionId,
      institutionUserId,
      courseId,
    );
    const result = await publishAssignment(assignmentId, institutionId);
    if (!result) return { ok: false, error: "Assignment not found." };
    revalidateCourse(courseId);
    revalidatePath(`/lecturer/assignments/${assignmentId}`);
    return { ok: true, message: "Assignment published." };
  } catch (error) {
    console.error("Publish assignment error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to publish assignment.",
    };
  }
}

export async function submitAssignmentResponse(
  _prev: AssignmentFormState | null,
  formData: FormData,
): Promise<AssignmentFormState> {
  const user = await requireRole([RoleKey.STUDENT]);
  const membership = user.activeMembership;
  if (!membership?.institutionId || !membership.institutionUserId) {
    return { ok: false, error: "No active institution membership found." };
  }

  const parsed = submitWorkSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    textContent: formData.get("textContent"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { institutionUserId: membership.institutionUserId },
    });
    if (!studentProfile) return { ok: false, error: "Student profile not found." };

    const assignment = await prisma.assignment.findFirst({
      where: {
        id: parsed.data.assignmentId,
        published: true,
        institutionId: membership.institutionId,
        course: {
          enrollments: { some: { studentProfileId: studentProfile.id } },
        },
      },
    });
    if (!assignment) return { ok: false, error: "Assignment not available." };

    const textContent = parsed.data.textContent || null;
    const fileEntry = formData.get("file");
    const existing = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_userId: {
          assignmentId: parsed.data.assignmentId,
          userId: user.id,
        },
      },
    });

    let storageKey: string | null | undefined = undefined;
    let fileName: string | null | undefined = undefined;

    if (fileEntry instanceof File && fileEntry.size > 0) {
      const { storageAdapter } = await import("@/lib/storage/adapter");
      const buffer = Buffer.from(await fileEntry.arrayBuffer());
      storageKey = await storageAdapter.uploadFile(buffer, fileEntry.name);
      fileName = fileEntry.name;
    }

    const effectiveFile = storageKey ?? existing?.storageKey ?? null;
    if (!textContent && !effectiveFile) {
      return {
        ok: false,
        error: "Add a written response or attach a file before submitting.",
      };
    }

    await submitAssignmentWork({
      assignmentId: parsed.data.assignmentId,
      userId: user.id,
      textContent,
      storageKey: storageKey === undefined ? existing?.storageKey ?? null : storageKey,
      fileName: fileName === undefined ? existing?.fileName ?? null : fileName,
    });

    revalidateCourse(assignment.courseId);
    revalidatePath(`/student/assignments/${assignment.id}`);
    revalidatePath("/student/results");
    return { ok: true, message: "Submission saved." };
  } catch (error) {
    console.error("Submit assignment error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to submit.",
    };
  }
}

export async function submitGradeSubmission(
  _prev: AssignmentFormState | null,
  formData: FormData,
): Promise<AssignmentFormState> {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN, RoleKey.LECTURER]);
  const institutionId = user.activeMembership?.institutionId;
  if (!institutionId) return { ok: false, error: "No active institution." };

  const parsed = gradeSubmissionSchema.safeParse({
    submissionId: formData.get("submissionId"),
    grade: formData.get("grade"),
    feedback: formData.get("feedback"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: parsed.data.submissionId },
      include: {
        assignment: {
          select: { id: true, courseId: true, institutionId: true },
        },
      },
    });

    if (!submission || submission.assignment.institutionId !== institutionId) {
      return { ok: false, error: "Submission not found." };
    }

    const institutionUserId = user.activeMembership?.institutionUserId;
    if (!institutionUserId) return { ok: false, error: "No active membership." };

    if (user.activeMembership?.roleKey === RoleKey.LECTURER) {
      await assertCourseAccess(
        RoleKey.LECTURER,
        institutionId,
        institutionUserId,
        submission.assignment.courseId,
      );
    }

    await gradeSubmission({
      submissionId: parsed.data.submissionId,
      grade: parsed.data.grade,
      feedback: parsed.data.feedback || null,
      gradedByUserId: user.id,
      institutionId,
    });

    revalidateCourse(submission.assignment.courseId);
    revalidatePath(`/lecturer/assignments/${submission.assignment.id}`);
    return { ok: true, message: "Grade saved." };
  } catch (error) {
    console.error("Grade submission error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to grade.",
    };
  }
}

// silence unused import if tree-shaken oddly
void publishAssignmentSchema;
