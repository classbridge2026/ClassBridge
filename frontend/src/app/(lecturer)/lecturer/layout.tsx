import type { ReactNode } from "react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/permissions/rbac";
import { RoleKey } from "@prisma/client";
import { LecturerShell } from "@/components/lecturer/layout/shell";

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "LC";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export default async function LecturerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole([RoleKey.LECTURER]);
  const institutionName = user.activeMembership?.institutionName || "ClassBridge Campus";

  const [dbUser, unreadNotifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true, email: true },
    }),
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
  ]);

  const fullName = dbUser?.fullName ?? user.fullName;
  const email = dbUser?.email ?? user.email;

  return (
    <LecturerShell
      institutionName={institutionName}
      unreadNotifications={unreadNotifications}
      profile={{
        fullName,
        email,
        avatarInitials: initials(fullName),
        roleLabel: "Lecturer",
      }}
    >
      {children}
    </LecturerShell>
  );
}
