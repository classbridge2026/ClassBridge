import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { AcademicStatus, CourseStatus, Prisma } from "@prisma/client";
import { requireInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { parsePage } from "@/lib/utils/pagination";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstEmptyState } from "@/components/institution-admin/shared/empty-state";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import { SearchFilters, Pagination } from "@/components/institution-admin/shared/search-filters";
import {
  CoursesManager,
  CourseRowActions,
} from "@/components/institution-admin/courses/courses-manager";

export const metadata: Metadata = {
  title: "Courses — Institution Admin",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; create?: string }>;
}) {
  const { institutionId } = await requireInstitutionAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status =
    params.status === "DRAFT" || params.status === "ACTIVE" || params.status === "ARCHIVED"
      ? (params.status as CourseStatus)
      : undefined;

  const where: Prisma.CourseWhereInput = {
    institutionId,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const total = await prisma.course.count({ where });
  const { page, pageSize, skip, totalPages } = parsePage(params.page, total);

  const [courses, lecturers, departments, programs] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: [{ code: "asc" }],
      skip,
      take: pageSize,
      include: {
        lecturerProfile: {
          include: {
            institutionUser: { include: { user: { select: { fullName: true } } } },
          },
        },
        department: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        _count: { select: { enrollments: true, sessions: true } },
      },
    }),
    prisma.lecturerProfile.findMany({
      where: { institutionId },
      orderBy: { createdAt: "desc" },
      include: {
        institutionUser: { include: { user: { select: { fullName: true } } } },
      },
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

  return (
    <div className="space-y-6">
      <InstPageHeader
        title="Courses"
        description="Manage courses, lecturers, and enrollments."
        actions={
          <CoursesManager
            defaultOpen={params.create === "1"}
            lecturers={lecturerOptions}
            departments={departmentOptions}
            programs={programOptions}
          />
        }
      />

      <SearchFilters
        placeholder="Search by title or code…"
        statusOptions={[
          { value: "DRAFT", label: "Draft" },
          { value: "ACTIVE", label: "Active" },
          { value: "ARCHIVED", label: "Archived" },
        ]}
      />

      {courses.length === 0 ? (
        <InstEmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create a course and assign a lecturer to get started."
          actionHref="/institution-admin/courses?create=1"
          actionLabel="Create course"
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Lecturer</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Enrolled</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{course.code}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/institution-admin/courses/${course.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {course.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {course.lecturerProfile?.institutionUser.user.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {course.department?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <InstStatusBadge status={course.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{course._count.enrollments}</td>
                    <td className="px-4 py-3 text-right">
                      <CourseRowActions
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
