"use client";

import {
  RoomAudioRenderer,
  RoomContext,
  useConnectionState,
  useParticipants,
} from "@livekit/components-react";
import type { Room } from "livekit-client";
import { ConnectionState } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import { ChatPanel } from "@/features/live-class/classroom/chat-panel";
import { EndClassDialog } from "@/features/live-class/classroom/end-class-dialog";
import { LecturerControls } from "@/features/live-class/classroom/lecturer-controls";
import { LiveClassHeader } from "@/features/live-class/classroom/live-class-header";
import { ParticipantPanel } from "@/features/live-class/classroom/participant-panel";
import { RaisedHandsQueue } from "@/features/live-class/classroom/raised-hands-queue";
import { RemoveParticipantDialog } from "@/features/live-class/classroom/remove-participant-dialog";
import { ScreenShareBanner } from "@/features/live-class/classroom/screen-share-banner";
import { StudentControls } from "@/features/live-class/classroom/student-controls";
import { VideoGrid } from "@/features/live-class/classroom/video-grid";
import { ConnectionStatus } from "@/features/live-class/classroom/connection-status";
import { useClassChat } from "@/features/live-class/hooks/use-class-chat";
import { useClassRecording } from "@/features/live-class/hooks/use-class-recording";
import { useParticipantModeration } from "@/features/live-class/hooks/use-participant-moderation";
import { useRaiseHand } from "@/features/live-class/hooks/use-raise-hand";
import type { LiveClassSessionPayload } from "@/features/live-class/types";

type LiveClassRoomProps = {
  room: Room;
  session: LiveClassSessionPayload;
  startedAt: string | null;
  onLeave: () => void;
  onClassEnded: () => void;
};

