import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcademicStatus, CourseStatus } from "@prisma/client";
import { requireInstitutionAdmin, assertSameInstitution } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import {
  EditCourseDialog,
  CourseStatusButton,
} from "@/components/institution-admin/courses/courses-manager";

export const metadata: Metadata = {
  title: "Course — Institution Admin",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { institutionId } = await requireInstitutionAdmin();
  const { id } = await params;

  const [course, lecturers, departments, programs] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        lecturerProfile: {
          include: {
            institutionUser: { include: { user: { select: { fullName: true, email: true } } } },
          },
        },
        department: { select: { id: true, name: true, code: true } },
        program: { select: { id: true, name: true, code: true } },
        sessions: {
          orderBy: [{ scheduledStart: "desc" }, { createdAt: "desc" }],
          take: 30,
          select: {
            id: true,
            title: true,
            status: true,
            scheduledStart: true,
            scheduledEnd: true,
          },
        },
        _count: { select: { enrollments: true, sessions: true } },
      },
    }),
    prisma.lecturerProfile.findMany({
      where: { institutionId },
      include: {
        institutionUser: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({
      where: { institutionId, status: AcademicStatus.ACTIVE },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.program.findMany({
      where: { institutionId, status: AcademicStatus.ACTIVE },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  if (!course || !assertSameInstitution(course.institutionId, institutionId)) {
    notFound();
  }

  const lecturerOptions = lecturers.map((l) => ({
    value: l.id,
    label: l.institutionUser.user.fullName,
  }));
  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));
  const programOptions = programs.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.code})`,
  }));

  const formatWhen = (d: Date | null) =>
    d
      ? d.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  return (
    <div className="space-y-6">
      <InstPageHeader
        title={course.title}
        description={`${course.code} · Course management`}
        actions={
          <div className="flex flex-wrap gap-2">
            <EditCourseDialog
              course={{
                id: course.id,
                code: course.code,
                title: course.title,
                description: course.description,
                lecturerProfileId: course.lecturerProfileId,
                departmentId: course.departmentId,
                programId: course.programId,
                status: course.status,
              }}
              lecturers={lecturerOptions}
              departments={departmentOptions}
              programs={programOptions}
              triggerVariant="button"
            />
            {course.status !== CourseStatus.ACTIVE ? (
              <CourseStatusButton
                id={course.id}
                status={course.status}
                nextStatus={CourseStatus.ACTIVE}
                label="Activate"
              />
            ) : null}
            {course.status !== CourseStatus.DRAFT ? (
              <CourseStatusButton
                id={course.id}
                status={course.status}
                nextStatus={CourseStatus.DRAFT}
                label="Mark draft"
              />
            ) : null}
            {course.status !== CourseStatus.ARCHIVED ? (
              <CourseStatusButton
                id={course.id}
                status={course.status}
                nextStatus={CourseStatus.ARCHIVED}
                label="Archive"
              />
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enrollments</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{course._count.enrollments}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sessions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{course._count.sessions}</p>
          <Link
            href={`/institution-admin/classes?create=1`}
            className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
          >
            Schedule class
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <div className="mt-2">
            <InstStatusBadge status={course.status} />
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-900">Course details</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Code</dt>
            <dd className="mt-1 font-mono text-sm text-slate-900">{course.code}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{course.title}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lecturer</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {course.lecturerProfile ? (
                <Link
                  href={`/institution-admin/lecturers/${course.lecturerProfile.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {course.lecturerProfile.institutionUser.user.fullName}
                </Link>
              ) : (
                "Unassigned"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {course.department ? (
                <Link
                  href={`/institution-admin/departments/${course.department.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {course.department.name}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Program</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {course.program ? (
                <Link
                  href={`/institution-admin/programs/${course.program.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {course.program.name}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {course.description || "No description provided."}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Class sessions</h3>
        {course.sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No class sessions scheduled for this course.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Start</th>
                  <th className="py-2 pr-4">End</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {course.sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/institution-admin/classes/${session.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {session.title}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">{formatWhen(session.scheduledStart)}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{formatWhen(session.scheduledEnd)}</td>
                    <td className="py-2.5">
                      <InstStatusBadge status={session.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
