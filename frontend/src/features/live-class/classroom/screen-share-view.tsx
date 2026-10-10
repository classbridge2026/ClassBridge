"use client";

import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { Monitor, MonitorOff } from "lucide-react";
import { VideoTile } from "@/features/live-class/classroom/video-tile";
import { useScreenShare } from "@/features/live-class/hooks/use-screen-share";
import { isHostParticipant } from "@/features/live-class/lib/participant-meta";

type ScreenShareViewProps = {
  trackRef: TrackReferenceOrPlaceholder;
  className?: string;
};

/** Main-stage presentation for an active screen share (contain fit + fullscreen). */
export function ScreenShareView({ trackRef, className }: ScreenShareViewProps) {
  const name = trackRef.participant.name || trackRef.participant.identity || "Participant";
  const share = useScreenShare();
  const isLocalShare = trackRef.participant.isLocal;

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-0.5 text-[11px] font-medium text-slate-400">
        <span className="inline-flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-blue-300" aria-hidden />
          {isLocalShare
            ? "You are sharing your screen"
            : `${name} is sharing their screen`}
        </span>
        {isLocalShare ? (
          <button
            type="button"
            onClick={() => void share.stopSharing()}
            disabled={share.state === "stopping"}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600/90 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
          >
            <MonitorOff className="h-3.5 w-3.5" aria-hidden />
            {share.state === "stopping" ? "Stopping…" : "Stop Sharing"}
          </button>
        ) : null}
      </div>
      <VideoTile
        trackRef={trackRef}
        isMain
        isHost={isHostParticipant(trackRef.participant)}
        fit="contain"
        allowFullscreen
        className="min-h-0 flex-1 bg-black"
      />
    </div>
  );
}
