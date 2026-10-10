import type { Metadata } from "next";
import Link from "next/link";
import { SessionStatus } from "@prisma/client";
import { Video, Radio } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";

export const metadata: Metadata = {
  title: "Live Classes — Student Portal",
};

function formatWhen(date: Date | null) {
  if (!date) return "Not scheduled";
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function StudentLiveClassesPage() {
  const { courseIds, institutionId, institutionName } = await requireStudentContext();

  const sessions =
    courseIds.length > 0
      ? await prisma.classSession.findMany({
          where: {
            institutionId,
            courseId: { in: courseIds },
            status: {
              in: [
                SessionStatus.SCHEDULED,
                SessionStatus.LIVE,
                SessionStatus.COMPLETED,
                SessionStatus.CANCELLED,
              ],
            },
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
          orderBy: [{ status: "asc" }, { scheduledStart: "desc" }],
        })
      : [];

  const live = sessions.filter((s) => s.status === SessionStatus.LIVE);
  const upcoming = sessions.filter((s) => s.status === SessionStatus.SCHEDULED);
  const past = sessions.filter(
    (s) => s.status === SessionStatus.COMPLETED || s.status === SessionStatus.CANCELLED,
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Video className="h-6 w-6 text-[#2563EB]" />
          Live Classes
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Join authorized live sessions for your enrolled courses at {institutionName}.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Video className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-lg font-bold text-slate-900">No class sessions yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            When lecturers schedule or start classes for your courses, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {live.length > 0 ? (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-red-700">
                <Radio className="h-4 w-4" />
                Live now
              </h3>
              <div className="grid gap-3">
                {live.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </section>
          ) : null}

          {upcoming.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Upcoming</h3>
              <div className="grid gap-3">
                {upcoming.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Past</h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Class</th>
                      <th className="px-4 py-3 font-semibold">Course</th>
                      <th className="px-4 py-3 font-semibold">When</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map((session) => {
                      const lecturer =
                        session.course.lecturerProfile?.institutionUser.user.fullName ?? "—";
                      return (
                        <tr key={session.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{session.title}</p>
                            <p className="text-xs text-slate-500">{lecturer}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {session.course.code} — {session.course.title}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatWhen(session.scheduledStart ?? session.startedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-700">
                              {session.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/student/live-classes/${session.id}`}
                              className="text-xs font-bold text-[#2563EB] hover:underline"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
}: {
  session: {
    id: string;
    title: string;
    status: SessionStatus;
    scheduledStart: Date | null;
    startedAt: Date | null;
    course: {
      code: string;
      title: string;
      lecturerProfile: {
        institutionUser: { user: { fullName: string } };
      } | null;
    };
  };
}) {
  const lecturer = session.course.lecturerProfile?.institutionUser.user.fullName ?? "Unassigned";
  const isLive = session.status === SessionStatus.LIVE;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#2563EB]">
            {session.course.code}
          </span>
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
              Live
            </span>
          ) : (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
              Scheduled
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-slate-900">{session.title}</h3>
        <p className="text-xs text-slate-600">{session.course.title}</p>
        <p className="text-xs text-slate-500">
          {lecturer} · {formatWhen(session.scheduledStart ?? session.startedAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/student/live-classes/${session.id}`}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          Details
        </Link>
        <Link
          href={`/class/${session.id}/live`}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
        >
          <Video className="h-3.5 w-3.5" />
          {isLive ? "Join Class" : "Waiting Room"}
        </Link>
      </div>
    </article>
  );
}
