import type { Metadata } from "next";
import Link from "next/link";
import { SessionStatus } from "@prisma/client";
import { Video, Radio, Clock, Calendar } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";

export const metadata: Metadata = {
  title: "Live Classes — Lecturer Portal",
};

function formatWhen(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function LecturerLiveClassesPage() {
  const { institutionId, courseIds, institutionName } = await requireLecturerContext();
  const now = new Date();
  const windowStart = new Date(now.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const sessions =
    courseIds.length > 0
      ? await prisma.classSession.findMany({
          where: {
            institutionId,
            courseId: { in: courseIds },
            status: { in: [SessionStatus.SCHEDULED, SessionStatus.LIVE] },
            OR: [
              { status: SessionStatus.LIVE },
              {
                status: SessionStatus.SCHEDULED,
                scheduledStart: { gte: windowStart, lte: windowEnd },
              },
            ],
          },
          include: {
            course: { select: { code: true, title: true } },
            _count: { select: { attendance: true } },
          },
          orderBy: [{ status: "asc" }, { scheduledStart: "asc" }],
        })
      : [];

  const live = sessions.filter((s) => s.status === SessionStatus.LIVE);
  const upcoming = sessions.filter((s) => s.status === SessionStatus.SCHEDULED);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Video className="h-6 w-6 text-[#2563EB]" />
          Live Classes
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Start or rejoin live sessions for {institutionName}.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live now</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{live.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Ready to start
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{upcoming.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            In this window
          </p>
          <p className="mt-1 text-2xl font-bold text-[#2563EB]">{sessions.length}</p>
        </div>
      </section>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Radio className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-lg font-bold text-slate-900">No live or startable classes</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Classes appear here when they are live or scheduled within the next 24 hours. Manage
            your full roster from My Classes.
          </p>
          <Link
            href="/lecturer/classes"
            className="mt-4 inline-flex rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            Open My Classes
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {sessions.map((session) => {
            const isLive = session.status === SessionStatus.LIVE;
            return (
              <li
                key={session.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#2563EB]">
                      {session.course.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isLive ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {isLive ? (
                        <>
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
                          Live
                        </>
                      ) : (
                        "Scheduled"
                      )}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-base font-bold text-slate-900">{session.title}</p>
                  <p className="truncate text-xs text-slate-500">{session.course.title}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatWhen(session.scheduledStart)}
                    </span>
                    {session.scheduledEnd ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Ends {formatTime(session.scheduledEnd)}
                      </span>
                    ) : null}
                    <span>{session._count.attendance} joined</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/lecturer/classes/${session.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Details
                  </Link>
                  <Link
                    href={`/class/${session.id}/live`}
                    className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    {isLive ? "Enter Class" : "Start Class"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
