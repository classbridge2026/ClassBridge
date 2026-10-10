import type { Metadata } from "next";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/db/prisma";
import { InstitutionsManager } from "@/components/super-admin/institutions/institutions-manager";

export const metadata: Metadata = {
  title: "Institutions — Super Admin",
};

export default async function SuperAdminInstitutionsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  await requireSuperAdminUser();
  const params = await searchParams;

  const institutions = await prisma.institution.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { select: { planKey: true } },
      _count: {
        select: {
          studentProfiles: true,
          lecturerProfiles: true,
        },
      },
    },
  });

  return (
    <InstitutionsManager
      openCreateByDefault={params.action === "create"}
      institutions={institutions.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        status: item.status,
        timezone: item.timezone,
        createdAt: item.createdAt.toISOString(),
        students: item._count.studentProfiles,
        lecturers: item._count.lecturerProfiles,
        planKey: item.subscription?.planKey ?? null,
      }))}
    />
  );
}
