"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SessionStatus } from "@prisma/client";
import { ScheduleClassForm } from "@/features/live-class/schedule-class-form";

export type LecturerClassRow = {
  id: string;
  title: string;
  description: string | null;
  status: SessionStatus;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  courseCode: string;
  courseTitle: string;
  attendanceCount: number;
  recordingCount: number;
};

const TABS: { key: string; label: string; match: (s: SessionStatus) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  {
    key: "today",
    label: "Today",
    match: () => true, // filtered separately
  },
  {
    key: "upcoming",
    label: "Upcoming",
    match: (s) => s === SessionStatus.SCHEDULED,
  },
  { key: "live", label: "Live", match: (s) => s === SessionStatus.LIVE },
  {
    key: "completed",
    label: "Completed",
    match: (s) => s === SessionStatus.COMPLETED,
  },
  {
    key: "cancelled",
    label: "Cancelled",
    match: (s) => s === SessionStatus.CANCELLED,
  },
];

function isToday(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LecturerClassesBoard({
  sessions,
  courses,
}: {
  sessions: LecturerClassRow[];
  courses: { id: string; code: string; title: string }[];
}) {
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (tab === "today") {
        return (
          isToday(s.scheduledStart) ||
          s.status === SessionStatus.LIVE
        );
      }
      if (tab === "upcoming") {
        return (
          s.status === SessionStatus.SCHEDULED &&
          !!s.scheduledStart &&
          new Date(s.scheduledStart) > new Date() &&
          !isToday(s.scheduledStart)
        );
      }
      const def = TABS.find((t) => t.key === tab);
      return def ? def.match(s.status) : true;
    });
  }, [sessions, tab]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Classes</h2>
          <p className="mt-1 text-sm text-slate-600">
            Schedule sessions and open the live classroom when it is time to teach.
          </p>
        </div>
        <ScheduleClassForm courses={courses} />
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Class filters">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              tab === t.key
                ? "bg-[#2563EB] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Class</th>
              <th className="px-4 py-3 font-semibold">Course</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">When</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="hidden px-4 py-3 font-semibold lg:table-cell">Students</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  No classes in this view. Schedule a class to get started.
                </td>
              </tr>
            ) : (
              filtered.map((session) => {
                const joinable =
                  session.status === SessionStatus.SCHEDULED ||
                  session.status === SessionStatus.LIVE;
                return (
                  <tr key={session.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{session.title}</p>
                      {session.description ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                          {session.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-mono text-xs font-bold text-[#2563EB]">
                        {session.courseCode}
                      </span>
                      <p className="text-xs">{session.courseTitle}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-600 md:table-cell">
                      {formatWhen(session.scheduledStart)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${
                          session.status === SessionStatus.LIVE
                            ? "bg-red-50 text-red-700"
                            : session.status === SessionStatus.COMPLETED
                              ? "bg-emerald-50 text-emerald-700"
                              : session.status === SessionStatus.CANCELLED
                                ? "bg-slate-100 text-slate-500"
                                : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-600 lg:table-cell">
                      {session.attendanceCount} attended
                      {session.recordingCount > 0
                        ? ` · ${session.recordingCount} rec.`
                        : ""}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/lecturer/classes/${session.id}`}
                          className="text-xs font-bold text-slate-600 hover:underline"
                        >
                          View
                        </Link>
                        {joinable ? (
                          <Link
                            href={`/class/${session.id}/live`}
                            className="text-xs font-bold text-[#2563EB] hover:underline"
                          >
                            {session.status === SessionStatus.LIVE ? "Enter" : "Start"}
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
