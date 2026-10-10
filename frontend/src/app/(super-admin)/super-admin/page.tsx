import type { Metadata } from "next";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { getSuperAdminDashboardData } from "@/services/super-admin-dashboard";
import { SuperAdminDashboardView } from "@/components/super-admin/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard — Super Admin",
};

export default async function SuperAdminDashboardPage() {
  await requireSuperAdminUser();

  let data;
  try {
    data = await getSuperAdminDashboardData();
  } catch {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="text-lg font-bold text-red-800">Unable to load dashboard</h2>
        <p className="mt-2 text-sm text-red-700">
          Something went wrong while loading platform analytics. Please try again.
        </p>
        <a
          href="/super-admin"
          className="mt-4 inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Try Again
        </a>
      </div>
    );
  }

  return <SuperAdminDashboardView data={data} />;
}
