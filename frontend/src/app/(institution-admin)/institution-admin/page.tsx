import type { Metadata } from "next";
import { requireInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { getInstitutionDashboard } from "@/services/institution-admin-dashboard";
import { InstitutionDashboardView } from "@/components/institution-admin/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Institution Admin — ClassBridge",
};

export default async function InstitutionAdminDashboardPage() {
  const { user, institutionId, institutionName } = await requireInstitutionAdmin();
  const data = await getInstitutionDashboard(institutionId);

  return (
    <InstitutionDashboardView
      institutionName={institutionName}
      adminName={user.fullName}
      data={data}
    />
  );
}
