import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked } from "lucide-react";
import { AcademicStatus, Prisma } from "@prisma/client";
import { requireInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { parsePage } from "@/lib/utils/pagination";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstEmptyState } from "@/components/institution-admin/shared/empty-state";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import { SearchFilters, Pagination } from "@/components/institution-admin/shared/search-filters";
import {
  ProgramsManager,
  ProgramRowActions,
} from "@/components/institution-admin/programs/programs-manager";

export const metadata: Metadata = {
  title: "Programs — Institution Admin",
};

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; create?: string }>;
}) {
  const { institutionId } = await requireInstitutionAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status =
    params.status === "ACTIVE" || params.status === "INACTIVE"
      ? (params.status as AcademicStatus)
      : undefined;

  const where: Prisma.ProgramWhereInput = {
    institutionId,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const total = await prisma.program.count({ where });
  const { page, pageSize, skip, totalPages } = parsePage(params.page, total);

  const [programs, departments] = await Promise.all([
    prisma.program.findMany({
      where,
      orderBy: [{ name: "asc" }],
      skip,
      take: pageSize,
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { courses: true, students: true } },
      },
    }),
    prisma.department.findMany({
      where: { institutionId, status: AcademicStatus.ACTIVE },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));

  return (
    <div className="space-y-6">
      <InstPageHeader
        title="Programs"
        description="Create and manage academic programs."
        actions={
          <ProgramsManager defaultOpen={params.create === "1"} departments={departmentOptions} />
        }
      />

      <SearchFilters
        placeholder="Search by name or code…"
        statusOptions={[
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ]}
      />

      {programs.length === 0 ? (
        <InstEmptyState
          icon={BookMarked}
          title="No programs yet"
          description="Create a program to group courses and place students."
          actionHref="/institution-admin/programs?create=1"
          actionLabel="Create program"
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Courses</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programs.map((program) => (
                  <tr key={program.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link
                        href={`/institution-admin/programs/${program.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {program.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{program.code}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {program.department ? (
                        <Link
                          href={`/institution-admin/departments/${program.department.id}`}
                          className="hover:text-blue-600"
                        >
                          {program.department.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <InstStatusBadge status={program.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{program._count.courses}</td>
                    <td className="px-4 py-3 text-slate-600">{program._count.students}</td>
                    <td className="px-4 py-3 text-right">
                      <ProgramRowActions
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
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  );
}
