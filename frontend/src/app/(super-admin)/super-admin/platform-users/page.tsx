import type { Metadata } from "next";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/db/prisma";
import { PlatformUsersManager } from "@/components/super-admin/platform-users/platform-users-manager";

export const metadata: Metadata = {
  title: "Platform Users — Super Admin",
};

export default async function SuperAdminPlatformUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  await requireSuperAdminUser();
  const params = await searchParams;

  const users = await prisma.user.findMany({
    where: { isPlatformSuperAdmin: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        ClassBridge staff accounts with platform-level Super Admin access. Institution users are
        managed under Users.
      </p>
      <PlatformUsersManager
        openCreateByDefault={params.action === "create"}
        users={users.map((user) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
