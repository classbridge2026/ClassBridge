import "server-only";
import { prisma } from "@/lib/db/prisma";
import { MembershipStatus, NotificationType, type Prisma } from "@prisma/client";

export type CreateNotificationInput = {
  institutionId?: string | null;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType?: string | null;
  resourceId?: string | null;
};

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      institutionId: input.institutionId ?? null,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
    },
  });
}

export async function createNotificationsForUsers(
  userIds: string[],
  payload: Omit<CreateNotificationInput, "userId">,
) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return { count: 0 };

  const data: Prisma.NotificationCreateManyInput[] = uniqueIds.map((userId) => ({
    institutionId: payload.institutionId ?? null,
    userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    resourceType: payload.resourceType ?? null,
    resourceId: payload.resourceId ?? null,
  }));

  return prisma.notification.createMany({ data });
}

export async function notifyCourseEnrolledStudents(
  courseId: string,
  payload: Omit<CreateNotificationInput, "userId" | "institutionId"> & {
    institutionId?: string;
  },
) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId },
    select: {
      studentProfile: {
        select: {
          institutionId: true,
          institutionUser: { select: { userId: true } },
        },
      },
    },
  });

  const userIds = enrollments.map((e) => e.studentProfile.institutionUser.userId);
  const institutionId =
    payload.institutionId ?? enrollments[0]?.studentProfile.institutionId ?? null;

  return createNotificationsForUsers(userIds, { ...payload, institutionId });
}

export async function listNotificationsForUser(
  userId: string,
  options?: { unreadOnly?: boolean; take?: number },
) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(options?.unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.take ?? 50,
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function sendAnnouncement(input: {
  institutionId: string;
  title: string;
  body: string;
  actorUserId: string;
}) {
  const members = await prisma.institutionUser.findMany({
    where: {
      institutionId: input.institutionId,
      status: MembershipStatus.ACTIVE,
    },
    select: { userId: true },
  });

  const result = await createNotificationsForUsers(
    members.map((m) => m.userId),
    {
      institutionId: input.institutionId,
      type: NotificationType.ANNOUNCEMENT,
      title: input.title,
      body: input.body,
      resourceType: "announcement",
    },
  );

  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      institutionId: input.institutionId,
      action: "announcement.send",
      resourceType: "Notification",
      metadata: { title: input.title, recipientCount: result.count },
    },
  });

  return result;
}
