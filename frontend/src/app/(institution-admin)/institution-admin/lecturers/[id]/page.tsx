import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import {
  assertSameInstitution,
  requireInstitutionAdmin,
} from "@/lib/permissions/institution-admin";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import {
  LecturerEditDialog,
  LecturerResetPasswordForm,
  LecturerStatusActions,
} from "@/components/institution-admin/lecturers/lecturers-manager";
import { UserAvatar } from "@/components/super-admin/shared/user-avatar";
import { storageAdapter } from "@/lib/storage/adapter";

export const metadata: Metadata = {
  title: "Lecturer detail — Institution Admin",
};

export default async function InstitutionAdminLecturerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { institutionId } = await requireInstitutionAdmin();
  const { id } = await params;

  const lecturer = await prisma.lecturerProfile.findUnique({
    where: { id },
    include: {
      department: true,
      institutionUser: { include: { user: true } },
      courses: {
        orderBy: { code: "asc" },
        include: {
          _count: { select: { enrollments: true } },
        },
      },
    },
  });

  if (!lecturer) notFound();

  if (!assertSameInstitution(lecturer.institutionId, institutionId)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-red-800">Access forbidden</h2>
        <p className="mt-2 text-sm text-red-700">
          This lecturer does not belong to your institution.
        </p>
        <Link
          href="/institution-admin/lecturers"
          className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Back to lecturers
        </Link>
      </div>
    );
  }

  const departments = await prisma.department.findMany({
    where: { institutionId, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const user = lecturer.institutionUser.user;
  const avatarUrl = user.avatarStorageKey
    ? storageAdapter.getFileUrl(user.avatarStorageKey)
    : null;
  const editData = {
    id: lecturer.id,
    fullName: user.fullName,
    title: lecturer.title,
    bio: lecturer.bio,
    departmentId: lecturer.departmentId,
    status: lecturer.institutionUser.status,
    userId: user.id,
  };
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/institution-admin/lecturers"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Lecturers
        </Link>
        <InstPageHeader
          title={user.fullName}
          description={user.email}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <LecturerEditDialog
                lecturer={editData}
                departments={departmentOptions}
                triggerVariant="button"
              />
              <LecturerStatusActions
                lecturerId={lecturer.id}
                status={lecturer.institutionUser.status}
                lecturerName={user.fullName}
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
              <dl className="min-w-0 flex-1 grid gap-4 sm:grid-cols-2">
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
                  <dt className="text-xs font-semibold text-slate-500">Title</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {lecturer.title || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Department</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {lecturer.department?.name ?? "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-slate-500">Bio</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {lecturer.bio || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Courses taught</h3>
            {lecturer.courses.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No courses assigned yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {lecturer.courses.map((course) => (
                  <li
                    key={course.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {course.code} · {course.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {course._count.enrollments} enrolled
                      </p>
                    </div>
                    <InstStatusBadge status={course.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Account status</h3>
            <div className="mt-3 flex items-center gap-2">
              <InstStatusBadge status={lecturer.institutionUser.status} />
              <span className="text-xs text-slate-500">Membership</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              User account: <InstStatusBadge status={user.status} />
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Joined {lecturer.createdAt.toLocaleDateString()}
            </p>
          </div>
          <LecturerResetPasswordForm userId={user.id} />
        </aside>
      </div>
    </div>
  );
}
