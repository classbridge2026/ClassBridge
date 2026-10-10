"use client";

import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useState } from "react";

export type ScreenShareState =
  | "idle"
  | "starting"
  | "sharing"
  | "stopping"
  | "unsupported"
  | "error";

function isPermissionDenied(err: unknown): boolean {
  if (!(err instanceof DOMException) && !(err instanceof Error)) return false;
  const name = "name" in err ? err.name : "";
  return name === "NotAllowedError" || name === "PermissionDeniedError" || name === "AbortError";
}

export function useScreenShare() {
  const room = useRoomContext();
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const [busy, setBusy] = useState<"start" | "stop" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getDisplayMedia);

  // Keep UI in sync when the browser chrome stops the share (track ended).
  useEffect(() => {
    const onLocalTrackUnpublished = () => {
      setBusy(null);
    };

    room.on(RoomEvent.LocalTrackUnpublished, onLocalTrackUnpublished);

    const pub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
    const mediaTrack = pub?.track?.mediaStreamTrack;
    const onEnded = () => {
      setBusy(null);
      setError(null);
      if (localParticipant.isScreenShareEnabled) {
        void localParticipant.setScreenShareEnabled(false).catch(() => undefined);
      }
    };
    mediaTrack?.addEventListener("ended", onEnded);

    return () => {
      room.off(RoomEvent.LocalTrackUnpublished, onLocalTrackUnpublished);
      mediaTrack?.removeEventListener("ended", onEnded);
    };
  }, [localParticipant, room, isScreenShareEnabled]);

  const startSharing = useCallback(async () => {
    if (!supported) {
      setError("Screen sharing is not supported in this browser.");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Screen sharing requires HTTPS or localhost.");
      return;
    }
    if (busy) return;
    setBusy("start");
    setError(null);
    try {
      // Prefer a reliable capture path. System/tab audio often fails on
      // Windows/Firefox and can abort the whole share request.
      try {
        await localParticipant.setScreenShareEnabled(true, {
          audio: false,
          contentHint: "detail",
          selfBrowserSurface: "include",
        });
      } catch (firstErr) {
        if (isPermissionDenied(firstErr)) throw firstErr;
        await localParticipant.setScreenShareEnabled(true, {
          audio: false,
          contentHint: "detail",
        });
      }
    } catch (err) {
      if (isPermissionDenied(err)) {
        // User cancelled the picker — not an error state for the classroom.
        setError(null);
      } else {
        console.warn("Screen share failed:", err);
        setError("We couldn't start screen sharing. Please try again.");
      }
    } finally {
      setBusy(null);
    }
  }, [busy, localParticipant, supported]);

  const stopSharing = useCallback(async () => {
    if (busy) return;
    setBusy("stop");
    setError(null);
    try {
      await localParticipant.setScreenShareEnabled(false);
    } catch {
      setError("We couldn't stop screen sharing. Please try again.");
    } finally {
      setBusy(null);
    }
  }, [busy, localParticipant]);

  const toggleSharing = useCallback(async () => {
    if (isScreenShareEnabled) {
      await stopSharing();
    } else {
      await startSharing();
    }
  }, [isScreenShareEnabled, startSharing, stopSharing]);

  const state: ScreenShareState = !supported
    ? "unsupported"
    : busy === "start"
      ? "starting"
      : busy === "stop"
        ? "stopping"
        : error
          ? "error"
          : isScreenShareEnabled
            ? "sharing"
            : "idle";

  return {
    state,
    isSharing: isScreenShareEnabled,
    error,
    clearError: () => setError(null),
    startSharing,
    stopSharing,
    toggleSharing,
    supported,
  };
}
