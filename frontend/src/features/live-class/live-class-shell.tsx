"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DisconnectReason, Room, RoomEvent } from "livekit-client";
import { Loader2 } from "lucide-react";
import { ClassEndedScreen } from "@/features/live-class/classroom/class-ended-screen";
import { LiveClassRoom } from "@/features/live-class/classroom/live-class-room";
import { RemovedFromClassScreen } from "@/features/live-class/classroom/removed-from-class-screen";
import { PreJoinScreen } from "@/features/live-class/pre-join/pre-join-screen";
import type {
  LiveClassPhase,
  LiveClassSessionPayload,
  PreJoinSettings,
} from "@/features/live-class/types";

type LiveClassShellProps = {
  session: LiveClassSessionPayload;
};

type TokenResponse = {
  token: string;
  serverUrl: string;
  roomName: string;
  identity: string;
  participantName: string;
  isHost: boolean;
  error?: string;
};

export function LiveClassShell({ session }: LiveClassShellProps) {
  const router = useRouter();
  const roomRef = useRef<Room | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [phase, setPhase] = useState<LiveClassPhase>(
    session.status === "COMPLETED" || session.status === "CANCELLED" ? "ended" : "prejoin",
  );
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [connectionLabel, setConnectionLabel] = useState("Connecting…");
  const [startedAt, setStartedAt] = useState<string | null>(session.startedAt);

  const disconnectRoom = useCallback(async () => {
    const active = roomRef.current;
    roomRef.current = null;
    setRoom(null);
    if (active) {
      active.removeAllListeners();
      await active.disconnect();
    }
  }, []);

  useEffect(() => {
    return () => {
      void disconnectRoom();
    };
  }, [disconnectRoom]);

  const markAttendance = useCallback(
    async (action: "join" | "leave") => {
      if (session.role !== "student") return;
      try {
        await fetch("/api/v1/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.id, action }),
        });
      } catch {
        // Attendance failure should not block media join/leave.
      }
    },
    [session.id, session.role],
  );

  const handleJoin = useCallback(
    async (settings: PreJoinSettings) => {
      setJoining(true);
      setJoinError(null);
      setPhase("connecting");
      setConnectionLabel("Preparing classroom…");

      try {
        if (session.canStart && session.status === "SCHEDULED") {
          setConnectionLabel("Starting class…");
          const statusRes = await fetch(`/api/v1/classes/${session.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "LIVE" }),
          });
          const statusBody = (await statusRes.json().catch(() => ({}))) as {
            error?: string;
            session?: { startedAt?: string | Date | null };
          };
          if (!statusRes.ok) {
            throw new Error(statusBody.error || "We couldn't start this class.");
          }
          const serverStarted = statusBody.session?.startedAt;
          setStartedAt(
            serverStarted
              ? typeof serverStarted === "string"
                ? serverStarted
                : new Date(serverStarted).toISOString()
              : new Date().toISOString(),
          );
        }

        setConnectionLabel("Requesting secure access…");
        const tokenRes = await fetch("/api/v1/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.id }),
        });
        const tokenBody = (await tokenRes.json()) as TokenResponse;
        if (!tokenRes.ok || !tokenBody.token || !tokenBody.serverUrl) {
          throw new Error(tokenBody.error || "We couldn't connect you to the live classroom.");
        }

        setConnectionLabel("Connecting to LiveKit…");
        await disconnectRoom();

        const nextRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            deviceId: settings.audioDeviceId,
            echoCancellation: true,
            noiseSuppression: true,
          },
          videoCaptureDefaults: {
            deviceId: settings.videoDeviceId,
            resolution: { width: 1280, height: 720 },
          },
        });

        nextRoom.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
          roomRef.current = null;
          setRoom(null);
          if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
            void markAttendance("leave");
            setPhase((current) => (current === "live" ? "removed" : current));
            return;
          }
          setPhase((current) => (current === "live" ? "ended" : current));
        });

        roomRef.current = nextRoom;
        await nextRoom.connect(tokenBody.serverUrl, tokenBody.token);

        if (settings.microphoneEnabled) {
          await nextRoom.localParticipant.setMicrophoneEnabled(true);
        }
        if (settings.cameraEnabled) {
          await nextRoom.localParticipant.setCameraEnabled(true);
        }

        if (settings.audioOutputDeviceId) {
          try {
            await nextRoom.switchActiveDevice("audiooutput", settings.audioOutputDeviceId);
          } catch {
            // Some browsers do not support sink selection.
          }
        }

        await markAttendance("join");
        setRoom(nextRoom);
        setPhase("live");
      } catch (error) {
        await disconnectRoom();
        const message =
          error instanceof Error
            ? error.message
            : "We couldn't connect you to the live classroom.";
        setJoinError(message);
        setPhase("prejoin");
      } finally {
        setJoining(false);
      }
    },
    [disconnectRoom, markAttendance, session.canStart, session.id, session.status],
  );

  const handleLeave = useCallback(async () => {
    await markAttendance("leave");
    await disconnectRoom();
    router.push(session.backHref);
  }, [disconnectRoom, markAttendance, router, session.backHref]);

  const handleClassEnded = useCallback(async () => {
    await markAttendance("leave");
    await disconnectRoom();
    setPhase("ended");
  }, [disconnectRoom, markAttendance]);

  if (phase === "prejoin") {
    return (
      <PreJoinScreen
        session={session}
        joining={joining}
        joinError={joinError}
        onJoin={(settings) => {
          void handleJoin(settings);
        }}
      />
    );
  }

  if (phase === "connecting") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1220] px-6 text-slate-100">
        <div className="max-w-md space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-400" aria-hidden />
          <h1 className="text-xl font-semibold">Connecting</h1>
          <p className="text-sm text-slate-400" role="status" aria-live="polite">
            {connectionLabel}
          </p>
        </div>
      </main>
    );
  }

  if (phase === "removed") {
    return (
      <RemovedFromClassScreen
        session={session}
        onBack={() => router.push(session.backHref)}
      />
    );
  }

  if (phase === "ended") {
    return (
      <ClassEndedScreen
        session={session}
        onBack={() => router.push(session.backHref)}
      />
    );
  }

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1220] px-6 text-slate-100">
        <div className="max-w-md space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-400" aria-hidden />
          <p className="text-sm text-slate-400">Preparing classroom…</p>
        </div>
      </main>
    );
  }

  return (
    <LiveClassRoom
      room={room}
      session={session}
      startedAt={startedAt}
      onLeave={() => {
        void handleLeave();
      }}
      onClassEnded={() => {
        void handleClassEnded();
      }}
    />
  );
}
