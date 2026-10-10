import Link from "next/link";
import {
  GraduationCap,
  Users,
  BookOpen,
  BookMarked,
  Building2,
  Calendar,
  Radio,
  Plus,
} from "lucide-react";
import { InstStatCard } from "@/components/institution-admin/shared/stat-card";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import { formatAuditAction } from "@/lib/audit/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { getInstitutionDashboard } from "@/services/institution-admin-dashboard";

type DashboardData = Awaited<ReturnType<typeof getInstitutionDashboard>>;

const QUICK_ACTIONS = [
  { href: "/institution-admin/students?create=1", label: "Add Student", icon: GraduationCap },
  { href: "/institution-admin/lecturers?create=1", label: "Add Lecturer", icon: Users },
  { href: "/institution-admin/courses?create=1", label: "Create Course", icon: BookOpen },
  { href: "/institution-admin/programs?create=1", label: "Create Program", icon: BookMarked },
  { href: "/institution-admin/departments?create=1", label: "Create Department", icon: Building2 },
  { href: "/institution-admin/classes?create=1", label: "Schedule Class", icon: Calendar },
];

export function InstitutionDashboardView({
  institutionName,
  adminName,
  data,
}: {
  institutionName: string;
  adminName: string;
  data: DashboardData;
}) {
  const { stats, recentActivity, enrollmentSeries, courseDistribution, peopleDistribution, liveClasses } =
    data;

  const maxEnrollment = Math.max(1, ...enrollmentSeries.map((d) => d.count));
  const maxCourse = Math.max(1, ...courseDistribution.map((d) => d.count));
  const peopleTotal =
    peopleDistribution.students +
    peopleDistribution.lecturers +
    peopleDistribution.administrators;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#2563EB] p-6 text-white shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
          {institutionName}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back, {adminName.split(" ")[0]}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-blue-100">
          Monitor people, academics, and live classes for your institution from one command center.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InstStatCard label="Total Students" value={stats.totalStudents} icon={GraduationCap} tone="blue" hint="Enrolled student profiles" />
        <InstStatCard label="Total Lecturers" value={stats.totalLecturers} icon={Users} tone="green" hint="Teaching faculty" />
        <InstStatCard label="Total Courses" value={stats.totalCourses} icon={BookOpen} tone="violet" hint="Campus courses" />
        <InstStatCard label="Total Programs" value={stats.totalPrograms} icon={BookMarked} tone="sky" hint="Academic programs" />
        <InstStatCard label="Total Departments" value={stats.totalDepartments} icon={Building2} tone="slate" hint="Academic units" />
        <InstStatCard label="Upcoming Classes" value={stats.upcomingClasses} icon={Calendar} tone="amber" hint="Scheduled sessions" />
        <InstStatCard label="Active Classes" value={stats.activeClasses} icon={Radio} tone="rose" hint="Currently live" />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Quick actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Plus className="h-4 w-4" />
                </span>
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-slate-400" />
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {liveClasses.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900">Live now</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {liveClasses.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <InstStatusBadge status="LIVE" />
                    <p className="mt-2 font-bold text-slate-900">{session.title}</p>
                    <p className="text-xs text-slate-600">
                      {session.course.code} · {session.course.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Lecturer:{" "}
                      {session.course.lecturerProfile?.institutionUser.user.fullName ?? "Unassigned"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Participants: {session._count.attendance}
                      {session.startedAt
                        ? ` · Started ${session.startedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : null}
                    </p>
                  </div>
                  <Link
                    href={`/institution-admin/classes/${session.id}`}
                    className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Student enrollment (30 days)</h3>
          <p className="mt-1 text-xs text-slate-500">New student profiles created per day</p>
          <div className="mt-5 flex h-40 items-end gap-1">
            {enrollmentSeries.map((point) => (
              <div key={point.date} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div
                  className="w-full rounded-t bg-blue-500/80"
                  style={{ height: `${Math.max(4, (point.count / maxEnrollment) * 100)}%` }}
                  title={`${point.date}: ${point.count}`}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Course distribution</h3>
          <p className="mt-1 text-xs text-slate-500">Courses by status</p>
          <div className="mt-5 space-y-3">
            {courseDistribution.length === 0 ? (
              <p className="text-sm text-slate-500">No courses yet.</p>
            ) : (
              courseDistribution.map((row) => (
                <div key={row.status}>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
                    <span>{row.status}</span>
                    <span>{row.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${(row.count / maxCourse) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h4 className="text-sm font-bold text-slate-900">People distribution</h4>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Students", value: peopleDistribution.students },
                { label: "Lecturers", value: peopleDistribution.lecturers },
                { label: "Admins", value: peopleDistribution.administrators },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 px-2 py-3">
                  <p className="text-lg font-bold text-slate-900">{item.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {peopleTotal ? Math.round((item.value / peopleTotal) * 100) : 0}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">Recent activity</h3>
          <Link href="/institution-admin/activity" className="text-xs font-semibold text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-500">No institution activity recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{formatAuditAction(item.action)}</p>
                  <p className="text-xs text-slate-500">
                    {item.actor?.fullName ?? "System"} · {item.resourceType}
                  </p>
                </div>
                <time className="text-xs text-slate-400">
                  {item.createdAt.toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
