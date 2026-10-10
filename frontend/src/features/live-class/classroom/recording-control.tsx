"use client";

import { Circle, Square } from "lucide-react";
import { ControlButton } from "@/features/live-class/classroom/control-button";
import type { RecordingState } from "@/features/live-class/hooks/use-class-recording";

export function RecordingControl({
  state,
  onToggle,
}: {
  state: RecordingState;
  onToggle: () => void;
}) {
  const recording = state === "recording";
  const busy = state === "stopping";

  return (
    <ControlButton
      label={
        busy
          ? "Saving recording"
          : recording
            ? "Stop recording"
            : "Start recording"
      }
      active={recording}
      danger={recording}
      disabled={busy}
      onClick={onToggle}
    >
      {recording ? (
        <Square className="h-5 w-5 fill-current" aria-hidden />
      ) : (
        <Circle className="h-5 w-5 text-red-400" aria-hidden />
      )}
      <span>{busy ? "Saving…" : recording ? "Stop Rec" : "Record"}</span>
    </ControlButton>
  );
}
