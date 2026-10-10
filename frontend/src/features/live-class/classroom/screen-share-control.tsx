"use client";

import { Loader2, Monitor, MonitorOff } from "lucide-react";
import { ControlButton } from "@/features/live-class/classroom/control-button";
import { useScreenShare } from "@/features/live-class/hooks/use-screen-share";

export function ScreenShareControl() {
  const share = useScreenShare();
  const busy = share.state === "starting" || share.state === "stopping";
  const sharing = share.isSharing;
  const unsupported = share.state === "unsupported";

  return (
    <div className="contents">
      <ControlButton
        label={
          unsupported
            ? "Screen sharing not supported"
            : sharing
              ? "Stop sharing screen"
              : "Share screen"
        }
        pressed={sharing || undefined}
        danger={sharing}
        onClick={() => void share.toggleSharing()}
        disabled={busy || unsupported}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : sharing ? (
          <MonitorOff className="h-5 w-5" aria-hidden />
        ) : (
          <Monitor className="h-5 w-5" aria-hidden />
        )}
        <span>{sharing ? "Stop Share" : "Share"}</span>
      </ControlButton>

      {share.error ? (
        <p className="basis-full text-center text-[11px] text-amber-300" role="alert">
          {share.error}
        </p>
      ) : unsupported ? (
        <p className="basis-full text-center text-[11px] text-slate-500" role="status">
          Screen sharing is not supported in this browser.
        </p>
      ) : null}
    </div>
  );
}
