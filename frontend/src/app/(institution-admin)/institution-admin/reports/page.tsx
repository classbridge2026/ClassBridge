import type { Metadata } from "next";
import { Suspense } from "react";
import {
  GraduationCap,
  Users,
  BookOpen,
  BookMarked,
  Building2,
  Calendar,
  ClipboardCheck,
  Activity,
} from "lucide-react";
import { Prisma, SessionStatus } from "@prisma/client";
import { requireInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstStatCard } from "@/components/institution-admin/shared/stat-card";
import { ReportsFilters, ReportsExportButton } from "@/components/institution-admin/reports/reports-client";

export const metadata: Metadata = {
  title: "Reports — Institution Admin",
};

function parseDate(value?: string) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    departmentId?: string;
    programId?: string;
    courseId?: string;
    lecturerId?: string;
    status?: string;
  }>;
}) {
  const { institutionId, institutionName } = await requireInstitutionAdmin();
  const params = await searchParams;

  const from = parseDate(params.from);
  const to = parseDate(params.to);
  const dateFilter =
    from || to
      ? {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        }
      : undefined;

  const [departments, programs, courses, lecturers] = await Promise.all([
    prisma.department.findMany({
      where: { institutionId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.program.findMany({
      where: { institutionId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.course.findMany({
      where: { institutionId },
      orderBy: { code: "asc" },
      select: { id: true, code: true, title: true },
    }),
    prisma.lecturerProfile.findMany({
      where: { institutionId },
      include: {
        institutionUser: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const studentWhere: Prisma.StudentProfileWhereInput = {
    institutionId,
    ...(params.departmentId ? { departmentId: params.departmentId } : {}),
    ...(params.programId ? { programId: params.programId } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const lecturerWhere: Prisma.LecturerProfileWhereInput = {
    institutionId,
    ...(params.departmentId ? { departmentId: params.departmentId } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const courseWhere: Prisma.CourseWhereInput = {
    institutionId,
    ...(params.departmentId ? { departmentId: params.departmentId } : {}),
    ...(params.programId ? { programId: params.programId } : {}),
    ...(params.lecturerId ? { lecturerProfileId: params.lecturerId } : {}),
    ...(params.status === "DRAFT" || params.status === "ACTIVE" || params.status === "ARCHIVED"
      ? { status: params.status }
      : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const classWhere: Prisma.ClassSessionWhereInput = {
    institutionId,
    ...(params.courseId ? { courseId: params.courseId } : {}),
    ...(params.lecturerId ? { course: { lecturerProfileId: params.lecturerId } } : {}),
    ...(params.status &&
    ["DRAFT", "SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"].includes(params.status)
      ? { status: params.status as SessionStatus }
      : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const [
    studentCount,
    lecturerCount,
    courseCount,
    programCount,
    departmentCount,
    classCount,
    attendanceCount,
    activityCount,
    studentsByProgram,
    classesByStatus,
    coursesSample,
    classesSample,
  ] = await Promise.all([
    prisma.studentProfile.count({ where: studentWhere }),
    prisma.lecturerProfile.count({ where: lecturerWhere }),
    prisma.course.count({ where: courseWhere }),
    prisma.program.count({
      where: {
        institutionId,
        ...(params.departmentId ? { departmentId: params.departmentId } : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
    }),
    prisma.department.count({
      where: {
        institutionId,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
    }),
    prisma.classSession.count({ where: classWhere }),
    prisma.classAttendance.count({
      where: {
        session: { institutionId, ...(params.courseId ? { courseId: params.courseId } : {}) },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
    }),
    prisma.auditLog.count({
      where: { institutionId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
    }),
    prisma.studentProfile.groupBy({
      by: ["programId"],
      where: studentWhere,
      _count: { _all: true },
    }),
    prisma.classSession.groupBy({
      by: ["status"],
      where: classWhere,
      _count: { _all: true },
    }),
    prisma.course.findMany({
      where: courseWhere,
      take: 50,
      orderBy: { code: "asc" },
      include: {
        department: { select: { name: true } },
        program: { select: { name: true } },
        lecturerProfile: {
          include: { institutionUser: { include: { user: { select: { fullName: true } } } } },
        },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.classSession.findMany({
      where: classWhere,
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { code: true, title: true } },
        _count: { select: { attendance: true } },
      },
    }),
  ]);

  const programNames = new Map(
    (
      await prisma.program.findMany({
        where: { institutionId },
        select: { id: true, name: true },
      })
    ).map((p) => [p.id, p.name]),
  );

  const exportRows = [
    ["Report", "Institution", institutionName],
    ["Generated", new Date().toISOString()],
    [],
    ["Metric", "Value"],
    ["Students", String(studentCount)],
    ["Lecturers", String(lecturerCount)],
    ["Courses", String(courseCount)],
    ["Programs", String(programCount)],
    ["Departments", String(departmentCount)],
    ["Classes", String(classCount)],
    ["Attendance records", String(attendanceCount)],
    ["Activity events", String(activityCount)],
    [],
    ["Course code", "Course title", "Department", "Program", "Lecturer", "Enrollments", "Status"],
    ...coursesSample.map((c) => [
      c.code,
      c.title,
      c.department?.name ?? "",
      c.program?.name ?? "",
      c.lecturerProfile?.institutionUser.user.fullName ?? "",
      String(c._count.enrollments),
      c.status,
    ]),
    [],
    ["Class title", "Course", "Status", "Attendance", "Created"],
    ...classesSample.map((s) => [
      s.title,
      `${s.course.code} ${s.course.title}`,
      s.status,
      String(s._count.attendance),
      s.createdAt.toISOString(),
    ]),
  ];

  const csv = exportRows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  return (
    <div className="space-y-6">
      <InstPageHeader
        title="Reports"
        description="Institution-level analytics with filters and CSV export."
        actions={<ReportsExportButton csv={csv} filename={`${institutionName}-report.csv`} />}
      />

      <Suspense fallback={null}>
        <ReportsFilters
          departments={departments}
          programs={programs}
          courses={courses.map((c) => ({ id: c.id, label: `${c.code} — ${c.title}` }))}
          lecturers={lecturers.map((l) => ({
            id: l.id,
            label: l.institutionUser.user.fullName,
          }))}
          values={{
            from: params.from ?? "",
            to: params.to ?? "",
            departmentId: params.departmentId ?? "",
            programId: params.programId ?? "",
            courseId: params.courseId ?? "",
            lecturerId: params.lecturerId ?? "",
            status: params.status ?? "",
          }}
        />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InstStatCard label="Students" value={studentCount} icon={GraduationCap} tone="blue" />
        <InstStatCard label="Lecturers" value={lecturerCount} icon={Users} tone="green" />
        <InstStatCard label="Courses" value={courseCount} icon={BookOpen} tone="violet" />
        <InstStatCard label="Programs" value={programCount} icon={BookMarked} tone="sky" />
        <InstStatCard label="Departments" value={departmentCount} icon={Building2} tone="slate" />
        <InstStatCard label="Classes" value={classCount} icon={Calendar} tone="amber" />
        <InstStatCard label="Attendance" value={attendanceCount} icon={ClipboardCheck} tone="rose" />
        <InstStatCard label="Activity" value={activityCount} icon={Activity} tone="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Students by program</h3>
          <ul className="mt-4 space-y-2">
            {studentsByProgram.length === 0 ? (
              <li className="text-sm text-slate-500">No student data for this filter.</li>
            ) : (
              studentsByProgram.map((row) => (
                <li key={row.programId ?? "none"} className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {row.programId ? programNames.get(row.programId) ?? "Unknown" : "Unassigned"}
                  </span>
                  <span className="font-bold text-slate-900">{row._count._all}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Classes by status</h3>
          <ul className="mt-4 space-y-2">
            {classesByStatus.length === 0 ? (
              <li className="text-sm text-slate-500">No class data for this filter.</li>
            ) : (
              classesByStatus.map((row) => (
                <li key={row.status} className="flex justify-between text-sm">
                  <span className="text-slate-600">{row.status}</span>
                  <span className="font-bold text-slate-900">{row._count._all}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-900">Course report (sample)</h3>
        </div>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Lecturer</th>
              <th className="px-4 py-3">Enrollments</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coursesSample.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No courses match the current filters.
                </td>
              </tr>
            ) : (
              coursesSample.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-slate-500">{c.code}</span>
                    <span className="block font-semibold text-slate-900">{c.title}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.department?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.program?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.lecturerProfile?.institutionUser.user.fullName ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{c._count.enrollments}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{c.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
