import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faBuilding,
  faCalendarPlus,
  faChalkboardTeacher,
  faCirclePlus,
  faGraduationCap,
  faLayerGroup,
  faPlus,
  faRadio,
  faUserGraduate,
} from "@fortawesome/free-solid-svg-icons";
import { InstStatCard } from "@/components/institution-admin/shared/stat-card";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import { GrowthChart } from "@/components/super-admin/dashboard/growth-chart";
import { DistributionPanel } from "@/components/super-admin/dashboard/distribution-panel";
import { PeoplePieChart } from "@/components/institution-admin/dashboard/people-pie-chart";
import { InstitutionLogoMark } from "@/components/shared/institution-logo-mark";
import { formatAuditAction } from "@/lib/audit/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { getInstitutionDashboard } from "@/services/institution-admin-dashboard";

type DashboardData = Awaited<ReturnType<typeof getInstitutionDashboard>>;

const QUICK_ACTIONS = [
  {
    href: "/institution-admin/students?create=1",
    label: "Add Student",
    icon: faUserGraduate,
    tone: "bg-blue-50 text-blue-600",
  },
  {
    href: "/institution-admin/lecturers?create=1",
    label: "Add Lecturer",
    icon: faChalkboardTeacher,
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/institution-admin/courses?create=1",
    label: "Create Course",
    icon: faBookOpen,
    tone: "bg-violet-50 text-violet-600",
  },
  {
    href: "/institution-admin/programs?create=1",
    label: "Create Program",
    icon: faLayerGroup,
    tone: "bg-sky-50 text-sky-600",
  },
  {
    href: "/institution-admin/departments?create=1",
    label: "Create Department",
    icon: faBuilding,
    tone: "bg-slate-100 text-slate-700",
  },
  {
    href: "/institution-admin/classes?create=1",
    label: "Schedule Class",
    icon: faCalendarPlus,
    tone: "bg-amber-50 text-amber-600",
  },
] as const;

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function InstitutionDashboardView({
  institutionName,
  adminName,
  logoUrl,
  data,
}: {
  institutionName: string;
  adminName: string;
  logoUrl?: string | null;
  data: DashboardData;
}) {
  const { stats, recentActivity, enrollmentSeries, courseDistribution, peopleDistribution, liveClasses } =
    data;

  const activityPreview = recentActivity.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#2563EB] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
              {institutionName}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {adminName.split(" ")[0]}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Analytics overview for people, academics, and live classes across your institution.
            </p>
          </div>
          <InstitutionLogoMark
            name={institutionName}
            logoUrl={logoUrl}
            caption="Institution analytics"
            tone="on-dark"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InstStatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={faUserGraduate}
          tone="blue"
          hint="Enrolled student profiles"
        />
        <InstStatCard
          label="Total Lecturers"
          value={stats.totalLecturers}
          icon={faChalkboardTeacher}
          tone="green"
          hint="Teaching faculty"
        />
        <InstStatCard
          label="Total Courses"
          value={stats.totalCourses}
          icon={faBookOpen}
          tone="violet"
          hint="Campus courses"
        />
        <InstStatCard
          label="Total Programs"
          value={stats.totalPrograms}
          icon={faLayerGroup}
          tone="sky"
          hint="Academic programs"
        />
        <InstStatCard
          label="Total Departments"
          value={stats.totalDepartments}
          icon={faBuilding}
          tone="slate"
          hint="Academic units"
        />
        <InstStatCard
          label="Upcoming Classes"
          value={stats.upcomingClasses}
          icon={faCalendarPlus}
          tone="amber"
          hint="Scheduled sessions"
        />
        <InstStatCard
          label="Active Classes"
          value={stats.activeClasses}
          icon={faRadio}
          tone="rose"
          hint="Currently live"
        />
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          <FontAwesomeIcon icon={faCirclePlus} className="h-3.5 w-3.5 text-blue-500" />
          Quick actions
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md"
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:scale-105",
                  action.tone,
                )}
              >
                <FontAwesomeIcon icon={action.icon} className="h-4 w-4" />
              </span>
              <span className="flex-1">{action.label}</span>
              <FontAwesomeIcon
                icon={faPlus}
                className="h-3 w-3 text-slate-300 transition group-hover:text-blue-500"
              />
            </Link>
          ))}
        </div>
      </div>

      {liveClasses.length > 0 ? (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <FontAwesomeIcon icon={faRadio} className="h-4 w-4 text-rose-500" />
            Live now
          </h3>
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

      <div className="grid gap-4 xl:grid-cols-2">
        <GrowthChart
          title="Student enrollment"
          description="New student profiles over the last 6 months."
          series={enrollmentSeries}
          color="#2563EB"
        />
        <DistributionPanel
          title="Course distribution"
          description="Courses by status across your institution."
          items={courseDistribution}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PeoplePieChart
          title="People distribution"
          description="Students, lecturers, and administrators."
          items={peopleDistribution}
        />
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <FontAwesomeIcon icon={faGraduationCap} className="h-3.5 w-3.5 text-slate-500" />
                Recent activity
              </h3>
              <p className="mt-1 text-xs text-slate-500">Latest actions in your institution.</p>
            </div>
            <Link
              href="/institution-admin/activity"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {activityPreview.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No institution activity recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activityPreview.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatAuditAction(item.action)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {item.actor?.fullName ?? "System"} · {item.resourceType}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-slate-400">
                    {relativeTime(item.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
