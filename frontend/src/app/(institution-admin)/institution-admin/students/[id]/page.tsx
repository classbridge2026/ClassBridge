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
  ResetPasswordForm,
  StudentEditDialog,
  StudentStatusActions,
} from "@/components/institution-admin/students/students-manager";
import { UserAvatar } from "@/components/super-admin/shared/user-avatar";
import { storageAdapter } from "@/lib/storage/adapter";

export const metadata: Metadata = {
  title: "Student detail — Institution Admin",
};

export default async function InstitutionAdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { institutionId } = await requireInstitutionAdmin();
  const { id } = await params;

  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      department: true,
      program: true,
      institutionUser: { include: { user: true } },
      enrollments: {
        include: { course: true },
        orderBy: { enrolledAt: "desc" },
      },
      attendance: true,
    },
  });

  if (!student) notFound();

  if (!assertSameInstitution(student.institutionId, institutionId)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-red-800">Access forbidden</h2>
        <p className="mt-2 text-sm text-red-700">
          This student does not belong to your institution.
        </p>
        <Link
          href="/institution-admin/students"
          className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Back to students
        </Link>
      </div>
    );
  }

  const [departments, programs] = await Promise.all([
    prisma.department.findMany({
      where: { institutionId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.program.findMany({
      where: { institutionId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const user = student.institutionUser.user;
  const avatarUrl = user.avatarStorageKey
    ? storageAdapter.getFileUrl(user.avatarStorageKey)
    : null;
  const attendanceSummary = {
    present: student.attendance.filter((a) => a.status === "PRESENT").length,
    late: student.attendance.filter((a) => a.status === "LATE").length,
    absent: student.attendance.filter((a) => a.status === "ABSENT").length,
    total: student.attendance.length,
  };

  const editData = {
    id: student.id,
    fullName: user.fullName,
    studentNumber: student.studentNumber,
    departmentId: student.departmentId,
    programId: student.programId,
    status: student.institutionUser.status,
    userId: user.id,
  };

  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/institution-admin/students"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Students
        </Link>
        <InstPageHeader
          title={user.fullName}
          description={user.email}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <StudentEditDialog
                student={editData}
                departments={departmentOptions}
                programs={programOptions}
                triggerVariant="button"
              />
              <StudentStatusActions
                studentId={student.id}
                status={student.institutionUser.status}
                studentName={user.fullName}
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
                  <dt className="text-xs font-semibold text-slate-500">Student ID</dt>
                  <dd className="mt-1 font-mono text-sm text-slate-900">
                    {student.studentNumber || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Enrollment date</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {student.createdAt.toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Academic information</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-slate-500">Department</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {student.department?.name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Program</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {student.program?.name ?? "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Course enrollments</h3>
            {student.enrollments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No course enrollments yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {student.enrollments.map((enrollment) => (
                  <li
                    key={enrollment.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {enrollment.course.code} · {enrollment.course.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        Enrolled {enrollment.enrolledAt.toLocaleDateString()}
                      </p>
                    </div>
                    <InstStatusBadge status={enrollment.course.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Attendance summary</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryStat label="Present" value={attendanceSummary.present} />
              <SummaryStat label="Late" value={attendanceSummary.late} />
              <SummaryStat label="Absent" value={attendanceSummary.absent} />
              <SummaryStat label="Total records" value={attendanceSummary.total} />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Account status</h3>
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs font-semibold text-slate-500">Membership</dt>
                <dd>
                  <InstStatusBadge status={student.institutionUser.status} />
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

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
