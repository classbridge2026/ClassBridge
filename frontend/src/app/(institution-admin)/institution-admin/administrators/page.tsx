import type { Metadata } from "next";
import { Suspense } from "react";
import { MembershipStatus } from "@prisma/client";
import { Shield } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireFullInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { INSTITUTION_STAFF_ROLES } from "@/lib/permissions/institution-privileges";
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
import { UserAvatar } from "@/components/super-admin/shared/user-avatar";
import { storageAdapter } from "@/lib/storage/adapter";

export const metadata: Metadata = {
  title: "Administrators — Institution Admin",
};

type SearchParams = Promise<{ q?: string; status?: string; page?: string; create?: string }>;

export default async function InstitutionAdminAdministratorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { institutionId, institutionUserId } = await requireFullInstitutionAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status =
    params.status === MembershipStatus.ACTIVE || params.status === MembershipStatus.INACTIVE
      ? params.status
      : undefined;

  const where = {
    institutionId,
    role: { key: { in: INSTITUTION_STAFF_ROLES } },
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
        description="Manage Institution Admins and campus officers (Exam, Finance, Admin)."
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
              : "Invite an administrator or campus officer to help manage this institution."
          }
          actionHref={q || status ? undefined : "/institution-admin/administrators?create=1"}
          actionLabel={q || status ? undefined : "Invite administrator"}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:hidden">
            {administrators.map((admin) => {
              const avatarUrl = admin.user.avatarStorageKey
                ? storageAdapter.getFileUrl(admin.user.avatarStorageKey)
                : null;
              const isSelf = admin.id === institutionUserId;
              return (
                <div
                  key={admin.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <UserAvatar name={admin.user.fullName} src={avatarUrl} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {admin.user.fullName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{admin.user.email}</p>
                        <p className="mt-1 text-xs font-medium text-slate-600">{admin.role.name}</p>
                        {isSelf ? (
                          <p className="text-[11px] font-medium text-blue-600">You</p>
                        ) : null}
                      </div>
                    </div>
                    <InstStatusBadge status={admin.status} />
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <AdministratorRowActions adminId={admin.id} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[20%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3 text-left">Administrator</th>
                    <th className="px-3 py-3 text-left">Role</th>
                    <th className="px-3 py-3 text-left">Status</th>
                    <th className="px-3 py-3 text-left">Joined</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {administrators.map((admin) => {
                    const avatarUrl = admin.user.avatarStorageKey
                      ? storageAdapter.getFileUrl(admin.user.avatarStorageKey)
                      : null;
                    const isSelf = admin.id === institutionUserId;
                    return (
                      <tr key={admin.id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-3 align-middle">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <UserAvatar
                              name={admin.user.fullName}
                              src={avatarUrl}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {admin.user.fullName}
                                {isSelf ? (
                                  <span className="ml-1.5 text-[11px] font-medium text-blue-600">
                                    You
                                  </span>
                                ) : null}
                              </p>
                              <p className="truncate text-xs text-slate-500">{admin.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle text-slate-600">
                          <span className="block truncate">{admin.role.name}</span>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <InstStatusBadge status={admin.status} />
                        </td>
                        <td className="px-3 py-3 align-middle text-xs text-slate-500">
                          {admin.createdAt.toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3 align-middle text-right">
                          <AdministratorRowActions adminId={admin.id} />
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
