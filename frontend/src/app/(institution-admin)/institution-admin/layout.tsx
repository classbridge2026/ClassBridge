import type { ReactNode } from "react";
import { prisma } from "@/lib/db/prisma";
import { requireInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { InstitutionAdminShell } from "@/components/institution-admin/layout/shell";

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "IA";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export default async function InstitutionAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, institutionName } = await requireInstitutionAdmin();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullName: true, email: true },
  });

  const fullName = dbUser?.fullName ?? user.fullName;
  const email = dbUser?.email ?? user.email;

  return (
    <InstitutionAdminShell
      institutionName={institutionName}
      profile={{
        fullName,
        email,
        avatarInitials: initials(fullName),
        roleLabel: "Institution Admin",
      }}
    >
      {children}
    </InstitutionAdminShell>
  );
}
