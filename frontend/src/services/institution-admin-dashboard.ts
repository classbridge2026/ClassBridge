import "server-only";
import { prisma } from "@/lib/db/prisma";
import { RoleKey, SessionStatus } from "@prisma/client";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonths(n: number) {
  const now = new Date();
  const months: { key: string; label: string; start: Date; end: Date }[] = [];

  for (let i = n - 1; i >= 0; i -= 1) {
    const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const end = startOfMonth(new Date(start.getFullYear(), start.getMonth() + 1, 1));
    months.push({
      key: monthKey(start),
      label: start.toLocaleString("en-US", { month: "short" }),
      start,
      end,
    });
  }

  return months;
}

export async function getInstitutionDashboard(institutionId: string) {
  const now = new Date();
  const months = lastNMonths(6);
  const rangeStart = months[0]!.start;

  const [
    totalStudents,
    totalLecturers,
    totalCourses,
    totalPrograms,
    totalDepartments,
    upcomingClasses,
    activeClasses,
    recentActivity,
    studentsCreated,
    coursesByStatus,
    roleCounts,
    liveClasses,
  ] = await Promise.all([
    prisma.studentProfile.count({ where: { institutionId } }),
    prisma.lecturerProfile.count({ where: { institutionId } }),
    prisma.course.count({ where: { institutionId } }),
    prisma.program.count({ where: { institutionId } }),
    prisma.department.count({ where: { institutionId } }),
    prisma.classSession.count({
      where: {
        institutionId,
        status: SessionStatus.SCHEDULED,
        OR: [{ scheduledStart: { gte: now } }, { scheduledStart: null }],
      },
    }),
    prisma.classSession.count({
      where: { institutionId, status: SessionStatus.LIVE },
    }),
    prisma.auditLog.findMany({
      where: { institutionId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        actor: { select: { fullName: true, email: true } },
      },
    }),
    prisma.studentProfile.findMany({
      where: { institutionId, createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    }),
    prisma.course.groupBy({
      by: ["status"],
      where: { institutionId },
      _count: { _all: true },
    }),
    prisma.institutionUser.groupBy({
      by: ["roleId"],
      where: { institutionId },
      _count: { _all: true },
    }),
    prisma.classSession.findMany({
      where: { institutionId, status: SessionStatus.LIVE },
      take: 5,
      include: {
        course: {
          include: {
            lecturerProfile: {
              include: {
                institutionUser: { include: { user: { select: { fullName: true } } } },
              },
            },
          },
        },
        _count: { select: { attendance: true } },
      },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const roles = await prisma.role.findMany({
    where: {
      key: {
        in: [
          RoleKey.STUDENT,
          RoleKey.LECTURER,
          RoleKey.INSTITUTION_ADMIN,
          RoleKey.ADMIN_OFFICER,
          RoleKey.EXAM_OFFICER,
          RoleKey.FINANCE_OFFICER,
        ],
      },
    },
    select: { id: true, key: true },
  });
  const roleById = new Map(roles.map((r) => [r.id, r.key]));

  const peopleDistribution = {
    students: 0,
    lecturers: 0,
    administrators: 0,
  };
  for (const row of roleCounts) {
    const key = roleById.get(row.roleId);
    if (key === RoleKey.STUDENT) peopleDistribution.students = row._count._all;
    if (key === RoleKey.LECTURER) peopleDistribution.lecturers = row._count._all;
    if (
      key === RoleKey.INSTITUTION_ADMIN ||
      key === RoleKey.ADMIN_OFFICER ||
      key === RoleKey.EXAM_OFFICER ||
      key === RoleKey.FINANCE_OFFICER
    ) {
      peopleDistribution.administrators += row._count._all;
    }
  }

  const enrollmentSeries = months.map((month) => ({
    label: month.label,
    count: studentsCreated.filter(
      (row) => row.createdAt >= month.start && row.createdAt < month.end,
    ).length,
  }));

  const courseStatusColors: Record<string, string> = {
    ACTIVE: "#16A34A",
    DRAFT: "#94A3B8",
    ARCHIVED: "#F59E0B",
  };

  return {
    stats: {
      totalStudents,
      totalLecturers,
      totalCourses,
      totalPrograms,
      totalDepartments,
      upcomingClasses,
      activeClasses,
    },
    recentActivity,
    enrollmentSeries,
    courseDistribution: coursesByStatus.map((row) => ({
      key: row.status,
      label: row.status.charAt(0) + row.status.slice(1).toLowerCase(),
      value: row._count._all,
      color: courseStatusColors[row.status] ?? "#2563EB",
    })),
    peopleDistribution: [
      { key: "students", label: "Students", value: peopleDistribution.students, color: "#2563EB" },
      {
        key: "lecturers",
        label: "Lecturers",
        value: peopleDistribution.lecturers,
        color: "#16A34A",
      },
      {
        key: "administrators",
        label: "Admins",
        value: peopleDistribution.administrators,
        color: "#7C3AED",
      },
    ],
    liveClasses,
  };
}
