import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/permissions/rbac";
import { RoleKey, SessionStatus } from "@prisma/client";
import type { LiveClassRole, LiveClassSessionPayload } from "@/features/live-class/types";

export async function loadLiveClassSession(
  sessionId: string,
): Promise<{ ok: true; data: LiveClassSessionPayload } | { ok: false; error: string; status: number }> {
  const user = await requireAuthUser();
  const membership = user.activeMembership;

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          title: true,
          lecturerProfileId: true,
          lecturerProfile: {
            include: {
              institutionUser: {
                include: { user: { select: { fullName: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return { ok: false, error: "Class session not found.", status: 404 };
  }

  if (!user.isPlatformSuperAdmin && (!membership || session.institutionId !== membership.institutionId)) {
    return { ok: false, error: "You do not have access to this institution's class.", status: 403 };
  }

  const lecturerName =
    session.course.lecturerProfile?.institutionUser.user.fullName ?? null;

  let role: LiveClassRole = "observer";
  let canJoin = false;
  let canStart = false;
  let blockReason: string | null = null;
  let backHref = "/";

  const roleKey = membership?.roleKey;

  if (user.isPlatformSuperAdmin || roleKey === RoleKey.INSTITUTION_ADMIN) {
    role = "observer";
    backHref = roleKey === RoleKey.INSTITUTION_ADMIN ? "/institution-admin/classes" : "/super-admin";
    if (session.status === SessionStatus.LIVE) {
      canJoin = true;
    } else if (session.status === SessionStatus.SCHEDULED) {
      canStart = true;
      canJoin = true;
      role = "host";
    } else {
      blockReason = "This class session has ended.";
    }
  } else if (roleKey === RoleKey.LECTURER) {
    backHref = "/lecturer/classes";
    const lecturerProfile = membership?.institutionUserId
      ? await prisma.lecturerProfile.findUnique({
          where: { institutionUserId: membership.institutionUserId },
        })
      : null;

    const isAssigned = session.course.lecturerProfileId === lecturerProfile?.id;
    if (!isAssigned) {
      return { ok: false, error: "You are not assigned as the lecturer for this class.", status: 403 };
    }

    role = "host";
    if (session.status === SessionStatus.SCHEDULED) {
      canStart = true;
      canJoin = true;
    } else if (session.status === SessionStatus.LIVE) {
      canJoin = true;
    } else {
      blockReason = "This class session has ended.";
    }
  } else if (roleKey === RoleKey.STUDENT) {
    backHref = "/student/classes";
    const studentProfile = membership?.institutionUserId
      ? await prisma.studentProfile.findUnique({
          where: { institutionUserId: membership.institutionUserId },
        })
      : null;

    if (!studentProfile) {
      return { ok: false, error: "Student profile not found.", status: 403 };
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
      return { ok: false, error: "You are not enrolled in this course.", status: 403 };
    }

    role = "student";
    if (session.status === SessionStatus.SCHEDULED) {
      blockReason = "Class has not been started by the instructor yet.";
    } else if (session.status === SessionStatus.LIVE) {
      canJoin = true;
    } else {
      blockReason = "This class session has ended.";
    }
  } else {
    return { ok: false, error: "Your role cannot join live classes.", status: 403 };
  }

  return {
    ok: true,
    data: {
      id: session.id,
      title: session.title,
      roomName: session.roomName,
      status: session.status,
      startedAt: session.startedAt?.toISOString() ?? null,
      endedAt: session.endedAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
      course: {
        id: session.course.id,
        code: session.course.code,
        title: session.course.title,
      },
      lecturerName,
      role,
      canJoin,
      canStart,
      blockReason,
      backHref,
      viewerName: user.fullName,
    },
  };
}
