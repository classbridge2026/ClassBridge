import type { Metadata } from "next";
import { RoleKey } from "@prisma/client";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/db/prisma";
import { storageAdapter } from "@/lib/storage/adapter";
import { UsersManager } from "@/components/super-admin/users/users-manager";

export const metadata: Metadata = {
  title: "Users — Super Admin",
};

export default async function SuperAdminUsersPage() {
  await requireSuperAdminUser();

  const [users, totalUsers, students, lecturers, institutionAdmins, suspended] =
    await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          memberships: {
            include: {
              institution: { select: { name: true } },
              role: { select: { key: true } },
            },
          },
        },
      }),
      prisma.user.count(),
      prisma.studentProfile.count(),
      prisma.lecturerProfile.count(),
      prisma.institutionUser.count({ where: { role: { key: RoleKey.INSTITUTION_ADMIN } } }),
      prisma.user.count({ where: { status: "INACTIVE" } }),
    ]);

  return (
    <UsersManager
      stats={{
        total: totalUsers,
        students,
        lecturers,
        institutionAdmins,
        suspended,
      }}
      users={users.map((user) => {
        const roleLabels = [
          ...(user.isPlatformSuperAdmin ? ["PLATFORM"] : []),
          ...user.memberships.map((m) => m.role.key),
        ];
        return {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
          isPlatformSuperAdmin: user.isPlatformSuperAdmin,
          avatarUrl: user.avatarStorageKey
            ? storageAdapter.getFileUrl(user.avatarStorageKey)
            : null,
          roleLabels: Array.from(new Set(roleLabels)),
          institutionNames: Array.from(
            new Set(user.memberships.map((m) => m.institution.name)),
          ),
        };
      })}
    />
  );
}
