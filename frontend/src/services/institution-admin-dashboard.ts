import "server-only";
import { prisma } from "@/lib/db/prisma";
import { RoleKey, SessionStatus } from "@prisma/client";

export async function getInstitutionDashboard(institutionId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalStudents,
    totalLecturers,
    totalCourses,
    totalPrograms,
    totalDepartments,
    upcomingClasses,
    activeClasses,
    recentActivity,
    studentsByMonth,
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
      take: 10,
      include: {
        actor: { select: { fullName: true, email: true } },
      },
    }),
    prisma.studentProfile.findMany({
      where: { institutionId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
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
    where: { key: { in: [RoleKey.STUDENT, RoleKey.LECTURER, RoleKey.INSTITUTION_ADMIN] } },
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
    if (key === RoleKey.INSTITUTION_ADMIN) peopleDistribution.administrators = row._count._all;
  }

  // Bucket student enrollment by day for last 30 days
  const enrollmentBuckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    enrollmentBuckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of studentsByMonth) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (enrollmentBuckets.has(key)) {
      enrollmentBuckets.set(key, (enrollmentBuckets.get(key) ?? 0) + 1);
    }
  }

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
    enrollmentSeries: Array.from(enrollmentBuckets.entries()).map(([date, count]) => ({
      date,
      count,
    })),
    courseDistribution: coursesByStatus.map((row) => ({
      status: row.status,
      count: row._count._all,
    })),
    peopleDistribution,
    liveClasses,
  };
}
