"use client";

import { Button } from "@/components/ui/button";
import type { LiveClassSessionPayload } from "@/features/live-class/types";

type ClassEndedScreenProps = {
  session: LiveClassSessionPayload;
  onBack: () => void;
};

export function ClassEndedScreen({ session, onBack }: ClassEndedScreenProps) {
  const isStudent = session.role === "student";
  const isHost = session.role === "host";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1220] px-6 text-slate-100">
      <div className="w-full max-w-md space-y-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ClassBridge</p>
        <h1 className="text-2xl font-semibold">Class Ended</h1>
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
          {isStudent
            ? "Thanks for attending. You can return to your classes, or rejoin if the lecturer starts another session."
            : isHost
              ? "The live session is closed. You can review attendance and manage recordings from your classes page."
              : "This live session has ended."}
        </p>

        <Button type="button" onClick={onBack} className="w-full sm:w-auto">
          {isStudent ? "Back to Course Classes" : "Back to Classes"}
        </Button>
      </div>
    </main>
  );
}
