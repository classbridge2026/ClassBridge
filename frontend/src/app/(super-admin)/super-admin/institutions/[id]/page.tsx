import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RoleKey } from "@prisma/client";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/db/prisma";
import { StatusBadge } from "@/components/super-admin/shared/status-badge";
import { Button } from "@/components/ui/button";
import { submitToggleInstitutionStatus } from "@/features/institutions/actions";

export const metadata: Metadata = {
  title: "Institution Details — Super Admin",
};

export default async function SuperAdminInstitutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdminUser();
  const { id } = await params;

  const institution = await prisma.institution.findUnique({
    where: { id },
    include: {
      subscription: true,
      studentProfiles: { take: 8, include: { institutionUser: { include: { user: true } } } },
      lecturerProfiles: { take: 8, include: { institutionUser: { include: { user: true } } } },
      memberships: {
        where: { role: { key: RoleKey.INSTITUTION_ADMIN } },
        include: { user: true, role: true },
        take: 10,
      },
      courses: { take: 8, orderBy: { code: "asc" } },
      auditLogs: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { fullName: true } } },
      },
      _count: {
        select: {
          studentProfiles: true,
          lecturerProfiles: true,
          memberships: true,
          courses: true,
        },
      },
    },
  });

  if (!institution) notFound();

  async function toggleStatus() {
    "use server";
    await submitToggleInstitutionStatus(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{institution.name}</h2>
            <StatusBadge status={institution.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {institution.slug} · {institution.timezone}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Created {institution.createdAt.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/super-admin/institutions">
            <Button type="button" variant="secondary" size="sm">
              Back to list
            </Button>
          </Link>
          {institution.status !== "TRASHED" ? (
            <form action={toggleStatus}>
              <Button
                type="submit"
                size="sm"
                variant={institution.status === "ACTIVE" ? "danger" : "primary"}
              >
                {institution.status === "ACTIVE" ? "Suspend" : "Activate"}
              </Button>
            </form>
          ) : null}
          <Link href={`/super-admin/subscriptions?institutionId=${institution.id}`}>
            <Button type="button" size="sm" variant="outline">
              Manage Subscription
            </Button>
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Students", value: institution._count.studentProfiles },
          { label: "Lecturers", value: institution._count.lecturerProfiles },
          { label: "Members", value: institution._count.memberships },
          { label: "Courses", value: institution._count.courses },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Overview</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <StatusBadge status={institution.status} />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Plan</dt>
              <dd className="font-semibold text-slate-900">
                {institution.subscription?.planKey ?? "None"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Subscription</dt>
              <dd className="font-semibold text-slate-900">
                {institution.subscription?.status ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Seat limit</dt>
              <dd className="font-semibold text-slate-900">
                {institution.subscription?.seatLimit ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Institution Administrators</h3>
          {institution.memberships.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No institution admins found.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {institution.memberships.map((member) => (
                <li key={member.id} className="py-2.5">
                  <p className="text-sm font-semibold text-slate-900">{member.user.fullName}</p>
                  <p className="text-xs text-slate-500">{member.user.email}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Students</h3>
          {institution.studentProfiles.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No students yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {institution.studentProfiles.map((profile) => (
                <li key={profile.id} className="py-2.5 text-sm">
                  <p className="font-semibold text-slate-900">
                    {profile.institutionUser.user.fullName}
                  </p>
                  <p className="text-xs text-slate-500">{profile.institutionUser.user.email}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Lecturers</h3>
          {institution.lecturerProfiles.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No lecturers yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {institution.lecturerProfiles.map((profile) => (
                <li key={profile.id} className="py-2.5 text-sm">
                  <p className="font-semibold text-slate-900">
                    {profile.institutionUser.user.fullName}
                  </p>
                  <p className="text-xs text-slate-500">{profile.institutionUser.user.email}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Courses</h3>
        {institution.courses.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No courses yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {institution.courses.map((course) => (
              <li key={course.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-semibold text-slate-900">
                  {course.code} · {course.title}
                </span>
                <StatusBadge status={course.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Activity</h3>
        {institution.auditLogs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No audit events for this institution yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {institution.auditLogs.map((log) => (
              <li key={log.id} className="py-2.5 text-sm">
                <p className="font-semibold text-slate-900">
                  {log.actor?.fullName ?? "System"} · {log.action}
                </p>
                <p className="text-xs text-slate-500">{log.createdAt.toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
