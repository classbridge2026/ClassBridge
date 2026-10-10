import "server-only";
import { prisma } from "@/lib/db/prisma";
import { RoleKey, SessionStatus } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";

export type ClassSessionAccess = {
  session: {
    id: string;
    institutionId: string;
    courseId: string;
    status: SessionStatus;
    roomName: string;
    title: string;
  };
  isHost: boolean;
  canChat: boolean;
  canAnnounce: boolean;
};

export async function resolveClassSessionAccess(
  user: SessionUser,
  sessionId: string,
): Promise<{ ok: true; data: ClassSessionAccess } | { ok: false; status: number; error: string }> {
  const membership = user.activeMembership;

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      institutionId: true,
      courseId: true,
      status: true,
      roomName: true,
      title: true,
      course: { select: { lecturerProfileId: true } },
    },
  });

  if (!session) {
    return { ok: false, status: 404, error: "Class session not found." };
  }

  if (!user.isPlatformSuperAdmin && (!membership || session.institutionId !== membership.institutionId)) {
    return { ok: false, status: 403, error: "You do not have access to this class." };
  }

  let isHost = false;
  let canJoin = false;

  if (user.isPlatformSuperAdmin || membership?.roleKey === RoleKey.INSTITUTION_ADMIN) {
    isHost = true;
    canJoin = session.status === SessionStatus.LIVE || session.status === SessionStatus.SCHEDULED;
  } else if (membership?.roleKey === RoleKey.LECTURER && membership.institutionUserId) {
    const lecturerProfile = await prisma.lecturerProfile.findUnique({
      where: { institutionUserId: membership.institutionUserId },
    });
    if (!lecturerProfile || session.course.lecturerProfileId !== lecturerProfile.id) {
      return { ok: false, status: 403, error: "You are not assigned as the lecturer for this class." };
    }
    isHost = true;
    canJoin = session.status === SessionStatus.LIVE || session.status === SessionStatus.SCHEDULED;
  } else if (membership?.roleKey === RoleKey.STUDENT && membership.institutionUserId) {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { institutionUserId: membership.institutionUserId },
    });
    if (!studentProfile) {
      return { ok: false, status: 403, error: "Student profile not found." };
    }
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentProfileId: {
          courseId: session.courseId,
          studentProfileId: studentProfile.id,
        },
      },
    });
    if (!enrollment) {
      return { ok: false, status: 403, error: "You are not enrolled in this course." };
    }
    canJoin = session.status === SessionStatus.LIVE;
    if (session.status === SessionStatus.SCHEDULED) {
      return { ok: false, status: 403, error: "Class has not been started by the instructor yet." };
    }
  } else {
    return { ok: false, status: 403, error: "Your role cannot access this class." };
  }

  if (!canJoin && session.status !== SessionStatus.LIVE && session.status !== SessionStatus.COMPLETED) {
    return { ok: false, status: 403, error: "This class is not available." };
  }

  // Chat policy (extensible): everyone can message while LIVE; hosts can announce.
  const canChat = session.status === SessionStatus.LIVE || session.status === SessionStatus.COMPLETED;
  const canAnnounce = isHost && session.status === SessionStatus.LIVE;

  return {
    ok: true,
    data: {
      session: {
        id: session.id,
        institutionId: session.institutionId,
        courseId: session.courseId,
        status: session.status,
        roomName: session.roomName,
        title: session.title,
      },
      isHost,
      canChat,
      canAnnounce,
    },
  };
}
