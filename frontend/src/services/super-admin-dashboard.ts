import "server-only";
import { prisma } from "@/lib/db/prisma";
import { RoleKey } from "@prisma/client";
import { listRecentAuditLogs } from "@/services/audit";

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

export async function getSuperAdminDashboardData() {
  const months = lastNMonths(6);
  const rangeStart = months[0]!.start;

  const [
    totalInstitutions,
    activeInstitutions,
    inactiveInstitutions,
    trashedInstitutions,
    totalUsers,
    activeUsers,
    inactiveUsers,
    pendingUsers,
    students,
    lecturers,
    institutionAdmins,
    platformUsers,
    institutionCreated,
    userCreated,
    recentActivity,
  ] = await Promise.all([
    prisma.institution.count({ where: { status: { not: "TRASHED" } } }),
    prisma.institution.count({ where: { status: "ACTIVE" } }),
    prisma.institution.count({ where: { status: "INACTIVE" } }),
    prisma.institution.count({ where: { status: "TRASHED" } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "INACTIVE" } }),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.studentProfile.count(),
    prisma.lecturerProfile.count(),
    prisma.institutionUser.count({
      where: { role: { key: RoleKey.INSTITUTION_ADMIN } },
    }),
    prisma.user.count({ where: { isPlatformSuperAdmin: true } }),
    prisma.institution.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    }),
    listRecentAuditLogs(10),
  ]);

  const institutionGrowth = months.map((month) => ({
    key: month.key,
    label: month.label,
    count: institutionCreated.filter(
      (row) => row.createdAt >= month.start && row.createdAt < month.end,
    ).length,
  }));

  const userGrowth = months.map((month) => ({
    key: month.key,
    label: month.label,
    count: userCreated.filter(
      (row) => row.createdAt >= month.start && row.createdAt < month.end,
    ).length,
  }));

  return {
    stats: {
      totalInstitutions,
      activeInstitutions,
      inactiveInstitutions,
      trashedInstitutions,
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingUsers,
      students,
      lecturers,
      institutionAdmins,
      platformUsers,
    },
    institutionGrowth,
    userGrowth,
    userDistribution: [
      { key: "students", label: "Students", value: students, color: "#2563EB" },
      { key: "lecturers", label: "Lecturers", value: lecturers, color: "#0EA5E9" },
      { key: "institutionAdmins", label: "Institution Admins", value: institutionAdmins, color: "#16A34A" },
      { key: "platformUsers", label: "Platform Users", value: platformUsers, color: "#F59E0B" },
    ],
    institutionStatus: [
      { key: "active", label: "Active", value: activeInstitutions, color: "#16A34A" },
      { key: "inactive", label: "Suspended", value: inactiveInstitutions, color: "#F59E0B" },
      { key: "trashed", label: "Trashed", value: trashedInstitutions, color: "#DC2626" },
    ],
    recentActivity,
  };
}

export type SuperAdminDashboardData = Awaited<ReturnType<typeof getSuperAdminDashboardData>>;
