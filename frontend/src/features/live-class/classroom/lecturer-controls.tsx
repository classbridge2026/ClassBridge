"use client";

import { Hand, LogOut, MessageSquare, PhoneOff, Users } from "lucide-react";
import { useState } from "react";
import { ControlButton } from "@/features/live-class/classroom/control-button";
import { LeaveClassDialog } from "@/features/live-class/classroom/leave-class-dialog";
import { MediaControls } from "@/features/live-class/classroom/media-controls";
import { RecordingControl } from "@/features/live-class/classroom/recording-control";
import { ScreenShareControl } from "@/features/live-class/classroom/screen-share-control";
import type { RecordingState } from "@/features/live-class/hooks/use-class-recording";

type LecturerControlsProps = {
  onLeave: () => void;
  onEndClass: () => void;
  participantsOpen: boolean;
  participantCount: number;
  onToggleParticipants: () => void;
  chatOpen: boolean;
  chatUnread: number;
  onToggleChat: () => void;
  raisedCount: number;
  recordingState: RecordingState;
  onToggleRecording: () => void;
};

export function LecturerControls({
  onLeave,
  onEndClass,
  participantsOpen,
  participantCount,
  onToggleParticipants,
  chatOpen,
  chatUnread,
  onToggleChat,
  raisedCount,
  recordingState,
  onToggleRecording,
}: LecturerControlsProps) {
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  return (
    <>
      <footer className="shrink-0 border-t border-slate-800/80 bg-[#0B1220]/95 px-3 py-3 sm:px-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2">
          <MediaControls />
          <ScreenShareControl />
          <RecordingControl state={recordingState} onToggle={onToggleRecording} />

          <ControlButton
            label={
              participantsOpen
                ? "Hide participants"
                : `Show participants (${participantCount})`
            }
            active={participantsOpen}
            onClick={onToggleParticipants}
          >
            <Users className="h-5 w-5" aria-hidden />
            <span>People</span>
          </ControlButton>

          <ControlButton
            label={chatOpen ? "Hide chat" : chatUnread > 0 ? `Show chat, ${chatUnread} new` : "Show chat"}
            active={chatOpen}
            onClick={onToggleChat}
          >
            <span className="relative">
              <MessageSquare className="h-5 w-5" aria-hidden />
              {chatUnread > 0 && !chatOpen ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-0.5 text-[9px] font-bold text-white">
                  {chatUnread > 9 ? "9+" : chatUnread}
                </span>
              ) : null}
            </span>
            <span>Chat</span>
          </ControlButton>

          {raisedCount > 0 ? (
            <span
              className="inline-flex items-center gap-1 rounded-xl bg-amber-600/20 px-2.5 py-2 text-[10px] font-semibold text-amber-200"
              aria-label={`${raisedCount} raised hands`}
            >
              <Hand className="h-4 w-4" aria-hidden />
              {raisedCount}
            </span>
          ) : null}

          <ControlButton label="Leave without ending class" onClick={() => setLeaveOpen(true)}>
            <LogOut className="h-5 w-5" aria-hidden />
            <span>Leave</span>
          </ControlButton>

          <ControlButton label="End class for everyone" danger onClick={onEndClass}>
            <PhoneOff className="h-5 w-5" aria-hidden />
            <span>End Class</span>
          </ControlButton>
        </div>
      </footer>

      <LeaveClassDialog
        open={leaveOpen}
        leaving={leaving}
        onCancel={() => {
          if (!leaving) setLeaveOpen(false);
        }}
        onConfirm={() => {
          setLeaving(true);
          onLeave();
        }}
      />
    </>
  );
}
