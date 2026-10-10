import type { Metadata } from "next";
import { Suspense } from "react";
import { MembershipStatus } from "@prisma/client";
import { GraduationCap } from "lucide-react";
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
  StudentsManager,
  StudentRowActions,
} from "@/components/institution-admin/students/students-manager";

export const metadata: Metadata = {
  title: "Students — Institution Admin",
};

type SearchParams = Promise<{ q?: string; status?: string; page?: string; create?: string }>;

export default async function InstitutionAdminStudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { institutionId } = await requireInstitutionAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status =
    params.status === MembershipStatus.ACTIVE || params.status === MembershipStatus.INACTIVE
      ? params.status
      : undefined;

  const where = {
    institutionId,
    ...(status ? { institutionUser: { status } } : {}),
    ...(q
      ? {
          OR: [
            { studentNumber: { contains: q, mode: "insensitive" as const } },
            {
              institutionUser: {
                user: {
                  OR: [
                    { fullName: { contains: q, mode: "insensitive" as const } },
                    { email: { contains: q, mode: "insensitive" as const } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const total = await prisma.studentProfile.count({ where });
  const { page, pageSize, skip, totalPages } = parsePage(params.page, total);

  const [students, departments, programs] = await Promise.all([
    prisma.studentProfile.findMany({
      where,
      include: {
        department: true,
        program: true,
        institutionUser: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
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

  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }));

  return (
    <div className="space-y-6">
      <InstPageHeader
        title="Students"
        description="Manage student accounts and academic placement."
        actions={
          <StudentsManager
            departments={departmentOptions}
            programs={programOptions}
            defaultCreateOpen={params.create === "1"}
          />
        }
      />

      <Suspense fallback={<div className="h-20 animate-pulse rounded-2xl bg-slate-100" />}>
        <SearchFilters
          placeholder="Search name, email, or student ID…"
          statusOptions={[
            { value: MembershipStatus.ACTIVE, label: "Active" },
            { value: MembershipStatus.INACTIVE, label: "Inactive" },
          ]}
        />
      </Suspense>

      {students.length === 0 ? (
        <InstEmptyState
          icon={GraduationCap}
          title="No students found"
          description={
            q || status
              ? "Try adjusting your search or status filter."
              : "Add your first student to start building the campus directory."
          }
          actionHref={q || status ? undefined : "/institution-admin/students?create=1"}
          actionLabel={q || status ? undefined : "Add student"}
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {students.map((student) => {
              const user = student.institutionUser.user;
              return (
                <div
                  key={student.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{user.fullName}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-500">
                        {student.studentNumber || "No student ID"}
                      </p>
                    </div>
                    <InstStatusBadge status={student.institutionUser.status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <dt className="text-slate-400">Program</dt>
                      <dd className="font-medium">{student.program?.name ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Department</dt>
                      <dd className="font-medium">{student.department?.name ?? "—"}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <StudentRowActions
                      student={{
                        id: student.id,
                        fullName: user.fullName,
                        studentNumber: student.studentNumber,
                        departmentId: student.departmentId,
                        programId: student.programId,
                        status: student.institutionUser.status,
                        userId: user.id,
                      }}
                      departments={departmentOptions}
                      programs={programOptions}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Enrollment Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const user = student.institutionUser.user;
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3.5 font-semibold text-slate-900">{user.fullName}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                          {student.studentNumber || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{user.email}</td>
                        <td className="px-4 py-3.5 text-slate-600">{student.program?.name ?? "—"}</td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {student.department?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <InstStatusBadge status={student.institutionUser.status} />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {student.createdAt.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <StudentRowActions
                            student={{
                              id: student.id,
                              fullName: user.fullName,
                              studentNumber: student.studentNumber,
                              departmentId: student.departmentId,
                              programId: student.programId,
                              status: student.institutionUser.status,
                              userId: user.id,
                            }}
                            departments={departmentOptions}
                            programs={programOptions}
                          />
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
