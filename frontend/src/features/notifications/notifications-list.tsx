"use client";

import { useTransition } from "react";
import type { NotificationType } from "@prisma/client";
import { Bell, BellOff, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllAsRead, markAsRead } from "./actions";

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  readAt: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<NotificationType, string> = {
  CLASS_REMINDER: "Class reminder",
  RECORDING_PUBLISHED: "Recording",
  ENROLLMENT: "Enrollment",
  ANNOUNCEMENT: "Announcement",
  ASSIGNMENT: "Assignment",
  ASSESSMENT: "Assessment",
  MESSAGE: "Message",
  SYSTEM: "System",
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotificationsList({
  notifications,
}: {
  notifications: NotificationListItem[];
}) {
  const [pending, startTransition] = useTransition();
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  const handleMarkRead = (notificationId: string) => {
    startTransition(async () => {
      await markAsRead(notificationId);
    });
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllAsRead();
    });
  };

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-3 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <BellOff className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">No notifications yet</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Campus announcements, enrollments, and class alerts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {unreadCount === 0
            ? "All caught up"
            : unreadCount === 1
              ? "1 unread"
              : `${unreadCount} unread`}
        </p>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={handleMarkAll}
            className="h-9 gap-1.5 rounded-lg border-slate-300 text-xs font-semibold text-slate-700"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read
          </Button>
        ) : null}
      </div>

      <ul className="space-y-3">
        {notifications.map((item) => {
          const unread = !item.readAt;
          return (
            <li
              key={item.id}
              className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
                unread
                  ? "border-blue-200 bg-blue-50/40"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      unread
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {TYPE_LABELS[item.type]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {item.body}
                    </p>
                    <p className="text-xs text-slate-400">{formatWhen(item.createdAt)}</p>
                  </div>
                </div>

                {unread ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() => handleMarkRead(item.id)}
                    className="h-8 shrink-0 gap-1 rounded-lg border-slate-300 px-2.5 text-xs font-semibold text-slate-700"
                  >
                    {pending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Mark read
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
