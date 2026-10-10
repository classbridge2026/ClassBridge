import {
  Building2,
  GraduationCap,
  Shield,
  UserCheck,
  Users,
  UserCog,
} from "lucide-react";
import { StatCard } from "@/components/super-admin/shared/stat-card";
import { GrowthChart } from "@/components/super-admin/dashboard/growth-chart";
import { DistributionPanel } from "@/components/super-admin/dashboard/distribution-panel";
import { DashboardQuickActions } from "@/components/super-admin/dashboard/quick-actions";
import { DashboardRecentActivity } from "@/components/super-admin/dashboard/recent-activity";
import type { SuperAdminDashboardData } from "@/services/super-admin-dashboard";

export function SuperAdminDashboardView({ data }: { data: SuperAdminDashboardData }) {
  const { stats } = data;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#2563EB] p-6 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
          Super Admin Dashboard
        </p>
        <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
          Monitor and manage the entire ClassBridge platform.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-blue-100">
          Live counts and trends pulled directly from PostgreSQL — institutions, users, and
          platform activity in one place.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Institutions"
          value={stats.totalInstitutions}
          icon={Building2}
          tone="blue"
          hint={`${stats.activeInstitutions} active`}
        />
        <StatCard
          label="Active Institutions"
          value={stats.activeInstitutions}
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
          tone="slate"
          hint={`${stats.activeUsers} active accounts`}
        />
        <StatCard label="Total Students" value={stats.students} icon={GraduationCap} tone="sky" />
        <StatCard label="Total Lecturers" value={stats.lecturers} icon={UserCog} tone="violet" />
        <StatCard label="Platform Users" value={stats.platformUsers} icon={Shield} tone="amber" />
      </section>

      <DashboardQuickActions />

      <section className="grid gap-4 xl:grid-cols-2">
        <GrowthChart
          title="Institution Growth"
          description="Institutions created over the last 6 months."
          series={data.institutionGrowth}
          color="#2563EB"
        />
        <GrowthChart
          title="User Growth"
          description="User registrations over the last 6 months."
          series={data.userGrowth}
          color="#16A34A"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DistributionPanel
          title="User Distribution"
          description="Breakdown across students, lecturers, campus admins, and platform staff."
          items={data.userDistribution}
        />
        <DistributionPanel
          title="Institution Status"
          description="Current campus status across the platform."
          items={data.institutionStatus}
        />
      </section>

      <DashboardRecentActivity rows={data.recentActivity} />
    </div>
  );
}
