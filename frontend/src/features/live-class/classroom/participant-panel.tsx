"use client";

import { useParticipants } from "@livekit/components-react";
import { Users, X } from "lucide-react";
import { useMemo } from "react";
import { ParticipantItem } from "@/features/live-class/classroom/participant-item";
import { isHostParticipant } from "@/features/live-class/lib/participant-meta";
import { cn } from "@/lib/utils";

type ParticipantPanelProps = {
  open: boolean;
  onClose: () => void;
  /** Desktop sidebar vs mobile bottom sheet */
  variant?: "sidebar" | "sheet";
  className?: string;
  canModerate?: boolean;
  busyIdentity?: string | null;
  onMuteMic?: (identity: string) => void;
  onRemove?: (identity: string, name: string) => void;
};

export function ParticipantPanel({
  open,
  onClose,
  variant = "sidebar",
  className,
  canModerate = false,
  busyIdentity = null,
  onMuteMic,
  onRemove,
}: ParticipantPanelProps) {
  const participants = useParticipants();

  const { lecturers, students } = useMemo(() => {
    const sorted = [...participants].sort((a, b) => {
      const aHost = isHostParticipant(a) ? 1 : 0;
      const bHost = isHostParticipant(b) ? 1 : 0;
      if (aHost !== bHost) return bHost - aHost;
      if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
      return (a.name || a.identity).localeCompare(b.name || b.identity);
    });

    return {
      lecturers: sorted.filter((p) => isHostParticipant(p)),
      students: sorted.filter((p) => !isHostParticipant(p)),
    };
  }, [participants]);

  if (!open) return null;

  const panel = (
    <aside
      className={cn(
        "flex h-full min-h-0 w-full flex-col border-slate-800 bg-[#0E1628]",
        variant === "sidebar" && "border-l",
        variant === "sheet" && "rounded-t-2xl border-t shadow-2xl",
        className,
      )}
      aria-label="Participants"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-3 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-300" aria-hidden />
          <h2 className="text-sm font-semibold text-white">Participants</h2>
          <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-300">
            {participants.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Close participants"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {participants.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500">
            No participants connected yet.
          </p>
        ) : (
          <div className="space-y-4">
            {lecturers.length > 0 ? (
              <section aria-labelledby="participants-lecturer-heading">
                <h3
                  id="participants-lecturer-heading"
                  className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Lecturer
                </h3>
                <ul className="space-y-0.5">
                  {lecturers.map((p) => (
                    <ParticipantItem key={p.identity} participant={p} />
                  ))}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="participants-students-heading">
              <h3
                id="participants-students-heading"
                className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"
              >
                Students
                <span className="ml-1.5 font-semibold normal-case tracking-normal text-slate-600">
                  ({students.length})
                </span>
              </h3>
              {students.length === 0 ? (
                <p className="px-2.5 py-2 text-xs text-slate-500">No students connected yet.</p>
              ) : (
                <ul className="space-y-0.5">
                  {students.map((p) => (
                    <ParticipantItem
                      key={p.identity}
                      participant={p}
                      canModerate={canModerate}
                      moderating={busyIdentity === p.identity}
                      onMuteMic={onMuteMic}
                      onRemove={onRemove}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </aside>
  );

  if (variant === "sheet") {
    return (
      <div
        className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50 md:hidden"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="max-h-[70vh] min-h-[40vh]">{panel}</div>
      </div>
    );
  }

  return panel;
}
