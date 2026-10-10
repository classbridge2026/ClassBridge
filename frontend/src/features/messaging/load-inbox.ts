import "server-only";
import type { SessionUser } from "@/lib/auth/session";
import {
  getConversation,
  listConversationsForUser,
  listInstitutionDirectory,
} from "@/services/messaging";
import type {
  ConversationMessage,
  ConversationSummary,
  DirectoryUser,
} from "./messages-client";

export async function loadMessagingInbox(user: SessionUser) {
  const institutionId = user.activeMembership?.institutionId;
  if (!institutionId) {
    return { conversations: [] as ConversationSummary[], directory: [] as DirectoryUser[] };
  }

  const [rawConversations, rawDirectory] = await Promise.all([
    listConversationsForUser(user.id, institutionId),
    listInstitutionDirectory(institutionId, user.id),
  ]);

  const conversations: ConversationSummary[] = rawConversations.map((c) => ({
    id: c.id,
    subject: c.subject,
    updatedAt: c.updatedAt.toISOString(),
    otherParticipants: c.participants
      .filter((p) => p.userId !== user.id)
      .map((p) => p.user.fullName)
      .join(", "),
    lastMessage: c.messages[0]?.body ?? null,
  }));

  const directory: DirectoryUser[] = rawDirectory.map((m) => ({
    userId: m.user.id,
    fullName: m.user.fullName,
    email: m.user.email,
    roleName: m.role.name,
  }));

  return { conversations, directory };
}

export async function loadMessagingThread(user: SessionUser, conversationId: string) {
  const institutionId = user.activeMembership?.institutionId;
  if (!institutionId) return null;

  const conversation = await getConversation(conversationId, user.id, institutionId);
  if (!conversation) return null;

  const messages: ConversationMessage[] = conversation.messages.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    senderName: m.sender.fullName,
    isMine: m.senderId === user.id,
  }));

  return {
    id: conversation.id,
    subject: conversation.subject,
    participants: conversation.participants.map((p) => p.user.fullName).join(", "),
    messages,
  };
}
