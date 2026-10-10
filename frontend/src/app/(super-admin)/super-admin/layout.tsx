import type { ReactNode } from "react";
import { prisma } from "@/lib/db/prisma";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { getUnreadCount, listNotificationsForUser } from "@/services/notifications";
import { SuperAdminShell } from "@/components/super-admin/layout/shell";

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SA";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSuperAdminUser();

  const [dbUser, notifications, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: { fullName: true, email: true, avatarStorageKey: true },
    }),
    listNotificationsForUser(session.id, { take: 8 }),
    getUnreadCount(session.id),
  ]);

  const fullName = dbUser?.fullName ?? session.fullName;
  const email = dbUser?.email ?? session.email;

  return (
    <SuperAdminShell
      profile={{
        fullName,
        email,
        avatarInitials: initials(fullName),
        roleLabel: "Super Admin",
      }}
      notifications={notifications.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        createdAt: item.createdAt.toISOString(),
        readAt: item.readAt?.toISOString() ?? null,
      }))}
      unreadCount={unreadCount}
    >
      {children}
    </SuperAdminShell>
  );
}
