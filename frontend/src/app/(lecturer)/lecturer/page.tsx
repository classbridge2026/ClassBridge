import type { Metadata } from "next";
import Link from "next/link";
import { SessionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";
import { storageAdapter } from "@/lib/storage/adapter";
import { InstitutionLogoMark } from "@/components/shared/institution-logo-mark";
import {
  BookOpen,
  Users,
  Video,
  ClipboardList,
  MessageSquare,
  Calendar,
  ChevronRight,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Lecturer Dashboard — ClassBridge",
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

function formatTime(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function LecturerDashboardPage() {
  const ctx = await requireLecturerContext();
  const { user, institutionId, institutionName, lecturerProfile, courseIds } = ctx;
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    courses,
    sessionsToday,
    upcomingSessions,
    liveSessions,
    pendingAssignments,
    unreadMessages,
    studentAgg,
  ] = await Promise.all([
    prisma.course.findMany({
      where: { lecturerProfileId: lecturerProfile.id },
      include: {
        _count: { select: { enrollments: true, sessions: true } },
        department: { select: { name: true } },
        program: { select: { name: true } },
      },
      orderBy: { code: "asc" },
      take: 6,
    }),
    courseIds.length
      ? prisma.classSession.findMany({
          where: {
            institutionId,
            courseId: { in: courseIds },
            status: { in: [SessionStatus.SCHEDULED, SessionStatus.LIVE] },
            OR: [
              { scheduledStart: { gte: todayStart, lte: todayEnd } },
              { status: SessionStatus.LIVE },
            ],
          },
          include: {
            course: { select: { code: true, title: true } },
            _count: { select: { attendance: true } },
          },
          orderBy: { scheduledStart: "asc" },
        })
      : Promise.resolve([]),
    courseIds.length
      ? prisma.classSession.findMany({
          where: {
            institutionId,
            courseId: { in: courseIds },
            status: SessionStatus.SCHEDULED,
            scheduledStart: { gt: todayEnd },
          },
          include: {
            course: { select: { code: true, title: true } },
            _count: { select: { attendance: true } },
          },
          orderBy: { scheduledStart: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    courseIds.length
      ? prisma.classSession.count({
          where: {
            institutionId,
            courseId: { in: courseIds },
            status: SessionStatus.LIVE,
          },
        })
      : Promise.resolve(0),
    courseIds.length
      ? prisma.assignment.count({
          where: {
            courseId: { in: courseIds },
            published: true,
            submissions: { some: { grade: null } },
          },
        })
      : Promise.resolve(0),
    prisma.notification.count({
      where: {
        userId: user.id,
        readAt: null,
        type: "MESSAGE",
      },
    }),
    courseIds.length
      ? prisma.courseEnrollment.findMany({
          where: { courseId: { in: courseIds } },
          select: { studentProfileId: true },
          distinct: ["studentProfileId"],
        })
      : Promise.resolve([]),
  ]);

  const myCourses = await prisma.course.count({
    where: { lecturerProfileId: lecturerProfile.id },
  });
  const myStudents = studentAgg.length;

  const titlePrefix = lecturerProfile.title ? `${lecturerProfile.title} ` : "";

  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { logoStorageKey: true },
  });
  const logoUrl = institution?.logoStorageKey
    ? storageAdapter.getFileUrl(institution.logoStorageKey)
    : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#2563EB] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-200">
              {institutionName}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome, {titlePrefix}
              {user.fullName}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Manage courses, start live classes, grade assignments, and stay connected with your
              students from one place.
            </p>
          </div>
          <InstitutionLogoMark name={institutionName} logoUrl={logoUrl} tone="on-dark" />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          { label: "My Courses", value: myCourses, href: "/lecturer/courses", icon: BookOpen },
          { label: "My Students", value: myStudents, href: "/lecturer/students", icon: Users },
          {
            label: "Classes Today",
            value: sessionsToday.length,
            href: "/lecturer/schedule",
            icon: Calendar,
          },
          { label: "Live Now", value: liveSessions, href: "/lecturer/live-classes", icon: Video },
          {
            label: "Upcoming",
            value: upcomingSessions.length,
            href: "/lecturer/classes",
            icon: Clock,
          },
          {
            label: "To Grade",
            value: pendingAssignments,
            href: "/lecturer/assignments",
            icon: ClipboardList,
          },
          {
            label: "Unread",
            value: unreadMessages,
            href: "/lecturer/messages",
            icon: MessageSquare,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </span>
                <Icon className="h-4 w-4 text-[#2563EB]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
            </Link>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Today&apos;s Teaching</h3>
            <Link
              href="/lecturer/schedule"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Full schedule <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {sessionsToday.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <Calendar className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-900">No classes scheduled today</p>
              <p className="mt-1 text-xs text-slate-500">
                When you have sessions today, they will appear here with Start Class actions.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sessionsToday.map((session) => {
                const canStart =
                  session.status === SessionStatus.SCHEDULED ||
                  session.status === SessionStatus.LIVE;
                return (
                  <li
                    key={session.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#2563EB]">
                          {formatTime(session.scheduledStart)}
                          {session.scheduledEnd
                            ? ` – ${formatTime(session.scheduledEnd)}`
                            : ""}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            session.status === SessionStatus.LIVE
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {session.status === SessionStatus.LIVE ? "Live" : "Scheduled"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-bold text-slate-900">
                        {session.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {session.course.code} · {session.course.title} · Online
                      </p>
                    </div>
                    {canStart ? (
                      <Link
                        href={`/class/${session.id}/live`}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        {session.status === SessionStatus.LIVE ? "Enter Class" : "Start Class"}
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="pt-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Upcoming Classes</h3>
              <Link
                href="/lecturer/classes"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {upcomingSessions.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                No upcoming scheduled classes beyond today.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Class</th>
                      <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">When</th>
                      <th className="px-4 py-2.5 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingSessions.map((session) => (
                      <tr key={session.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{session.title}</p>
                          <p className="text-xs text-slate-500">{session.course.code}</p>
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-slate-600 sm:table-cell">
                          {session.scheduledStart
                            ? session.scheduledStart.toLocaleString([], {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/class/${session.id}/live`}
                            className="text-xs font-bold text-[#2563EB] hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">My Courses</h3>
            <Link
              href="/lecturer/courses"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
            >
              All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {courses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
              <BookOpen className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-900">No courses assigned yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Ask your institution admin to assign you as primary lecturer.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {courses.map((course) => (
                <li key={course.id}>
                  <Link
                    href={`/lecturer/courses/${course.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
                  >
                    <span className="font-mono text-[10px] font-bold text-[#2563EB]">
                      {course.code}
                    </span>
                    <p className="mt-1 text-sm font-bold text-slate-900">{course.title}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {course._count.enrollments} students · {course._count.sessions} classes
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/lecturer/live-classes"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Video className="h-4 w-4" />
            Open Live Classes
          </Link>
        </section>
      </div>
    </div>
  );
}
