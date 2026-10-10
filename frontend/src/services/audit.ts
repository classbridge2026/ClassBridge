import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export type AuditLogInput = {
  actorUserId?: string | null;
  institutionId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      institutionId: input.institutionId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

export type RecentAuditRow = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
  institutionName: string | null;
  metadata: Prisma.JsonValue | null;
};

export async function listRecentAuditLogs(take = 12): Promise<RecentAuditRow[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { fullName: true, email: true } },
      institution: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    createdAt: row.createdAt,
    actorName: row.actor?.fullName ?? null,
    actorEmail: row.actor?.email ?? null,
    institutionName: row.institution?.name ?? null,
    metadata: row.metadata,
  }));
}

export { formatAuditAction } from "@/lib/audit/format";
