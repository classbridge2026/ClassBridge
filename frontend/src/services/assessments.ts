import "server-only";
import { prisma } from "@/lib/db/prisma";
import { NotificationType, type QuestionType, type Prisma } from "@prisma/client";
import { createNotificationsForUsers } from "@/services/notifications";

export type QuestionInput = {
  prompt: string;
  type: QuestionType;
  options?: string[] | null;
  correctAnswer: string;
  points?: number;
};

export async function listAssessmentsForCourse(courseId: string, institutionId: string) {
  return prisma.assessment.findMany({
    where: { courseId, institutionId },
    include: {
      _count: { select: { questions: true, attempts: true } },
      createdBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAssessment(input: {
  institutionId: string;
  courseId: string;
  title: string;
  description?: string | null;
  timeLimitMins?: number | null;
  createdByUserId: string;
  questions: QuestionInput[];
}) {
  return prisma.assessment.create({
    data: {
      institutionId: input.institutionId,
      courseId: input.courseId,
      title: input.title,
      description: input.description ?? null,
      timeLimitMins: input.timeLimitMins ?? null,
      createdByUserId: input.createdByUserId,
      questions: {
        create: input.questions.map((q, index) => ({
          prompt: q.prompt,
          type: q.type,
          options: q.options ?? undefined,
          correctAnswer: q.correctAnswer,
          points: q.points ?? 1,
          sortOrder: index,
        })),
      },
    },
    include: { questions: true },
  });
}

export async function publishAssessment(assessmentId: string, institutionId: string) {
  const updated = await prisma.assessment.updateMany({
    where: { id: assessmentId, institutionId },
    data: { published: true },
  });
  if (updated.count === 0) return null;

  const full = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      course: {
        include: {
          enrollments: {
            select: {
              studentProfile: {
                select: { institutionUser: { select: { userId: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!full) return null;

  await createNotificationsForUsers(
    full.course.enrollments.map((e) => e.studentProfile.institutionUser.userId),
    {
      institutionId,
      type: NotificationType.ASSESSMENT,
      title: `New assessment: ${full.title}`,
      body: `An assessment was published for ${full.course.code}.`,
      resourceType: "Assessment",
      resourceId: full.id,
    },
  );

  return full;
}

export async function getAssessmentForStudent(assessmentId: string, institutionId: string) {
  return prisma.assessment.findFirst({
    where: { id: assessmentId, institutionId, published: true },
    include: {
      questions: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          prompt: true,
          type: true,
          options: true,
          points: true,
          sortOrder: true,
        },
      },
    },
  });
}

export async function submitAssessmentAttempt(input: {
  assessmentId: string;
  userId: string;
  answers: Record<string, string>;
}) {
  const assessment = await prisma.assessment.findFirst({
    where: { id: input.assessmentId, published: true },
    include: { questions: true },
  });
  if (!assessment) throw new Error("Assessment not found or not published.");

  let score = 0;
  let maxScore = 0;
  for (const q of assessment.questions) {
    maxScore += q.points;
    const answer = (input.answers[q.id] ?? "").trim().toLowerCase();
    const correct = q.correctAnswer.trim().toLowerCase();
    if (answer === correct) score += q.points;
  }

  return prisma.assessmentAttempt.upsert({
    where: {
      assessmentId_userId: {
        assessmentId: input.assessmentId,
        userId: input.userId,
      },
    },
    create: {
      assessmentId: input.assessmentId,
      userId: input.userId,
      answers: input.answers as Prisma.InputJsonValue,
      score,
      maxScore,
    },
    update: {
      answers: input.answers as Prisma.InputJsonValue,
      score,
      maxScore,
      submittedAt: new Date(),
    },
  });
}

export async function getAttempt(assessmentId: string, userId: string) {
  return prisma.assessmentAttempt.findUnique({
    where: {
      assessmentId_userId: { assessmentId, userId },
    },
  });
}
