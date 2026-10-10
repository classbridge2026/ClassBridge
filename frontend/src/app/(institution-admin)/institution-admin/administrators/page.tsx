import type { Metadata } from "next";
import { Suspense } from "react";
import { MembershipStatus, RoleKey } from "@prisma/client";
import { Shield } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { parsePage } from "@/lib/utils/pagination";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstEmptyState } from "@/components/institution-admin/shared/empty-state";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import {
  Pagination,
  SearchFilters,
} from "@/components/institution-admin/shared/search-filters";
import {
  AdministratorRowActions,
  AdministratorsManager,
} from "@/components/institution-admin/administrators/administrators-manager";

export const metadata: Metadata = {
  title: "Administrators — Institution Admin",
};

type SearchParams = Promise<{ q?: string; status?: string; page?: string; create?: string }>;

export default async function InstitutionAdminAdministratorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { institutionId, institutionUserId } = await requireInstitutionAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status =
    params.status === MembershipStatus.ACTIVE || params.status === MembershipStatus.INACTIVE
      ? params.status
      : undefined;

  const where = {
    institutionId,
    role: { key: RoleKey.INSTITUTION_ADMIN },
    ...(status ? { status } : {}),
    ...(q
      ? {
          user: {
            OR: [
              { fullName: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const total = await prisma.institutionUser.count({ where });
  const { page, pageSize, skip, totalPages } = parsePage(params.page, total);

  const administrators = await prisma.institutionUser.findMany({
    where,
    include: { user: true, role: true },
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
  });

  return (
    <div className="space-y-6">
      <InstPageHeader
        title="Administrators"
        description="Manage institution administrators for this campus. Super Admin accounts cannot be created here."
        actions={<AdministratorsManager defaultCreateOpen={params.create === "1"} />}
      />

      <Suspense fallback={<div className="h-20 animate-pulse rounded-2xl bg-slate-100" />}>
        <SearchFilters
          placeholder="Search name or email…"
          statusOptions={[
            { value: MembershipStatus.ACTIVE, label: "Active" },
            { value: MembershipStatus.INACTIVE, label: "Inactive" },
          ]}
        />
      </Suspense>

      {administrators.length === 0 ? (
        <InstEmptyState
          icon={Shield}
          title="No administrators found"
          description={
            q || status
              ? "Try adjusting your search or status filter."
              : "Invite another administrator to help manage this institution."
          }
          actionHref={q || status ? undefined : "/institution-admin/administrators?create=1"}
          actionLabel={q || status ? undefined : "Invite administrator"}
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Administrator</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {administrators.map((admin) => {
                    const row = {
                      id: admin.id,
                      fullName: admin.user.fullName,
                      email: admin.user.email,
                      status: admin.status,
                    };
                    const isSelf = admin.id === institutionUserId;
                    return (
                      <tr key={admin.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900">{admin.user.fullName}</p>
                          {isSelf ? (
                            <p className="text-[11px] font-medium text-blue-600">You</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{admin.user.email}</td>
                        <td className="px-4 py-3.5 text-slate-600">{admin.role.name}</td>
                        <td className="px-4 py-3.5">
                          <InstStatusBadge status={admin.status} />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {admin.createdAt.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <AdministratorRowActions admin={row} isSelf={isSelf} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Suspense fallback={null}>
            <Pagination page={page} totalPages={totalPages} total={total} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
