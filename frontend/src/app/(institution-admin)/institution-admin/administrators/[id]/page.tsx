import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import {
  assertSameInstitution,
  requireFullInstitutionAdmin,
} from "@/lib/permissions/institution-admin";
import {
  INSTITUTION_STAFF_ROLES,
  staffRoleLabel,
} from "@/lib/permissions/institution-privileges";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import {
  AdministratorEditDialog,
  AdministratorStatusActions,
} from "@/components/institution-admin/administrators/administrators-manager";
import { UserAvatar } from "@/components/super-admin/shared/user-avatar";
import { storageAdapter } from "@/lib/storage/adapter";
import { ResetPasswordForm } from "@/components/institution-admin/students/students-manager";

export const metadata: Metadata = {
  title: "Administrator detail — Institution Admin",
};

export default async function InstitutionAdminAdministratorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { institutionId, institutionUserId } = await requireFullInstitutionAdmin();
  const { id } = await params;

  const membership = await prisma.institutionUser.findUnique({
    where: { id },
    include: { user: true, role: true },
  });

  if (!membership) notFound();

  if (
    !assertSameInstitution(membership.institutionId, institutionId) ||
    !INSTITUTION_STAFF_ROLES.includes(membership.role.key)
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-red-800">Access forbidden</h2>
        <p className="mt-2 text-sm text-red-700">
          This administrator does not belong to your institution.
        </p>
        <Link
          href="/institution-admin/administrators"
          className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Back to administrators
        </Link>
      </div>
    );
  }

  const user = membership.user;
  const avatarUrl = user.avatarStorageKey
    ? storageAdapter.getFileUrl(user.avatarStorageKey)
    : null;
  const isSelf = membership.id === institutionUserId;
  const editData = {
    id: membership.id,
    fullName: user.fullName,
    email: user.email,
    roleKey: membership.role.key,
    status: membership.status,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/institution-admin/administrators"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Administrators
        </Link>
        <InstPageHeader
          title={user.fullName}
          description={user.email}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <AdministratorEditDialog admin={editData} triggerVariant="button" />
              <AdministratorStatusActions
                adminId={membership.id}
                status={membership.status}
                isSelf={isSelf}
                adminName={user.fullName}
                mode="button"
              />
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Profile</h3>
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="mx-auto shrink-0 sm:mx-0">
                <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner ring-4 ring-slate-100">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local/dynamic storage keys
                    <img
                      src={avatarUrl}
                      alt={`${user.fullName} profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserAvatar
                      name={user.fullName}
                      src={null}
                      size="lg"
                      className="h-24 w-24 text-2xl ring-0"
                    />
                  )}
                </div>
                <p className="mt-2 text-center text-[11px] font-medium text-slate-400">
                  Profile photo
                </p>
              </div>
              <dl className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Full name</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{user.fullName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Email</dt>
                  <dd className="mt-1 break-all text-sm font-medium text-slate-900">
                    {user.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Role</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {staffRoleLabel(membership.role.key)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Joined</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {membership.createdAt.toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Role privileges</h3>
            <p className="mt-2 text-sm text-slate-600">
              {privilegeSummary(membership.role.key)}
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Account status</h3>
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs font-semibold text-slate-500">Membership</dt>
                <dd>
                  <InstStatusBadge status={membership.status} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs font-semibold text-slate-500">User account</dt>
                <dd>
                  <InstStatusBadge status={user.status} />
                </dd>
              </div>
            </dl>
          </div>
          <ResetPasswordForm userId={user.id} />
        </aside>
      </div>
    </div>
  );
}

function privilegeSummary(roleKey: (typeof INSTITUTION_STAFF_ROLES)[number] | string) {
  switch (roleKey) {
    case "INSTITUTION_ADMIN":
      return "Full campus control: people, academics, administrators, reports, activity, and settings.";
    case "ADMIN_OFFICER":
      return "Day-to-day operations: students, lecturers, departments, programs, courses, classes, reports, and activity. Cannot manage administrators or settings.";
    case "EXAM_OFFICER":
      return "Assessments focus: students, courses, classes, reports, and activity. Prepared for exam/results workflows.";
    case "FINANCE_OFFICER":
      return "Finance focus: students, reports, and activity. Prepared for fees and billing workflows.";
    default:
      return "Campus staff access.";
  }
}
