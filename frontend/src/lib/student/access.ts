import "server-only";
import { notFound } from "next/navigation";
import { RoleKey, type StudentProfile } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { SessionUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/permissions/rbac";

export type StudentContext = {
  user: SessionUser;
  institutionId: string;
  institutionUserId: string;
  institutionName: string;
  studentProfile: StudentProfile;
  courseIds: string[];
};

export async function requireStudentContext(): Promise<StudentContext> {
  const user = await requireRole([RoleKey.STUDENT]);
  const membership = user.activeMembership;

  if (!membership?.institutionId || !membership.institutionUserId) {
    notFound();
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { institutionUserId: membership.institutionUserId },
    include: { enrollments: { select: { courseId: true } } },
  });

  if (!studentProfile) {
    notFound();
  }

  return {
    user,
    institutionId: membership.institutionId,
    institutionUserId: membership.institutionUserId,
    institutionName: membership.institutionName || "ClassBridge Campus",
    studentProfile,
    courseIds: studentProfile.enrollments.map((e) => e.courseId),
  };
}

export async function assertStudentEnrolledInCourse(
  studentProfileId: string,
  courseId: string,
  institutionId: string,
) {
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      studentProfileId,
      courseId,
      course: { institutionId },
    },
    include: {
      course: true,
    },
  });
  if (!enrollment) notFound();
  return enrollment;
}

export async function assertStudentCanAccessSession(
  studentProfileId: string,
  sessionId: string,
  institutionId: string,
) {
  const session = await prisma.classSession.findFirst({
    where: {
      id: sessionId,
      institutionId,
      course: {
        enrollments: { some: { studentProfileId } },
      },
    },
    include: {
      course: { select: { id: true, code: true, title: true } },
    },
  });
  if (!session) notFound();
  return session;
}
