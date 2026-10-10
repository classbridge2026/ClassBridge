"use client";

import { GraduationCap } from "lucide-react";

type WaitingForLecturerProps = {
  lecturerName: string | null;
};

export function WaitingForLecturer({ lecturerName }: WaitingForLecturerProps) {
  return (
    <div
      className="flex min-h-[220px] flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/15 text-blue-300">
        <GraduationCap className="h-7 w-7" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-100">Waiting for the lecturer</p>
        <p className="max-w-sm text-xs text-slate-400">
          {lecturerName
            ? `${lecturerName} has not joined the video room yet. Stay connected — class will begin when they appear.`
            : "Your lecturer has not joined the video room yet. Stay connected — class will begin when they appear."}
        </p>
      </div>
    </div>
  );
}
