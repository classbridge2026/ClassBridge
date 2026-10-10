import type { Metadata } from "next";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { getPlatformAnalytics } from "@/services/analytics";
import { getSuperAdminDashboardData } from "@/services/super-admin-dashboard";
import { GrowthChart } from "@/components/super-admin/dashboard/growth-chart";
import { DistributionPanel } from "@/components/super-admin/dashboard/distribution-panel";
import { StatCard } from "@/components/super-admin/shared/stat-card";
import {
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Video,
  UserCog,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Reports — Super Admin",
};

export default async function SuperAdminReportsPage() {
  await requireSuperAdminUser();

  const [analytics, dashboard] = await Promise.all([
    getPlatformAnalytics(),
    getSuperAdminDashboardData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Platform reporting center</h2>
        <p className="mt-1 text-sm text-slate-600">
          Live counts and trends from PostgreSQL across all institutions.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Institutions" value={analytics.institutions} icon={Building2} tone="blue" />
        <StatCard
          label="Active institutions"
          value={analytics.activeInstitutions}
          icon={Building2}
          tone="green"
        />
        <StatCard label="Users" value={analytics.users} icon={Users} tone="slate" />
        <StatCard label="Students" value={analytics.students} icon={GraduationCap} tone="sky" />
        <StatCard label="Lecturers" value={analytics.lecturers} icon={UserCog} tone="violet" />
        <StatCard label="Courses" value={analytics.courses} icon={BookOpen} tone="amber" />
        <StatCard label="Sessions" value={analytics.sessions} icon={Video} tone="blue" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <GrowthChart
          title="Institution Growth"
          description="Institutions created over the last 6 months."
          series={dashboard.institutionGrowth}
        />
        <GrowthChart
          title="User Growth"
          description="User registrations over the last 6 months."
          series={dashboard.userGrowth}
          color="#16A34A"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DistributionPanel
          title="User Distribution"
          description="Students, lecturers, campus admins, and platform staff."
          items={dashboard.userDistribution}
        />
        <DistributionPanel
          title="Institution Status"
          description="Active, suspended, and trashed campuses."
          items={dashboard.institutionStatus}
        />
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Subscriptions by plan / status</h2>
        {analytics.subscriptions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No subscription rows yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {analytics.subscriptions.map((row) => (
              <li
                key={`${row.planKey}-${row.status}`}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="text-slate-700">
                  {row.planKey} · {row.status}
                </span>
                <span className="font-semibold text-slate-900">{row._count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
