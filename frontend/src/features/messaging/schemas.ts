import { z } from "zod";

export const startConversationSchema = z.object({
  participantUserId: z.string().uuid(),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().min(1).max(5000),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
});
