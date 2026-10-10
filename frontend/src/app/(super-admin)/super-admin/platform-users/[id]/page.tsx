import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/db/prisma";
import { StatusBadge } from "@/components/super-admin/shared/status-badge";
import { Button } from "@/components/ui/button";
import { toggleUserStatusAction } from "@/features/super-admin/actions";

export const metadata: Metadata = {
  title: "Platform User — Super Admin",
};

const PLATFORM_PERMISSIONS = [
  "MANAGE_INSTITUTIONS",
  "MANAGE_USERS",
  "MANAGE_PLATFORM_USERS",
  "VIEW_REPORTS",
  "MANAGE_SUBSCRIPTIONS",
  "VIEW_ACTIVITY",
  "MANAGE_SETTINGS",
] as const;

export default async function SuperAdminPlatformUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdminUser();
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, isPlatformSuperAdmin: true },
    include: {
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
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
            Platform Super Admin
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/super-admin/platform-users">
            <Button type="button" variant="secondary" size="sm">
              Back
            </Button>
          </Link>
          <Link href={`/super-admin/users/${user.id}`}>
            <Button type="button" variant="outline" size="sm">
              Open in Users
            </Button>
          </Link>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Permissions</h3>
        <p className="mt-1 text-xs text-slate-500">
          Current Super Admin accounts receive full platform permissions via{" "}
          <code className="rounded bg-slate-100 px-1">isPlatformSuperAdmin</code>. Granular
          permission roles can be layered on top of this model in a later iteration.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {PLATFORM_PERMISSIONS.map((permission) => (
            <li
              key={permission}
              className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs font-semibold text-emerald-800"
            >
              {permission}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Recent actions by this user</h3>
        {user.auditLogs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No audit events yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {user.auditLogs.map((log) => (
              <li key={log.id} className="py-2.5 text-sm">
                <p className="font-semibold text-slate-900">{log.action}</p>
                <p className="text-xs text-slate-500">{log.createdAt.toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
