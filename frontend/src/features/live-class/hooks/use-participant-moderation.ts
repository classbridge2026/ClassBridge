"use client";

import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import { decodeLiveClassData } from "@/features/live-class/lib/realtime-events";

type UseParticipantModerationOptions = {
  sessionId: string;
  isHost: boolean;
};

export function useParticipantModeration({
  sessionId,
  isHost,
}: UseParticipantModerationOptions) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [busyIdentity, setBusyIdentity] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearToast = useCallback(() => setToast(null), []);
  const clearError = useCallback(() => setError(null), []);

  const postAction = useCallback(
    async (action: "mute_mic" | "remove", identity: string) => {
      if (!isHost || busyIdentity) return false;
      setBusyIdentity(identity);
      setError(null);
      try {
        const res = await fetch(`/api/v1/classes/${sessionId}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, identity }),
        });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          throw new Error(body.error || "Moderation request failed.");
        }
        if (action === "mute_mic") {
          setToast("Microphone muted.");
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Moderation request failed.");
        return false;
      } finally {
        setBusyIdentity(null);
      }
    },
    [busyIdentity, isHost, sessionId],
  );

  const muteMicrophone = useCallback(
    (identity: string) => postAction("mute_mic", identity),
    [postAction],
  );

  const removeParticipant = useCallback(
    (identity: string) => postAction("remove", identity),
    [postAction],
  );

  useEffect(() => {
    if (isHost) return;

    const onData = (payload: Uint8Array) => {
      const decoded = decodeLiveClassData(payload);
      if (!decoded || decoded.kind !== "force_mute") return;
      if (decoded.targetIdentity !== localParticipant.identity) return;
      if (decoded.source !== "microphone") return;
      setToast("The lecturer muted your microphone.");
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [isHost, localParticipant.identity, room]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  return {
    busyIdentity,
    toast,
    error,
    clearToast,
    clearError,
    muteMicrophone,
    removeParticipant,
  };
}
