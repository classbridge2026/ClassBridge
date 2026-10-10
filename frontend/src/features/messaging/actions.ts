"use server";

import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { RoleKey } from "@prisma/client";
import { requireRole } from "@/lib/permissions/rbac";
import { sendMessage, startConversation } from "@/services/messaging";
import { sendMessageSchema, startConversationSchema } from "./schemas";

export type MessagingFormState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  conversationId?: string;
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

function revalidateMessages(conversationId?: string) {
  revalidatePath("/admin/messages");
  revalidatePath("/lecturer/messages");
  revalidatePath("/student/messages");
  if (conversationId) {
    revalidatePath(`/admin/messages/${conversationId}`);
    revalidatePath(`/lecturer/messages/${conversationId}`);
    revalidatePath(`/student/messages/${conversationId}`);
  }
}

export async function submitStartConversation(
  _prev: MessagingFormState | null,
  formData: FormData,
): Promise<MessagingFormState> {
  const user = await requireRole([
    RoleKey.INSTITUTION_ADMIN,
    RoleKey.LECTURER,
    RoleKey.STUDENT,
  ]);
  const institutionId = user.activeMembership?.institutionId;
  if (!institutionId) return { ok: false, error: "No active institution." };

  const parsed = startConversationSchema.safeParse({
    participantUserId: formData.get("participantUserId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const conversation = await startConversation({
      institutionId,
      creatorUserId: user.id,
      participantUserIds: [parsed.data.participantUserId],
      subject: parsed.data.subject || null,
      initialBody: parsed.data.body,
    });
    revalidateMessages(conversation.id);
    return {
      ok: true,
      message: "Conversation started.",
      conversationId: conversation.id,
    };
  } catch (error) {
    console.error("Start conversation error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to start conversation.",
    };
  }
}

export async function submitSendMessage(
  _prev: MessagingFormState | null,
  formData: FormData,
): Promise<MessagingFormState> {
  const user = await requireRole([
    RoleKey.INSTITUTION_ADMIN,
    RoleKey.LECTURER,
    RoleKey.STUDENT,
  ]);
  const institutionId = user.activeMembership?.institutionId;
  if (!institutionId) return { ok: false, error: "No active institution." };

  const parsed = sendMessageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await sendMessage({
      conversationId: parsed.data.conversationId,
      senderId: user.id,
      institutionId,
      body: parsed.data.body,
    });
    revalidateMessages(parsed.data.conversationId);
    return { ok: true, message: "Message sent." };
  } catch (error) {
    console.error("Send message error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send message.",
    };
  }
}
