import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcademicStatus } from "@prisma/client";
import { requireInstitutionAdmin, assertSameInstitution } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import {
  EditProgramDialog,
  ProgramStatusButton,
} from "@/components/institution-admin/programs/programs-manager";

export const metadata: Metadata = {
  title: "Program — Institution Admin",
};

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { institutionId } = await requireInstitutionAdmin();
  const { id } = await params;

  const [program, departments] = await Promise.all([
    prisma.program.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        courses: {
          orderBy: { code: "asc" },
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            lecturerProfile: {
              include: {
                institutionUser: {
                  include: { user: { select: { fullName: true } } },
                },
              },
            },
          },
        },
        _count: { select: { students: true, courses: true } },
      },
    }),
    prisma.department.findMany({
      where: { institutionId, status: AcademicStatus.ACTIVE },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  if (!program || !assertSameInstitution(program.institutionId, institutionId)) {
    notFound();
  }

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));

  return (
    <div className="space-y-6">
      <InstPageHeader
        title={program.name}
        description={`Program code ${program.code}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <EditProgramDialog
              program={{
                id: program.id,
                name: program.name,
                code: program.code,
                description: program.description,
                departmentId: program.departmentId,
                durationMonths: program.durationMonths,
                status: program.status,
              }}
              departments={departmentOptions}
              triggerVariant="button"
            />
            <ProgramStatusButton
              id={program.id}
              status={program.status}
              name={program.name}
              mode="button"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Students</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{program._count.students}</p>
          <Link
            href="/institution-admin/students"
            className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
          >
            View students
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Courses</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{program._count.courses}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {program.durationMonths ? `${program.durationMonths} mo` : "—"}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-bold text-slate-900">Program info</h3>
          <InstStatusBadge status={program.status} />
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{program.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Code</dt>
            <dd className="mt-1 font-mono text-sm text-slate-900">{program.code}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {program.department ? (
                <Link
                  href={`/institution-admin/departments/${program.department.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {program.department.name} ({program.department.code})
                </Link>
              ) : (
                "Unassigned"
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {program.description || "No description provided."}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Courses</h3>
        {program.courses.length === 0 ? (
          <p className="text-sm text-slate-500">No courses linked to this program.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Lecturer</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {program.courses.map((course) => (
                  <tr key={course.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">{course.code}</td>
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/institution-admin/courses/${course.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {course.title}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {course.lecturerProfile?.institutionUser.user.fullName ?? "—"}
                    </td>
                    <td className="py-2.5">
                      <InstStatusBadge status={course.status} />
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
