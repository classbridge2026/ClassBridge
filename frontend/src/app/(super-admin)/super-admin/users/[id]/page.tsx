import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/db/prisma";
import { StatusBadge } from "@/components/super-admin/shared/status-badge";
import { Button } from "@/components/ui/button";
import { toggleUserStatusAction } from "@/features/super-admin/actions";

export const metadata: Metadata = {
  title: "User Details — Super Admin",
};

export default async function SuperAdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdminUser();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          institution: true,
          role: true,
        },
      },
      auditLogs: {
        take: 15,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  async function toggleStatus() {
    "use server";
    const formData = new FormData();
    formData.set("userId", id);
    formData.set("status", user!.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
    await toggleUserStatusAction(formData);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
            <StatusBadge status={user.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          <p className="mt-2 text-xs text-slate-400">User ID: {user.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/super-admin/users">
            <Button type="button" variant="secondary" size="sm">
              Back to users
            </Button>
          </Link>
          {user.isPlatformSuperAdmin ? (
            <Link href={`/super-admin/platform-users/${user.id}`}>
              <Button type="button" variant="outline" size="sm">
                Open as Platform User
              </Button>
            </Link>
          ) : null}
          <form action={toggleStatus}>
            <Button
              type="submit"
              size="sm"
              variant={user.status === "ACTIVE" ? "danger" : "primary"}
            >
              {user.status === "ACTIVE" ? "Suspend" : "Activate"}
            </Button>
          </form>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Account Information</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-semibold text-slate-900">{user.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Email verified</dt>
              <dd className="font-semibold text-slate-900">
                {user.emailVerifiedAt ? user.emailVerifiedAt.toLocaleString() : "Not verified"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Platform Super Admin</dt>
              <dd className="font-semibold text-slate-900">
                {user.isPlatformSuperAdmin ? "Yes" : "No"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Created</dt>
              <dd className="font-semibold text-slate-900">{user.createdAt.toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Roles & Institutions</h3>
          {user.memberships.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              {user.isPlatformSuperAdmin
                ? "Platform-level account with no institution membership."
                : "No institution memberships."}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {user.memberships.map((membership) => (
                <li key={membership.id} className="py-2.5 text-sm">
                  <p className="font-semibold text-slate-900">{membership.institution.name}</p>
                  <p className="text-xs text-slate-500">
                    {membership.role.key} · {membership.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Security</h3>
        <p className="mt-2 text-sm text-slate-600">
          Password hashes are never displayed. Use Security settings to rotate your own credentials.
          Privilege escalation to platform Super Admin is managed under Platform Users.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Activity</h3>
        {user.auditLogs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No audit events for this user as actor.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {user.auditLogs.map((log) => (
              <li key={log.id} className="py-2.5 text-sm">
                <p className="font-semibold text-slate-900">{log.action}</p>
                <p className="text-xs text-slate-500">
                  {log.resourceType}
                  {log.resourceId ? ` · ${log.resourceId}` : ""} · {log.createdAt.toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