function LiveClassRoomInner({
  room,
  session,
  startedAt,
  onLeave,
  onClassEnded,
}: LiveClassRoomProps) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const [endOpen, setEndOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ identity: string; name: string } | null>(
    null,
  );
  const [removing, setRemoving] = useState(false);

  const isHost = session.role === "host";
  const chat = useClassChat({ sessionId: session.id });
  const raise = useRaiseHand({ isHost, viewerName: session.viewerName });
  const moderation = useParticipantModeration({ sessionId: session.id, isHost });
  const recording = useClassRecording({
    room,
    sessionId: session.id,
    sessionTitle: session.title,
    enabled: isHost,
  });

  const { removeParticipant, muteMicrophone, clearError, busyIdentity, toast, error } =
    moderation;

  const handleConfirmRemove = useCallback(async () => {
    if (!removeTarget) return;
    setRemoving(true);
    const ok = await removeParticipant(removeTarget.identity);
    setRemoving(false);
    if (ok) setRemoveTarget(null);
  }, [removeParticipant, removeTarget]);

  const panelProps = {
    canModerate: isHost,
    busyIdentity,
    onMuteMic: (identity: string) => {
      void muteMicrophone(identity);
    },
    onRemove: (identity: string, name: string) => {
      clearError();
      setRemoveTarget({ identity, name });
    },
  };

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const handleEndClass = useCallback(async () => {
    setEnding(true);
    setEndError(null);
    try {
      if (recording.isRecording) {
        await recording.stop();
      }
      const res = await fetch(`/api/v1/classes/${session.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "We couldn't end this class.");
      }
      setEndOpen(false);
      onClassEnded();
    } catch (error) {
      setEndError(error instanceof Error ? error.message : "We couldn't end this class.");
    } finally {
      setEnding(false);
    }
  }, [onClassEnded, recording, session.id]);

  const sidebarOpen = participantsOpen || chatOpen;

  return (
    <div className="flex h-dvh min-h-screen flex-col bg-[#0B1220] text-slate-100">
      <LiveClassHeader
        session={session}
        connectionState={connectionState}
        participantCount={participants.length}
        startedAt={startedAt}
        isRecording={recording.isRecording}
      />

      {connectionState === ConnectionState.Reconnecting && (
        <div
          className="border-b border-amber-900/50 bg-amber-950/40 px-4 py-2 text-center text-xs text-amber-200"
          role="status"
        >
          Trying to reconnect…
        </div>
      )}

      {isHost && recording.error ? (
        <div
          className="border-b border-red-900/40 bg-red-950/40 px-4 py-2 text-center text-xs text-red-200"
          role="alert"
        >
          {recording.error}
        </div>
      ) : null}

      {isHost ? <ScreenShareBanner /> : null}

      {isHost && raise.raisedHands.length > 0 ? (
        <RaisedHandsQueue
          hands={raise.raisedHands}
          onAcknowledge={(identity) => void raise.acknowledgeHand(identity)}
        />
      ) : null}

      {raise.toast || toast ? (
        <div
          className="border-b border-blue-900/40 bg-blue-950/40 px-4 py-2 text-center text-xs text-blue-100"
          role="status"
          aria-live="polite"
        >
          {raise.toast || toast}
        </div>
      ) : null}

      {error && !removeTarget ? (
        <div
          className="border-b border-red-900/40 bg-red-950/40 px-4 py-2 text-center text-xs text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 px-3 py-1.5 md:hidden">
        <ConnectionStatus state={connectionState} />
        <span className="text-[11px] text-slate-400">{participants.length} in class</span>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <VideoGrid viewerRole={session.role} lecturerName={session.lecturerName} />
          <RoomAudioRenderer />
        </main>

        {sidebarOpen && isDesktop ? (
          <div className="hidden w-80 shrink-0 flex-col md:flex lg:w-96">
            {participantsOpen ? (
              <div className={chatOpen ? "min-h-0 flex-1 border-b border-slate-800" : "min-h-0 flex-1"}>
                <ParticipantPanel
                  open
                  variant="sidebar"
                  onClose={() => setParticipantsOpen(false)}
                  {...panelProps}
                />
              </div>
            ) : null}
            {chatOpen ? (
              <div className={participantsOpen ? "min-h-0 flex-[1.2]" : "min-h-0 flex-1"}>
                <ChatPanel
                  open
                  chat={chat}
                  variant="sidebar"
                  onClose={() => setChatOpen(false)}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {participantsOpen && !isDesktop ? (
          <ParticipantPanel
            open
            variant="sheet"
            onClose={() => setParticipantsOpen(false)}
            {...panelProps}
          />
        ) : null}

        {chatOpen && !isDesktop ? (
          <ChatPanel
            open
            chat={chat}
            variant="sheet"
            onClose={() => setChatOpen(false)}
          />
        ) : null}
      </div>

      {isHost ? (
        <LecturerControls
          onLeave={onLeave}
          onEndClass={() => {
            setEndError(null);
            setEndOpen(true);
          }}
          participantsOpen={participantsOpen}
          participantCount={participants.length}
          onToggleParticipants={() => setParticipantsOpen((v) => !v)}
          chatOpen={chatOpen}
          chatUnread={chat.unread}
          onToggleChat={() => setChatOpen((v) => !v)}
          raisedCount={raise.raisedCount}
          recordingState={recording.state}
          onToggleRecording={() => void recording.toggle()}
        />
      ) : (
        <StudentControls
          onLeave={onLeave}
          participantsOpen={participantsOpen}
          participantCount={participants.length}
          onToggleParticipants={() => setParticipantsOpen((v) => !v)}
          chatOpen={chatOpen}
          chatUnread={chat.unread}
          onToggleChat={() => setChatOpen((v) => !v)}
          raise={raise}
        />
      )}

      {isHost ? (
        <EndClassDialog
          open={endOpen}
          ending={ending}
          error={endError}
          onCancel={() => {
            if (!ending) setEndOpen(false);
          }}
          onConfirm={() => void handleEndClass()}
        />
      ) : null}

      {isHost ? (
        <RemoveParticipantDialog
          open={Boolean(removeTarget)}
          participantName={removeTarget?.name ?? "participant"}
          removing={removing}
          error={error}
          onCancel={() => {
            if (!removing) {
              setRemoveTarget(null);
              clearError();
            }
          }}
          onConfirm={() => void handleConfirmRemove()}
        />
      ) : null}
    </div>
  );
}

export function LiveClassRoom({ room, session, startedAt, onLeave, onClassEnded }: LiveClassRoomProps) {
  return (
    <RoomContext.Provider value={room}>
      <LiveClassRoomInner
        room={room}
        session={session}
        startedAt={startedAt}
        onLeave={onLeave}
        onClassEnded={onClassEnded}
      />
    </RoomContext.Provider>
  );
}
