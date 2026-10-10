import type { Metadata } from "next";
import { requireInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { storageAdapter } from "@/lib/storage/adapter";
import { getInstitutionDashboard } from "@/services/institution-admin-dashboard";
import { InstitutionDashboardView } from "@/components/institution-admin/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Institution Admin — ClassBridge",
};

export default async function InstitutionAdminDashboardPage() {
  const { user, institutionId, institutionName } = await requireInstitutionAdmin();
  const [data, institution] = await Promise.all([
    getInstitutionDashboard(institutionId),
    prisma.institution.findUnique({
      where: { id: institutionId },
      select: { logoStorageKey: true },
    }),
  ]);

  const logoUrl = institution?.logoStorageKey
    ? storageAdapter.getFileUrl(institution.logoStorageKey)
    : null;

  return (
    <InstitutionDashboardView
      institutionName={institutionName}
      adminName={user.fullName}
      logoUrl={logoUrl}
      data={data}
    />
  );
}
