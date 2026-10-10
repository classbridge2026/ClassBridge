"use server";

import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { QuestionType, RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/permissions/rbac";
import {
  createAssessment,
  publishAssessment,
  submitAssessmentAttempt,
} from "@/services/assessments";
import { createAssessmentSchema } from "./schemas";

export type AssessmentFormState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  score?: number;
  maxScore?: number;
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
  revalidatePath("/student/assessments");
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
    return;
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
}

export async function submitCreateAssessment(
  _prev: AssessmentFormState | null,
  formData: FormData,
): Promise<AssessmentFormState> {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN, RoleKey.LECTURER]);
  const institutionId = user.activeMembership?.institutionId;
  const institutionUserId = user.activeMembership?.institutionUserId;
  const role = user.activeMembership?.roleKey;

  if (!institutionId || !institutionUserId || !role) {
    return { ok: false, error: "No active institution membership found." };
  }

  const parsed = createAssessmentSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    description: formData.get("description"),
    timeLimitMins: formData.get("timeLimitMins")?.toString() ?? "",
    questionPrompt: formData.get("questionPrompt"),
    questionType: formData.get("questionType"),
    options: formData.get("options"),
    correctAnswer: formData.get("correctAnswer"),
    points: formData.get("points") || 1,
    published: formData.get("published") === "true" || formData.get("published") === "on",
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

    const options =
      parsed.data.options && parsed.data.options.trim().length > 0
        ? parsed.data.options.split("\n").map((o) => o.trim()).filter(Boolean)
        : parsed.data.questionType === "TRUE_FALSE"
          ? ["True", "False"]
          : null;

    const assessment = await createAssessment({
      institutionId,
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      timeLimitMins: parsed.data.timeLimitMins ?? null,
      createdByUserId: user.id,
      questions: [
        {
          prompt: parsed.data.questionPrompt,
          type: parsed.data.questionType as QuestionType,
          options,
          correctAnswer: parsed.data.correctAnswer,
          points: parsed.data.points,
        },
      ],
    });

    if (parsed.data.published) {
      await publishAssessment(assessment.id, institutionId);
    }

    revalidateCourse(parsed.data.courseId);
    return { ok: true, message: "Assessment created." };
  } catch (error) {
    console.error("Create assessment error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create assessment.",
    };
  }
}

export async function submitPublishAssessment(
  assessmentId: string,
  courseId: string,
): Promise<AssessmentFormState> {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN, RoleKey.LECTURER]);
  const institutionId = user.activeMembership?.institutionId;
  if (!institutionId) return { ok: false, error: "No active institution." };

  try {
    const result = await publishAssessment(assessmentId, institutionId);
    if (!result) return { ok: false, error: "Assessment not found." };
    revalidateCourse(courseId);
    return { ok: true, message: "Assessment published." };
  } catch (error) {
    console.error("Publish assessment error:", error);
    return { ok: false, error: "Failed to publish assessment." };
  }
}

export async function submitTakeAssessment(
  _prev: AssessmentFormState | null,
  formData: FormData,
): Promise<AssessmentFormState> {
  const user = await requireRole([RoleKey.STUDENT]);
  const assessmentId = String(formData.get("assessmentId") ?? "");
  if (!assessmentId) return { ok: false, error: "Missing assessment." };

  const answers: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("answer_") && typeof value === "string") {
      answers[key.replace("answer_", "")] = value;
    }
  }

  try {
    const attempt = await submitAssessmentAttempt({
      assessmentId,
      userId: user.id,
      answers,
    });

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });
    if (assessment) revalidateCourse(assessment.courseId);

    return {
      ok: true,
      message: "Attempt submitted.",
      score: attempt.score ?? 0,
      maxScore: attempt.maxScore ?? 0,
    };
  } catch (error) {
    console.error("Take assessment error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to submit attempt.",
    };
  }
}
