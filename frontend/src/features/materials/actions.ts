"use server";

import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/permissions/rbac";
import {
  deleteMaterial,
  MAX_MATERIAL_BYTES,
  uploadMaterial,
} from "@/services/materials";
import { deleteMaterialSchema, uploadMaterialSchema } from "./schemas";

export type MaterialFormState = {
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

function revalidateCoursePaths(courseId: string) {
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/lecturer/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
}

/**
 * Admin: any course in their institution.
 * Lecturer: only courses assigned to their lecturer profile.
 */
async function assertCanManageCourseMaterials(
  userId: string,
  institutionUserId: string,
  institutionId: string,
  courseId: string,
  roleKey: RoleKey,
) {
  if (roleKey === RoleKey.INSTITUTION_ADMIN) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, institutionId },
      select: { id: true },
    });
    if (!course) {
      throw new Error("Course not found in your institution.");
    }
    return;
  }

  if (roleKey === RoleKey.LECTURER) {
    const lecturerProfile = await prisma.lecturerProfile.findUnique({
      where: { institutionUserId },
      select: { id: true },
    });

    if (!lecturerProfile) {
      throw new Error("Lecturer profile not found.");
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        institutionId,
        lecturerProfileId: lecturerProfile.id,
      },
      select: { id: true },
    });

    if (!course) {
      throw new Error("You can only manage materials for courses assigned to you.");
    }
    return;
  }

  void userId;
  throw new Error("Unauthorized.");
}

export async function submitUploadMaterial(
  _previous: MaterialFormState | null,
  formData: FormData,
): Promise<MaterialFormState> {
  const user = await requireRole([RoleKey.LECTURER, RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;
  const institutionUserId = user.activeMembership?.institutionUserId;
  const roleKey = user.activeMembership?.roleKey;

  if (!institutionId || !institutionUserId || !roleKey) {
    return { ok: false, error: "No active institution membership found." };
  }

  const parsed = uploadMaterialSchema.safeParse({
    courseId: formData.get("courseId"),
    moduleId: formData.get("moduleId") || "",
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return {
      ok: false,
      error: "Please select a file to upload.",
      fieldErrors: { file: "A file is required." },
    };
  }

  if (fileEntry.size > MAX_MATERIAL_BYTES) {
    return {
      ok: false,
      error: "File exceeds the 20MB size limit.",
      fieldErrors: { file: "Maximum file size is 20MB." },
    };
  }

  try {
    await assertCanManageCourseMaterials(
      user.id,
      institutionUserId,
      institutionId,
      parsed.data.courseId,
      roleKey,
    );

    const buffer = Buffer.from(await fileEntry.arrayBuffer());

    await uploadMaterial({
      institutionId,
      courseId: parsed.data.courseId,
      moduleId: parsed.data.moduleId || null,
      title: parsed.data.title,
      createdByUserId: user.id,
      file: {
        buffer,
        fileName: fileEntry.name,
        contentType: fileEntry.type || undefined,
        byteSize: fileEntry.size,
      },
    });

    revalidateCoursePaths(parsed.data.courseId);
    return { ok: true, message: "Material uploaded successfully!" };
  } catch (error) {
    console.error("Upload material error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload material.";
    return { ok: false, error: message };
  }
}

export async function submitDeleteMaterial(
  materialId: string,
  courseId: string,
): Promise<MaterialFormState> {
  const user = await requireRole([RoleKey.LECTURER, RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;
  const institutionUserId = user.activeMembership?.institutionUserId;
  const roleKey = user.activeMembership?.roleKey;

  if (!institutionId || !institutionUserId || !roleKey) {
    return { ok: false, error: "No active institution membership found." };
  }

  const parsed = deleteMaterialSchema.safeParse({ materialId, courseId });
  if (!parsed.success) {
    return { ok: false, error: "Invalid material or course." };
  }

  try {
    await assertCanManageCourseMaterials(
      user.id,
      institutionUserId,
      institutionId,
      parsed.data.courseId,
      roleKey,
    );

    const material = await prisma.learningMaterial.findFirst({
      where: {
        id: parsed.data.materialId,
        courseId: parsed.data.courseId,
        institutionId,
      },
      select: { id: true },
    });

    if (!material) {
      return { ok: false, error: "Material not found." };
    }

    await deleteMaterial(material.id, institutionId);
    revalidateCoursePaths(parsed.data.courseId);
    return { ok: true, message: "Material deleted." };
  } catch (error) {
    console.error("Delete material error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete material.";
    return { ok: false, error: message };
  }
}
