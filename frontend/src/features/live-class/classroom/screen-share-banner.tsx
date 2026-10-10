"use client";

import { MonitorOff } from "lucide-react";
import { useScreenShare } from "@/features/live-class/hooks/use-screen-share";

/** Persistent host banner while the local participant is sharing. */
export function ScreenShareBanner() {
  const share = useScreenShare();
  if (!share.isSharing) return null;

  return (
    <div
      className="flex items-center justify-center gap-3 border-b border-blue-900/40 bg-blue-950/50 px-4 py-2 text-xs text-blue-100"
      role="status"
      aria-live="polite"
    >
      <span className="font-medium">You are sharing your screen.</span>
      <button
        type="button"
        onClick={() => void share.stopSharing()}
        disabled={share.state === "stopping"}
        className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
      >
        <MonitorOff className="h-3.5 w-3.5" aria-hidden />
        {share.state === "stopping" ? "Stopping…" : "Stop Sharing"}
      </button>
    </div>
  );
}
