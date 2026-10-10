import "server-only";
import { notFound } from "next/navigation";
import { RoleKey, type LecturerProfile } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { SessionUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/permissions/rbac";

export type LecturerContext = {
  user: SessionUser;
  institutionId: string;
  institutionUserId: string;
  institutionName: string;
  lecturerProfile: LecturerProfile;
  courseIds: string[];
};

export async function requireLecturerContext(): Promise<LecturerContext> {
  const user = await requireRole([RoleKey.LECTURER]);
  const membership = user.activeMembership;

  if (!membership?.institutionId || !membership.institutionUserId) {
    notFound();
  }

  const lecturerProfile = await prisma.lecturerProfile.findUnique({
    where: { institutionUserId: membership.institutionUserId },
    include: { courses: { select: { id: true } } },
  });

  if (!lecturerProfile) {
    notFound();
  }

  return {
    user,
    institutionId: membership.institutionId,
    institutionUserId: membership.institutionUserId,
    institutionName: membership.institutionName || "ClassBridge Campus",
    lecturerProfile,
    courseIds: lecturerProfile.courses.map((c) => c.id),
  };
}

export async function assertLecturerOwnsCourse(
  lecturerProfileId: string,
  courseId: string,
  institutionId: string,
) {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      institutionId,
      lecturerProfileId,
    },
  });
  if (!course) notFound();
  return course;
}

export async function assertLecturerOwnsSession(
  lecturerProfileId: string,
  sessionId: string,
  institutionId: string,
) {
  const session = await prisma.classSession.findFirst({
    where: {
      id: sessionId,
      institutionId,
      course: { lecturerProfileId },
    },
    include: {
      course: { select: { id: true, code: true, title: true, lecturerProfileId: true } },
    },
  });
  if (!session) notFound();
  return session;
}
