"use client";

import {
  VideoTrack,
  isTrackReference,
  useConnectionQualityIndicator,
  useIsSpeaking,
} from "@livekit/components-react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { ConnectionQuality, Track } from "livekit-client";
import { Maximize2, Mic, MicOff, Minimize2, Signal, VideoOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function qualityLabel(quality: ConnectionQuality): string {
  switch (quality) {
    case ConnectionQuality.Excellent:
      return "Excellent connection";
    case ConnectionQuality.Good:
      return "Good connection";
    case ConnectionQuality.Poor:
      return "Poor connection";
    case ConnectionQuality.Lost:
      return "Connection lost";
    default:
      return "Checking connection";
  }
}

function qualityTone(quality: ConnectionQuality): string {
  switch (quality) {
    case ConnectionQuality.Excellent:
    case ConnectionQuality.Good:
      return "text-emerald-400";
    case ConnectionQuality.Poor:
      return "text-amber-300";
    case ConnectionQuality.Lost:
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

type VideoTileProps = {
  trackRef: TrackReferenceOrPlaceholder;
  className?: string;
  isMain?: boolean;
  isHost?: boolean;
  /** Use contain fit for screen share / slides */
  fit?: "cover" | "contain";
  allowFullscreen?: boolean;
};

export function VideoTile({
  trackRef,
  className,
  isMain,
  isHost,
  fit = "cover",
  allowFullscreen = false,
}: VideoTileProps) {
  const participant = trackRef.participant;
  const speaking = useIsSpeaking(participant);
  const { quality } = useConnectionQualityIndicator({ participant });
  const containerRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const name = participant.name || participant.identity || "Participant";
  const micPub = participant.getTrackPublication(Track.Source.Microphone);
  const camPub = participant.getTrackPublication(Track.Source.Camera);
  const micOn = Boolean(micPub?.track && !micPub.isMuted);
  const cameraOn =
    trackRef.source === Track.Source.ScreenShare
      ? true
      : Boolean(camPub?.track && !camPub.isMuted);
  const isScreen = trackRef.source === Track.Source.ScreenShare;
  // Screen shares may not have a local MediaStreamTrack until subscribed.
  const hasVideo =
    isTrackReference(trackRef) &&
    Boolean(trackRef.publication) &&
    (isScreen || !trackRef.publication?.isMuted);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Browser may deny fullscreen without gesture / support.
    }
  }, []);

  return (
    <article
      ref={containerRef}
      className={cn(
        "group relative flex overflow-hidden rounded-xl bg-slate-950 ring-1 ring-slate-800 transition-[box-shadow,ring] duration-200",
        speaking && !isScreen && "ring-2 ring-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]",
        isMain ? "min-h-[220px] sm:min-h-[320px]" : "min-h-[112px]",
        isFullscreen && "rounded-none",
        className,
      )}
      aria-label={`${name}${isHost ? ", lecturer" : ""}${speaking ? ", speaking" : ""}${isScreen ? ", screen share" : ""}`}
    >
      {hasVideo && isTrackReference(trackRef) ? (
        <VideoTrack
          trackRef={trackRef}
          className={cn(
            "h-full w-full bg-black",
            fit === "contain" ? "object-contain" : "object-cover",
          )}
          manageSubscription
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-slate-900 to-slate-950 px-3">
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-blue-600/20 font-semibold text-blue-200",
              isMain ? "h-20 w-20 text-2xl" : "h-12 w-12 text-sm",
            )}
            aria-hidden
          >
            {initials(name) || "?"}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <VideoOff className="h-3.5 w-3.5" aria-hidden />
            {isScreen ? "Waiting for screen share…" : "Camera Off"}
          </p>
        </div>
      )}

      {speaking && !isScreen ? (
        <span
          className="pointer-events-none absolute left-2 top-2 rounded-md bg-blue-600/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
          aria-hidden
        >
          Speaking
        </span>
      ) : null}

      {allowFullscreen ? (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950/70 text-slate-100 opacity-100 transition-opacity hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" aria-hidden />
          ) : (
            <Maximize2 className="h-4 w-4" aria-hidden />
          )}
        </button>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2.5 pb-2 pt-8">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">
            {name}
            {participant.isLocal ? " (You)" : ""}
          </p>
          {(isHost || isScreen) && (
            <p className="text-[10px] font-medium uppercase tracking-wide text-blue-300">
              {isScreen ? "Screen share" : "Lecturer"}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full", qualityTone(quality))}
            title={qualityLabel(quality)}
            aria-label={qualityLabel(quality)}
          >
            <Signal className="h-3 w-3" aria-hidden />
          </span>
          {!cameraOn && !isScreen ? (
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/90 text-slate-300"
              aria-label="Camera off"
              title="Camera off"
            >
              <VideoOff className="h-3 w-3" aria-hidden />
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full",
              micOn ? "bg-slate-800/90 text-slate-100" : "bg-red-600/90 text-white",
            )}
            aria-label={micOn ? "Microphone on" : "Microphone muted"}
          >
            {micOn ? <Mic className="h-3 w-3" aria-hidden /> : <MicOff className="h-3 w-3" aria-hidden />}
          </span>
        </div>
      </div>
    </article>
  );
}
