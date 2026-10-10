"use client";

import { Button } from "@/components/ui/button";
import type { LiveClassSessionPayload } from "@/features/live-class/types";

type RemovedFromClassScreenProps = {
  session: LiveClassSessionPayload;
  onBack: () => void;
};

export function RemovedFromClassScreen({ session, onBack }: RemovedFromClassScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1220] px-6 text-slate-100">
      <div className="w-full max-w-md space-y-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ClassBridge</p>
        <h1 className="text-2xl font-semibold">Removed from class</h1>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-200">{session.course.title}</p>
          <p className="text-sm text-slate-400">
            {session.course.code} — {session.title}
          </p>
          {session.lecturerName ? (
            <p className="text-xs text-slate-500">Lecturer: {session.lecturerName}</p>
          ) : null}
        </div>

        <p className="text-sm text-slate-400">
          The lecturer removed you from this live session. You can return to your classes, or try
          rejoining if the class is still in progress.
        </p>

        <Button type="button" onClick={onBack} className="w-full sm:w-auto">
          Back to Course Classes
        </Button>
      </div>
    </main>
  );
}
