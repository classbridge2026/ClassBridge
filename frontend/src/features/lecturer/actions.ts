"use server";

import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";
import { storageAdapter } from "@/lib/storage/adapter";

export type LecturerActionState = {
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

const bioSchema = z.object({
  title: z
    .string()
    .trim()
    .max(80, "Title must be 80 characters or fewer.")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(2000, "Bio must be 2000 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export async function submitUpdateLecturerProfile(
  _prev: LecturerActionState | null,
  formData: FormData,
): Promise<LecturerActionState> {
  const ctx = await requireLecturerContext();

  const parsed = bioSchema.safeParse({
    title: formData.get("title"),
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await prisma.lecturerProfile.update({
      where: { id: ctx.lecturerProfile.id },
      data: {
        title: parsed.data.title || null,
        bio: parsed.data.bio || null,
      },
    });

    revalidatePath("/lecturer/profile");
    revalidatePath("/lecturer");
    return { ok: true, message: "Faculty profile updated." };
  } catch (error) {
    console.error("Update lecturer profile error:", error);
    return { ok: false, error: "Failed to update faculty profile." };
  }
}

export async function deleteLecturerRecording(
  recordingId: string,
): Promise<LecturerActionState> {
  const { courseIds, institutionId } = await requireLecturerContext();

  const recording = await prisma.classRecording.findFirst({
    where: {
      id: recordingId,
      session: {
        institutionId,
        courseId: { in: courseIds },
      },
    },
  });

  if (!recording) {
    return { ok: false, error: "Recording not found or not authorized." };
  }

  try {
    if (recording.storageKey) {
      await storageAdapter.deleteFile(recording.storageKey);
    }
    await prisma.classRecording.delete({ where: { id: recording.id } });
    revalidatePath("/lecturer/recordings");
    revalidatePath(`/lecturer/classes/${recording.sessionId}`);
    return { ok: true, message: "Recording deleted." };
  } catch (error) {
    console.error("Delete recording error:", error);
    return { ok: false, error: "Failed to delete recording." };
  }
}

export async function submitUnpublishAssignment(
  assignmentId: string,
  courseId: string,
): Promise<LecturerActionState> {
  const { courseIds, institutionId } = await requireLecturerContext();

  if (!courseIds.includes(courseId)) {
    return { ok: false, error: "Not authorized for this course." };
  }

  const result = await prisma.assignment.updateMany({
    where: { id: assignmentId, institutionId, courseId },
    data: { published: false },
  });

  if (result.count === 0) {
    return { ok: false, error: "Assignment not found." };
  }

  revalidatePath("/lecturer/assignments");
  revalidatePath(`/lecturer/assignments/${assignmentId}`);
  revalidatePath(`/lecturer/courses/${courseId}`);
  return { ok: true, message: "Assignment unpublished." };
}
