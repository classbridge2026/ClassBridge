import { z } from "zod";

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Enter a title of at least 3 characters.")
    .max(120, "Title must be 120 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(5, "Enter a message of at least 5 characters.")
    .max(2000, "Message must be 2000 characters or fewer."),
});

export const markReadSchema = z.object({
  notificationId: z.string().uuid("Invalid notification id."),
});

export const updatePreferencesSchema = z.object({
  emailEnabled: z.coerce.boolean().optional(),
  inAppEnabled: z.coerce.boolean().optional(),
  classReminders: z.coerce.boolean().optional(),
  announcements: z.coerce.boolean().optional(),
  assignments: z.coerce.boolean().optional(),
  messages: z.coerce.boolean().optional(),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
