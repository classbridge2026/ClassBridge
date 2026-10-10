"use server";

import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser, requireRole } from "@/lib/permissions/rbac";
import {
  markAllNotificationsRead,
  markNotificationRead,
  sendAnnouncement,
} from "@/services/notifications";
import {
  announcementSchema,
  markReadSchema,
  updatePreferencesSchema,
} from "./schemas";

export type NotificationFormState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
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

function revalidateNotificationPaths() {
  revalidatePath("/admin/notifications");
  revalidatePath("/lecturer/notifications");
  revalidatePath("/lecturer/settings");
  revalidatePath("/student/notifications");
  revalidatePath("/student/settings");
}

export async function submitAnnouncement(
  _previous: NotificationFormState | null,
  formData: FormData,
): Promise<NotificationFormState> {
  const admin = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = admin.activeMembership?.institutionId;

  if (!institutionId) {
    return { ok: false, error: "No active institution membership found." };
  }

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
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
    const { count } = await sendAnnouncement({
      institutionId,
      title: parsed.data.title,
      body: parsed.data.body,
      actorUserId: admin.id,
    });

    revalidateNotificationPaths();

    return {
      ok: true,
      message:
        count === 1
          ? "Announcement sent to 1 campus member."
          : `Announcement sent to ${count} campus members.`,
    };
  } catch (error) {
    console.error("Submit announcement error:", error);
    return { ok: false, error: "Failed to send announcement." };
  }
}

export async function markAsRead(notificationId: string): Promise<NotificationFormState> {
  const user = await requireAuthUser();

  const parsed = markReadSchema.safeParse({ notificationId });
  if (!parsed.success) {
    return { ok: false, error: "Invalid notification." };
  }

  try {
    const updated = await markNotificationRead(user.id, parsed.data.notificationId);
    if (updated.count === 0) {
      return { ok: false, error: "Notification not found or already read." };
    }

    revalidateNotificationPaths();
    return { ok: true, message: "Marked as read." };
  } catch (error) {
    console.error("Mark as read error:", error);
    return { ok: false, error: "Failed to mark notification as read." };
  }
}

export async function markAllAsRead(): Promise<NotificationFormState> {
  const user = await requireAuthUser();

  try {
    const result = await markAllNotificationsRead(user.id);
    revalidateNotificationPaths();
    return {
      ok: true,
      message:
        result.count === 0
          ? "No unread notifications."
          : result.count === 1
            ? "Marked 1 notification as read."
            : `Marked ${result.count} notifications as read.`,
    };
  } catch (error) {
    console.error("Mark all as read error:", error);
    return { ok: false, error: "Failed to mark notifications as read." };
  }
}

export async function updatePreferences(
  _previous: NotificationFormState | null,
  formData: FormData,
): Promise<NotificationFormState> {
  const user = await requireAuthUser();
  const institutionId = user.activeMembership?.institutionId ?? null;

  const boolFromForm = (name: string): boolean | undefined => {
    const value = formData.get(name);
    if (value === null) return undefined;
    return value === "on" || value === "true" || value === "1";
  };

  const parsed = updatePreferencesSchema.safeParse({
    emailEnabled: boolFromForm("emailEnabled"),
    inAppEnabled: boolFromForm("inAppEnabled"),
    classReminders: boolFromForm("classReminders"),
    announcements: boolFromForm("announcements"),
    assignments: boolFromForm("assignments"),
    messages: boolFromForm("messages"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = {
    emailEnabled: parsed.data.emailEnabled ?? true,
    inAppEnabled: parsed.data.inAppEnabled ?? true,
    classReminders: parsed.data.classReminders ?? true,
    announcements: parsed.data.announcements ?? true,
    assignments: parsed.data.assignments ?? true,
    messages: parsed.data.messages ?? true,
  };

  try {
    const existing = await prisma.notificationPreference.findFirst({
      where: { userId: user.id, institutionId },
    });

    if (existing) {
      await prisma.notificationPreference.update({
        where: { id: existing.id },
        data: {
          ...(parsed.data.emailEnabled !== undefined
            ? { emailEnabled: parsed.data.emailEnabled }
            : {}),
          ...(parsed.data.inAppEnabled !== undefined
            ? { inAppEnabled: parsed.data.inAppEnabled }
            : {}),
          ...(parsed.data.classReminders !== undefined
            ? { classReminders: parsed.data.classReminders }
            : {}),
          ...(parsed.data.announcements !== undefined
            ? { announcements: parsed.data.announcements }
            : {}),
          ...(parsed.data.assignments !== undefined
            ? { assignments: parsed.data.assignments }
            : {}),
          ...(parsed.data.messages !== undefined
            ? { messages: parsed.data.messages }
            : {}),
        },
      });
    } else {
      await prisma.notificationPreference.create({
        data: {
          userId: user.id,
          institutionId,
          ...data,
        },
      });
    }

    revalidateNotificationPaths();
    return { ok: true, message: "Notification preferences saved." };
  } catch (error) {
    console.error("Update preferences error:", error);
    return { ok: false, error: "Failed to update preferences." };
  }
}
