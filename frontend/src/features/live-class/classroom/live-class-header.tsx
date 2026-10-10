"use client";

import { Logo } from "@/components/shared/logo";
import { ConnectionStatus } from "@/features/live-class/classroom/connection-status";
import { useClassTimer } from "@/features/live-class/hooks/use-class-timer";
import type { LiveClassSessionPayload } from "@/features/live-class/types";
import { ConnectionState } from "livekit-client";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

type LiveClassHeaderProps = {
  session: LiveClassSessionPayload;
  connectionState: ConnectionState;
  participantCount: number;
  /** Server start time; updated after host starts class. */
  startedAt: string | null;
  isRecording?: boolean;
};

export function LiveClassHeader({
  session,
  connectionState,
  participantCount,
  startedAt,
  isRecording = false,
}: LiveClassHeaderProps) {
  const timer = useClassTimer(startedAt);
  const roleLabel =
    session.role === "host" ? "Lecturer" : session.role === "student" ? "Student" : "Observer";

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0B1220]/95 px-3 py-2.5 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Logo size="sm" className="shrink-0 text-white [&_span:last-child]:text-white" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-xs font-medium text-slate-400">{session.course.code}</p>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                session.role === "host"
                  ? "bg-blue-600/20 text-blue-300"
                  : "bg-slate-800 text-slate-300",
              )}
            >
              {roleLabel}
            </span>
          </div>
          <h1 className="truncate text-sm font-semibold text-white sm:text-base">
            {session.course.title}
            <span className="mx-1.5 font-normal text-slate-500">·</span>
            <span className="font-medium text-slate-200">{session.title}</span>
          </h1>
          {session.role !== "host" && session.lecturerName ? (
            <p className="truncate text-[11px] text-slate-500">
              Lecturer: {session.lecturerName}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-md bg-red-600/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-red-400"
          aria-label="Class is live"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden />
          Live
        </span>
        {isRecording ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
            aria-label="Recording in progress"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
            Recording
          </span>
        ) : null}
        <time
          className="tabular-nums text-sm font-semibold text-slate-100"
          dateTime={startedAt ?? undefined}
          aria-label={`Class duration ${timer}`}
        >
          {timer}
        </time>
        <span
          className="hidden items-center gap-1 text-[11px] text-slate-400 sm:inline-flex"
          aria-label={`${participantCount} participants`}
        >
          <Users className="h-3.5 w-3.5" aria-hidden />
          {participantCount}
        </span>
        <ConnectionStatus state={connectionState} className="hidden md:inline-flex" />
      </div>
    </header>
  );
}
