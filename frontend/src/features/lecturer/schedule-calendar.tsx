"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SessionStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type ScheduleSession = {
  id: string;
  title: string;
  status: SessionStatus;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  courseCode: string;
  courseTitle: string;
};

export type ScheduleCalendarLinks = {
  detailHref: (sessionId: string) => string;
  joinLabelLive?: string;
  joinLabelScheduled?: string;
};

type ViewMode = "day" | "week" | "month";

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ScheduleCalendar({
  sessions,
  links = {
    detailHref: (id) => `/lecturer/classes/${id}`,
    joinLabelLive: "Enter",
    joinLabelScheduled: "Start",
  },
}: {
  sessions: ScheduleSession[];
  links?: ScheduleCalendarLinks;
}) {
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const days = useMemo(() => {
    if (view === "day") return [anchor];
    if (view === "week") {
      const start = startOfWeek(anchor);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [anchor, view]);

  const title = useMemo(() => {
    if (view === "day") {
      return anchor.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (view === "week") {
      const start = days[0]!;
      const end = days[6]!;
      return `${start.toLocaleDateString([], { month: "short", day: "numeric" })} – ${end.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return anchor.toLocaleDateString([], { month: "long", year: "numeric" });
  }, [anchor, days, view]);

  function shift(dir: -1 | 1) {
    setAnchor((prev) => {
      const next = new Date(prev);
      if (view === "day") next.setDate(next.getDate() + dir);
      else if (view === "week") next.setDate(next.getDate() + dir * 7);
      else next.setMonth(next.getMonth() + dir);
      return next;
    });
  }

  function sessionsForDay(day: Date) {
    return sessions.filter((s) => {
      if (!s.scheduledStart) return false;
      return sameDay(new Date(s.scheduledStart), day);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              setAnchor(d);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="ml-2 text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1" role="tablist">
          {(["day", "week", "month"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={view === mode}
              onClick={() => setView(mode)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize ${
                view === mode ? "bg-[#2563EB] text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-1 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const inMonth = day.getMonth() === anchor.getMonth();
              const items = sessionsForDay(day);
              const isToday = sameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 border-b border-r border-slate-100 p-1.5 ${
                    inMonth ? "bg-white" : "bg-slate-50/60"
                  }`}
                >
                  <p
                    className={`mb-1 text-[11px] font-bold ${
                      isToday
                        ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] text-white"
                        : inMonth
                          ? "text-slate-800"
                          : "text-slate-400"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                  <ul className="space-y-0.5">
                    {items.slice(0, 3).map((s) => (
                      <li key={s.id}>
                        <Link
                          href={links.detailHref(s.id)}
                          className="block truncate rounded bg-blue-50 px-1 py-0.5 text-[10px] font-semibold text-blue-800 hover:bg-blue-100"
                        >
                          {formatTime(s.scheduledStart)} {s.title}
                        </Link>
                      </li>
                    ))}
                    {items.length > 3 ? (
                      <li className="text-[10px] text-slate-500">+{items.length - 3} more</li>
                    ) : null}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`grid gap-3 ${view === "week" ? "md:grid-cols-7" : "grid-cols-1"}`}>
          {days.map((day) => {
            const items = sessionsForDay(day);
            const isToday = sameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`rounded-xl border bg-white p-3 shadow-sm ${
                  isToday ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {day.toLocaleDateString([], { weekday: "short" })}
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {day.toLocaleDateString([], { month: "short", day: "numeric" })}
                </p>
                <ul className="mt-3 space-y-2">
                  {items.length === 0 ? (
                    <li className="text-[11px] text-slate-400">No classes</li>
                  ) : (
                    items.map((s) => {
                      const joinable =
                        s.status === SessionStatus.SCHEDULED || s.status === SessionStatus.LIVE;
                      return (
                        <li
                          key={s.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-2"
                        >
                          <p className="text-[10px] font-bold text-[#2563EB]">
                            {formatTime(s.scheduledStart)}
                            {s.scheduledEnd ? ` – ${formatTime(s.scheduledEnd)}` : ""}
                          </p>
                          <p className="text-xs font-bold text-slate-900">{s.title}</p>
                          <p className="text-[10px] text-slate-500">{s.courseCode}</p>
                          <div className="mt-1.5 flex gap-2">
                            <Link
                              href={links.detailHref(s.id)}
                              className="text-[10px] font-bold text-slate-600 hover:underline"
                            >
                              Details
                            </Link>
                            {joinable ? (
                              <Link
                                href={`/class/${s.id}/live`}
                                className="text-[10px] font-bold text-[#2563EB] hover:underline"
                              >
                                {s.status === SessionStatus.LIVE
                                  ? (links.joinLabelLive ?? "Enter")
                                  : (links.joinLabelScheduled ?? "Start")}
                              </Link>
                            ) : null}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
