import type { Metadata } from "next";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/db/prisma";
import { ActivityMonitor } from "@/components/super-admin/activity/activity-monitor";

export const metadata: Metadata = {
  title: "Activity Monitor — Super Admin",
};

export default async function SuperAdminActivityPage() {
  await requireSuperAdminUser();

  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actor: { select: { fullName: true, email: true } },
      institution: { select: { name: true } },
    },
  });

  return (
    <ActivityMonitor
      rows={rows.map((row) => ({
        id: row.id,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        createdAt: row.createdAt.toISOString(),
        actorName: row.actor?.fullName ?? null,
        actorEmail: row.actor?.email ?? null,
        institutionName: row.institution?.name ?? null,
        metadata: row.metadata ? JSON.stringify(row.metadata, null, 2) : null,
      }))}
    />
  );
}
