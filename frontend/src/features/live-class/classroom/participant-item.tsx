"use client";

import {
  useConnectionQualityIndicator,
  useIsSpeaking,
} from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { ConnectionQuality, Track } from "livekit-client";
import { Hand, Loader2, Mic, MicOff, Signal, UserX, Video, VideoOff } from "lucide-react";
import { isHostParticipant } from "@/features/live-class/lib/participant-meta";
import { parseParticipantMeta } from "@/features/live-class/lib/realtime-events";
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
      return "Excellent";
    case ConnectionQuality.Good:
      return "Good";
    case ConnectionQuality.Poor:
      return "Poor";
    case ConnectionQuality.Lost:
      return "Lost";
    default:
      return "Unknown";
  }
}

type ParticipantItemProps = {
  participant: Participant;
  canModerate?: boolean;
  moderating?: boolean;
  onMuteMic?: (identity: string) => void;
  onRemove?: (identity: string, name: string) => void;
};

export function ParticipantItem({
  participant,
  canModerate = false,
  moderating = false,
  onMuteMic,
  onRemove,
}: ParticipantItemProps) {
  const speaking = useIsSpeaking(participant);
  const { quality } = useConnectionQualityIndicator({ participant });
  const name = participant.name || participant.identity || "Participant";
  const isHost = isHostParticipant(participant);
  const handRaised = Boolean(parseParticipantMeta(participant.metadata).handRaised);
  const micPub = participant.getTrackPublication(Track.Source.Microphone);
  const camPub = participant.getTrackPublication(Track.Source.Camera);
  const micOn = Boolean(micPub?.track && !micPub.isMuted);
  const camOn = Boolean(camPub?.track && !camPub.isMuted);

  const showActions =
    canModerate && !participant.isLocal && !isHost && Boolean(onMuteMic && onRemove);

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
        speaking ? "bg-blue-600/10 ring-1 ring-blue-500/40" : "hover:bg-slate-800/60",
      )}
    >
      <div
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200",
          speaking && "ring-2 ring-blue-500",
        )}
        aria-hidden
      >
        {initials(name) || "?"}
        {speaking ? (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-slate-900" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">
          {name}
          {participant.isLocal ? " (You)" : ""}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {isHost ? "Lecturer" : "Student"}
          <span className="mx-1 text-slate-700">·</span>
          <span className="normal-case tracking-normal text-slate-500">
            {qualityLabel(quality)}
          </span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1" aria-label="Media status">
        {handRaised ? (
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-amber-300"
            title="Hand raised"
            aria-label="Hand raised"
          >
            <Hand className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : null}
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md",
            quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost
              ? "text-amber-300"
              : "text-slate-400",
          )}
          title={`Connection: ${qualityLabel(quality)}`}
          aria-label={`Connection ${qualityLabel(quality)}`}
        >
          <Signal className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md",
            micOn ? "text-slate-200" : "text-red-400",
          )}
          title={micOn ? "Microphone on" : "Microphone muted"}
          aria-label={micOn ? "Microphone on" : "Microphone muted"}
        >
          {micOn ? <Mic className="h-3.5 w-3.5" aria-hidden /> : <MicOff className="h-3.5 w-3.5" aria-hidden />}
        </span>
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md",
            camOn ? "text-slate-200" : "text-slate-500",
          )}
          title={camOn ? "Camera on" : "Camera off"}
          aria-label={camOn ? "Camera on" : "Camera off"}
        >
          {camOn ? <Video className="h-3.5 w-3.5" aria-hidden /> : <VideoOff className="h-3.5 w-3.5" aria-hidden />}
        </span>

        {showActions ? (
          <div className="ml-1 flex items-center gap-0.5 border-l border-slate-800 pl-1.5">
            {moderating ? (
              <span className="inline-flex h-7 w-7 items-center justify-center text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              </span>
            ) : (
              <>
                <button
                  type="button"
                  disabled={!micOn}
                  onClick={() => onMuteMic?.(participant.identity)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:bg-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Mute microphone"
                  aria-label={`Mute microphone for ${name}`}
                >
                  <MicOff className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove?.(participant.identity, name)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-300 hover:bg-red-950/60 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  title="Remove from class"
                  aria-label={`Remove ${name} from class`}
                >
                  <UserX className="h-3.5 w-3.5" aria-hidden />
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </li>
  );
}
