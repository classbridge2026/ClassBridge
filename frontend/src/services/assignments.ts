import "server-only";
import { prisma } from "@/lib/db/prisma";
import { NotificationType } from "@prisma/client";
import { createNotificationsForUsers } from "@/services/notifications";

export async function listAssignmentsForCourse(courseId: string, institutionId: string) {
  return prisma.assignment.findMany({
    where: { courseId, institutionId },
    include: {
      _count: { select: { submissions: true } },
      createdBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAssignment(input: {
  institutionId: string;
  courseId: string;
  title: string;
  description?: string | null;
  dueAt?: Date | null;
  createdByUserId: string;
  published?: boolean;
}) {
  return prisma.assignment.create({
    data: {
      institutionId: input.institutionId,
      courseId: input.courseId,
      title: input.title,
      description: input.description ?? null,
      dueAt: input.dueAt ?? null,
      published: input.published ?? false,
      createdByUserId: input.createdByUserId,
    },
  });
}

export async function publishAssignment(assignmentId: string, institutionId: string) {
  const assignment = await prisma.assignment.updateMany({
    where: { id: assignmentId, institutionId },
    data: { published: true },
  });

  if (assignment.count === 0) return null;

  const full = await prisma.assignment.findUnique({
    where: { id: assignmentId },
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

  const userIds = full.course.enrollments.map(
    (e) => e.studentProfile.institutionUser.userId,
  );

  await createNotificationsForUsers(userIds, {
    institutionId,
    type: NotificationType.ASSIGNMENT,
    title: `New assignment: ${full.title}`,
    body: `An assignment was published for ${full.course.code}.`,
    resourceType: "Assignment",
    resourceId: full.id,
  });

  return full;
}

export async function submitAssignmentWork(input: {
  assignmentId: string;
  userId: string;
  textContent?: string | null;
  storageKey?: string | null;
  fileName?: string | null;
}) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: input.assignmentId, published: true },
  });
  if (!assignment) throw new Error("Assignment not found or not published.");

  const fileUpdate =
    input.storageKey != null
      ? { storageKey: input.storageKey, fileName: input.fileName ?? null }
      : {};

  return prisma.assignmentSubmission.upsert({
    where: {
      assignmentId_userId: {
        assignmentId: input.assignmentId,
        userId: input.userId,
      },
    },
    create: {
      assignmentId: input.assignmentId,
      userId: input.userId,
      textContent: input.textContent ?? null,
      storageKey: input.storageKey ?? null,
      fileName: input.fileName ?? null,
    },
    update: {
      textContent: input.textContent ?? null,
      ...fileUpdate,
      submittedAt: new Date(),
      grade: null,
      feedback: null,
      gradedAt: null,
      gradedByUserId: null,
    },
  });
}

export async function gradeSubmission(input: {
  submissionId: string;
  grade: number;
  feedback?: string | null;
  gradedByUserId: string;
  institutionId: string;
}) {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: input.submissionId },
    include: { assignment: true },
  });

  if (!submission || submission.assignment.institutionId !== input.institutionId) {
    throw new Error("Submission not found.");
  }

  return prisma.assignmentSubmission.update({
    where: { id: input.submissionId },
    data: {
      grade: input.grade,
      feedback: input.feedback ?? null,
      gradedAt: new Date(),
      gradedByUserId: input.gradedByUserId,
    },
  });
}

export async function listSubmissionsForAssignment(
  assignmentId: string,
  institutionId: string,
) {
  return prisma.assignmentSubmission.findMany({
    where: {
      assignmentId,
      assignment: { institutionId },
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { submittedAt: "desc" },
  });
}
