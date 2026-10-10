"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Track, type Room } from "livekit-client";

export type RecordingState = "idle" | "recording" | "stopping" | "error";

function collectLocalMediaStream(room: Room): MediaStream | null {
  const stream = new MediaStream();
  const pubs = [
    ...room.localParticipant.trackPublications.values(),
  ];

  const screen = pubs.find(
    (p) => p.source === Track.Source.ScreenShare && p.track && !p.isMuted,
  );
  const camera = pubs.find(
    (p) => p.source === Track.Source.Camera && p.track && !p.isMuted,
  );
  const mic = pubs.find(
    (p) => p.source === Track.Source.Microphone && p.track && !p.isMuted,
  );

  const videoPub = screen ?? camera;
  if (videoPub?.track?.mediaStreamTrack) {
    stream.addTrack(videoPub.track.mediaStreamTrack);
  }
  if (mic?.track?.mediaStreamTrack) {
    stream.addTrack(mic.track.mediaStreamTrack);
  }

  if (stream.getTracks().length === 0) return null;
  return stream;
}

function pickMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return undefined;
}

export function useClassRecording({
  room,
  sessionId,
  sessionTitle,
  enabled,
}: {
  room: Room | null;
  sessionId: string;
  sessionTitle: string;
  enabled: boolean;
}) {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => {
      // Do not stop LiveKit tracks — only stop cloned tracks if we cloned.
    });
    streamRef.current = null;
  }, []);

  const stopAndUpload = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setState("idle");
      return;
    }

    setState("stopping");
    setError(null);

    const blob: Blob = await new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const mime = recorder.mimeType || "video/webm";
        resolve(new Blob(chunksRef.current, { type: mime }));
      };
      recorder.onerror = () => reject(new Error("Recording failed."));
      try {
        recorder.stop();
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Recording failed."));
      }
    });

    recorderRef.current = null;
    chunksRef.current = [];
    cleanupStream();

    const durationSeconds = startedAt
      ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      : 0;

    try {
      const form = new FormData();
      form.append("sessionId", sessionId);
      form.append("title", `${sessionTitle} — Recording`);
      form.append("durationSeconds", String(durationSeconds));
      form.append(
        "file",
        blob,
        `recording-${sessionId}-${Date.now()}.webm`,
      );

      const res = await fetch(`/api/v1/classes/${sessionId}/recording`, {
        method: "POST",
        body: form,
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error || "Failed to save recording.");
      }
      setState("idle");
      setStartedAt(null);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to save recording.");
    }
  }, [cleanupStream, sessionId, sessionTitle, startedAt]);

  const start = useCallback(async () => {
    if (!enabled || !room) return;
    setError(null);

    if (typeof MediaRecorder === "undefined") {
      setState("error");
      setError("Recording is not supported in this browser.");
      return;
    }

    const media = collectLocalMediaStream(room);
    if (!media) {
      setState("error");
      setError("Turn on your camera or microphone before recording.");
      return;
    }

    try {
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        media,
        mimeType ? { mimeType, videoBitsPerSecond: 2_500_000 } : undefined,
      );
      chunksRef.current = [];
      streamRef.current = media;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start(2000);
      recorderRef.current = recorder;
      setStartedAt(Date.now());
      setState("recording");
    } catch (err) {
      cleanupStream();
      setState("error");
      setError(err instanceof Error ? err.message : "Could not start recording.");
    }
  }, [cleanupStream, enabled, room]);

  const stop = useCallback(async () => {
    if (state !== "recording") return;
    await stopAndUpload();
  }, [state, stopAndUpload]);

  const toggle = useCallback(async () => {
    if (state === "recording") {
      await stop();
    } else if (state === "idle" || state === "error") {
      await start();
    }
  }, [start, state, stop]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // ignore on unmount
        }
      }
      recorderRef.current = null;
      chunksRef.current = [];
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
    state,
    error,
    isRecording: state === "recording",
    isBusy: state === "stopping",
    start,
    stop,
    toggle,
    clearError: () => setError(null),
  };
}
