import type { Metadata } from "next";
import { Suspense } from "react";
import { Activity } from "lucide-react";
import { Prisma } from "@prisma/client";
import { requireInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { parsePage } from "@/lib/utils/pagination";
import { formatAuditAction } from "@/lib/audit/format";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstEmptyState } from "@/components/institution-admin/shared/empty-state";
import { SearchFilters, Pagination } from "@/components/institution-admin/shared/search-filters";

export const metadata: Metadata = {
  title: "Activity — Institution Admin",
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { institutionId } = await requireInstitutionAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";

  const where: Prisma.AuditLogWhereInput = {
    institutionId,
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" } },
            { resourceType: { contains: q, mode: "insensitive" } },
            { actor: { fullName: { contains: q, mode: "insensitive" } } },
            { actor: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const total = await prisma.auditLog.count({ where });
  const { page, pageSize, skip, totalPages } = parsePage(params.page, total, 30);

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
    include: {
      actor: { select: { fullName: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <InstPageHeader
        title="Activity"
        description="Audit trail of actions belonging to your institution."
      />

      <Suspense fallback={null}>
        <SearchFilters placeholder="Search action, resource, or actor…" />
      </Suspense>

      {logs.length === 0 ? (
        <InstEmptyState
          icon={Activity}
          title="No activity yet"
          description="Institution actions will appear here as administrators manage people and academics."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatAuditAction(log.action)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {log.actor?.fullName ?? "System"}
                      {log.actor?.email ? ` · ${log.actor.email}` : null}
                      {" · "}
                      {log.resourceType}
                      {log.resourceId ? (
                        <span className="font-mono"> · {log.resourceId.slice(0, 8)}…</span>
                      ) : null}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-slate-400">
                    {log.createdAt.toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          </div>
          <Suspense fallback={null}>
            <Pagination page={page} totalPages={totalPages} total={total} />
          </Suspense>
        </>
      )}
    </div>
  );
}
