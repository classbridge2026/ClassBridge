import type { Metadata } from "next";
import Link from "next/link";
import { SessionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";
import {
  BookOpen,
  Layers,
  GraduationCap,
  ChevronRight,
  UserCheck,
  Calendar,
  Sparkles,
  Video,
  ClipboardList,
  Bell,
  MessageSquare,
  ClipboardCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Student Dashboard — ClassBridge",
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function formatTime(date: Date | null) {
  if (!date) return "TBD";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function StudentDashboardPage() {
  const { user, studentProfile, courseIds, institutionId, institutionName } =
    await requireStudentContext();

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    enrollments,
    todaySessions,
    liveSessions,
    upcomingSessions,
    assignments,
    mySubmissions,
    attendanceRecords,
    unreadNotifications,
  ] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { studentProfileId: studentProfile.id },
      include: {
        course: {
          include: {
            lecturerProfile: {
              include: {
                institutionUser: {
                  include: { user: { select: { fullName: true } } },
                },
              },
            },
            modules: { select: { id: true } },
            department: { select: { name: true } },
            program: { select: { name: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    courseIds.length > 0
      ? prisma.classSession.findMany({
          where: {
            institutionId,
            courseId: { in: courseIds },
            OR: [
              { status: SessionStatus.LIVE },
              {
                scheduledStart: { gte: todayStart, lte: todayEnd },
                status: { in: [SessionStatus.SCHEDULED, SessionStatus.LIVE] },
              },
            ],
          },
          include: {
            course: {
              select: {
                code: true,
                title: true,
                lecturerProfile: {
                  include: {
                    institutionUser: {
                      include: { user: { select: { fullName: true } } },
                    },
                  },
                },
              },
            },
          },
          orderBy: [{ status: "asc" }, { scheduledStart: "asc" }],
        })
      : Promise.resolve([]),
    courseIds.length > 0
      ? prisma.classSession.count({
          where: {
            institutionId,
            courseId: { in: courseIds },
            status: SessionStatus.LIVE,
          },
        })
      : Promise.resolve(0),
    courseIds.length > 0
      ? prisma.classSession.findMany({
          where: {
            institutionId,
            courseId: { in: courseIds },
            status: { in: [SessionStatus.SCHEDULED, SessionStatus.LIVE] },
            scheduledStart: { gte: new Date() },
          },
          take: 5,
          orderBy: { scheduledStart: "asc" },
          include: {
            course: { select: { code: true, title: true } },
          },
        })
      : Promise.resolve([]),
    courseIds.length > 0
      ? prisma.assignment.findMany({
          where: {
            institutionId,
            courseId: { in: courseIds },
            published: true,
          },
          select: { id: true, dueAt: true },
        })
      : Promise.resolve([]),
    prisma.assignmentSubmission.findMany({
      where: {
        userId: user.id,
        assignment: {
          institutionId,
          courseId: { in: courseIds.length > 0 ? courseIds : ["__none__"] },
          published: true,
        },
      },
      select: { id: true, grade: true, assignmentId: true },
    }),
    prisma.classAttendance.findMany({
      where: { studentProfileId: studentProfile.id },
      select: { status: true },
    }),
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
  ]);

  const submittedIds = new Set(mySubmissions.map((s) => s.assignmentId));
  const pendingAssignments = assignments.filter((a) => !submittedIds.has(a.id)).length;
  const completedAssignments = mySubmissions.length;
  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE")
    .length;
  const attendanceRate =
    attendanceRecords.length > 0
      ? Math.round((presentCount / attendanceRecords.length) * 100)
      : null;
  const totalModules = enrollments.reduce((acc, e) => acc + e.course.modules.length, 0);

  const todaysLearning = todaySessions;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563EB] via-blue-700 to-[#0F172A] p-6 text-white shadow-md sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-200" />
            <span>Student Learning Portal</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Welcome back, {user.fullName.split(" ")[0]}!
          </h2>
          <p className="text-xs leading-relaxed text-blue-100 sm:text-sm">
            Enrolled at <strong className="font-bold text-white">{institutionName}</strong>. Join
            live classes, submit assignments, and track your progress.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Courses", value: enrollments.length, icon: BookOpen, color: "text-blue-600 bg-blue-50" },
          { label: "Live now", value: liveSessions, icon: Video, color: "text-red-600 bg-red-50" },
          { label: "Pending work", value: pendingAssignments, icon: ClipboardList, color: "text-amber-600 bg-amber-50" },
          { label: "Submitted", value: completedAssignments, icon: Layers, color: "text-indigo-600 bg-indigo-50" },
          {
            label: "Attendance",
            value: attendanceRate === null ? "—" : `${attendanceRate}%`,
            icon: ClipboardCheck,
            color: "text-emerald-600 bg-emerald-50",
          },
          { label: "Unread", value: unreadNotifications, icon: Bell, color: "text-violet-600 bg-violet-50" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Calendar className="h-5 w-5 text-[#2563EB]" />
              Today&apos;s Learning
            </h2>
            <Link
              href="/student/live-classes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-blue-800"
            >
              All classes <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {todaysLearning.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <Video className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">No classes today</h3>
              <p className="mt-1 text-xs text-slate-500">
                You don&apos;t have any live or scheduled sessions for today.
              </p>
              <Link
                href="/student/schedule"
                className="mt-4 inline-flex rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                View schedule
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysLearning.map((session) => {
                const lecturer =
                  session.course.lecturerProfile?.institutionUser.user.fullName ?? null;
                const isLive = session.status === SessionStatus.LIVE;
                const canJoin =
                  session.status === SessionStatus.LIVE ||
                  session.status === SessionStatus.SCHEDULED;

                return (
                  <article
                    key={session.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-[#2563EB]">
                          {session.course.code}
                        </span>
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
                            Live
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                            {session.status}
                          </span>
                        )}
                      </div>
                      <h3 className="truncate text-sm font-bold text-slate-900">{session.course.title}</h3>
                      <p className="text-xs text-slate-600">{session.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatTime(session.scheduledStart ?? session.startedAt)}
                        {lecturer ? ` · ${lecturer}` : ""}
                      </p>
                    </div>
                    {canJoin ? (
                      <Link
                        href={`/class/${session.id}/live`}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Video className="h-4 w-4" />
                        {isLive ? "Join Class" : "Waiting Room"}
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Unavailable</span>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <BookOpen className="h-5 w-5 text-[#2563EB]" />
              My Enrolled Courses
            </h2>
            <Link
              href="/student/courses"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-blue-800"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">No courses yet</h3>
              <p className="mt-1 text-xs text-slate-500">
                Your campus administrator will assign your course roster.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {enrollments.slice(0, 4).map(({ course }) => {
                const lecturerName =
                  course.lecturerProfile?.institutionUser.user.fullName ?? "Unassigned";
                return (
                  <Link
                    key={course.id}
                    href={`/student/courses/${course.id}`}
                    className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#2563EB]">
                        {course.code}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <UserCheck className="h-3.5 w-3.5" />
                        {lecturerName}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-[#2563EB]">
                      {course.title}
                    </h3>
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <Layers className="h-3.5 w-3.5 text-indigo-500" />
                      {course.modules.length} modules
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <GraduationCap className="h-4 w-4 text-[#2563EB]" />
              Academic snapshot
            </h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Student ID</dt>
                <dd className="font-mono font-bold text-slate-900">
                  {studentProfile.studentNumber || "—"}
                </dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Modules</dt>
                <dd className="font-bold text-slate-900">{totalModules}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Upcoming classes</dt>
                <dd className="font-bold text-slate-900">
                  {upcomingSessions.length}
                  {upcomingSessions[0]
                    ? ` · next ${upcomingSessions[0].course.code}`
                    : ""}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Unread alerts</dt>
                <dd className="font-bold text-slate-900">{unreadNotifications}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <h2 className="text-sm font-bold text-slate-900">Quick links</h2>
            {[
              { href: "/student/assignments", label: "Assignments", icon: ClipboardList },
              { href: "/student/messages", label: "Messages", icon: MessageSquare },
              { href: "/student/notifications", label: "Notifications", icon: Bell },
              { href: "/student/recordings", label: "Recordings", icon: Video },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Icon className="h-4 w-4 text-[#2563EB]" />
                  {item.label}
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
