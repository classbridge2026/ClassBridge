import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { AcademicStatus, Prisma } from "@prisma/client";
import { requireInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { parsePage } from "@/lib/utils/pagination";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstEmptyState } from "@/components/institution-admin/shared/empty-state";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import { SearchFilters, Pagination } from "@/components/institution-admin/shared/search-filters";
import {
  DepartmentsManager,
  DepartmentRowActions,
} from "@/components/institution-admin/departments/departments-manager";

export const metadata: Metadata = {
  title: "Departments — Institution Admin",
};

export default async function DepartmentsPage({
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

  const where: Prisma.DepartmentWhereInput = {
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

  const total = await prisma.department.count({ where });
  const { page, pageSize, skip, totalPages } = parsePage(params.page, total);

  const departments = await prisma.department.findMany({
    where,
    orderBy: [{ name: "asc" }],
    skip,
    take: pageSize,
    include: {
      _count: {
        select: {
          programs: true,
          courses: true,
          lecturers: true,
          students: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <InstPageHeader
        title="Departments"
        description="Organize academic departments and related faculty."
        actions={<DepartmentsManager defaultOpen={params.create === "1"} />}
      />

      <SearchFilters
        placeholder="Search by name or code…"
        statusOptions={[
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ]}
      />

      {departments.length === 0 ? (
        <InstEmptyState
          icon={Building2}
          title="No departments yet"
          description="Create your first department to organize programs, courses, and people."
          actionHref="/institution-admin/departments?create=1"
          actionLabel="Create department"
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Programs</th>
                  <th className="px-4 py-3">Courses</th>
                  <th className="px-4 py-3">People</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link
                        href={`/institution-admin/departments/${dept.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {dept.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{dept.code}</td>
                    <td className="px-4 py-3">
                      <InstStatusBadge status={dept.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{dept._count.programs}</td>
                    <td className="px-4 py-3 text-slate-600">{dept._count.courses}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {dept._count.lecturers} lec · {dept._count.students} stu
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DepartmentRowActions
                        department={{
                          id: dept.id,
                          name: dept.name,
                          code: dept.code,
                          description: dept.description,
                          status: dept.status,
                        }}
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
