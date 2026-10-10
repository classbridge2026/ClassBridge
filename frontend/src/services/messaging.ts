import "server-only";
import { prisma } from "@/lib/db/prisma";
import { MembershipStatus, NotificationType } from "@prisma/client";
import { createNotification } from "@/services/notifications";

export async function listConversationsForUser(userId: string, institutionId: string) {
  return prisma.conversation.findMany({
    where: {
      institutionId,
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversation(
  conversationId: string,
  userId: string,
  institutionId: string,
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      institutionId,
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  if (conversation) {
    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });
  }

  return conversation;
}

export async function startConversation(input: {
  institutionId: string;
  creatorUserId: string;
  participantUserIds: string[];
  subject?: string | null;
  initialBody: string;
}) {
  const uniqueParticipants = [
    ...new Set([input.creatorUserId, ...input.participantUserIds]),
  ];

  const memberships = await prisma.institutionUser.findMany({
    where: {
      institutionId: input.institutionId,
      userId: { in: uniqueParticipants },
      status: MembershipStatus.ACTIVE,
    },
    select: { userId: true },
  });

  if (memberships.length !== uniqueParticipants.length) {
    throw new Error("All participants must be active members of this institution.");
  }

  const conversation = await prisma.conversation.create({
    data: {
      institutionId: input.institutionId,
      subject: input.subject ?? null,
      participants: {
        create: uniqueParticipants.map((userId) => ({ userId })),
      },
      messages: {
        create: {
          senderId: input.creatorUserId,
          body: input.initialBody,
        },
      },
    },
  });

  for (const userId of uniqueParticipants) {
    if (userId === input.creatorUserId) continue;
    await createNotification({
      institutionId: input.institutionId,
      userId,
      type: NotificationType.MESSAGE,
      title: "New message",
      body: input.subject
        ? `New conversation: ${input.subject}`
        : "You have a new private message.",
      resourceType: "Conversation",
      resourceId: conversation.id,
    });
  }

  return conversation;
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  institutionId: string;
  body: string;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      institutionId: input.institutionId,
      participants: { some: { userId: input.senderId } },
    },
    include: {
      participants: { select: { userId: true } },
    },
  });

  if (!conversation) throw new Error("Conversation not found.");

  const message = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderId,
      body: input.body,
    },
  });

  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: new Date() },
  });

  for (const p of conversation.participants) {
    if (p.userId === input.senderId) continue;
    await createNotification({
      institutionId: input.institutionId,
      userId: p.userId,
      type: NotificationType.MESSAGE,
      title: "New message",
      body: input.body.slice(0, 120),
      resourceType: "Conversation",
      resourceId: conversation.id,
    });
  }

  return message;
}

export async function listInstitutionDirectory(institutionId: string, excludeUserId: string) {
  return prisma.institutionUser.findMany({
    where: {
      institutionId,
      status: MembershipStatus.ACTIVE,
      userId: { not: excludeUserId },
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      role: { select: { key: true, name: true } },
    },
    orderBy: { user: { fullName: "asc" } },
  });
}
