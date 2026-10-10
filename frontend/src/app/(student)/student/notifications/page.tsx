import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { RoleKey } from "@prisma/client";
import { requireRole } from "@/lib/permissions/rbac";
import {
  getUnreadCount,
  listNotificationsForUser,
} from "@/services/notifications";
import {
  NotificationsList,
  type NotificationListItem,
} from "@/features/notifications/notifications-list";

export const metadata: Metadata = {
  title: "Notifications — Student Portal",
};

function toListItems(
  notifications: Awaited<ReturnType<typeof listNotificationsForUser>>,
): NotificationListItem[] {
  return notifications.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    resourceType: item.resourceType,
    resourceId: item.resourceId,
    readAt: item.readAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  }));
}

export default async function StudentNotificationsPage() {
  const user = await requireRole([RoleKey.STUDENT]);
  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser(user.id, { take: 50 }),
    getUnreadCount(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="h-6 w-6 text-indigo-600" />
          <span>Notifications &amp; Announcements</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Campus updates and course alerts for{" "}
          {user.activeMembership?.institutionName}.
          {unreadCount > 0
            ? ` ${unreadCount} unread.`
            : " All caught up."}
        </p>
      </div>

      <NotificationsList notifications={toListItems(notifications)} />
    </div>
  );
}
