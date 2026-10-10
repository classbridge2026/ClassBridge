"use client";

import { LogOut, MessageSquare, Users } from "lucide-react";
import { useState } from "react";
import { ControlButton } from "@/features/live-class/classroom/control-button";
import { LeaveClassDialog } from "@/features/live-class/classroom/leave-class-dialog";
import { MediaControls } from "@/features/live-class/classroom/media-controls";
import { RaiseHandControl } from "@/features/live-class/classroom/raise-hand-control";
import type { useRaiseHand } from "@/features/live-class/hooks/use-raise-hand";

type RaiseApi = ReturnType<typeof useRaiseHand>;

type StudentControlsProps = {
  onLeave: () => void;
  participantsOpen: boolean;
  participantCount: number;
  onToggleParticipants: () => void;
  chatOpen: boolean;
  chatUnread: number;
  onToggleChat: () => void;
  raise: RaiseApi;
};

export function StudentControls({
  onLeave,
  participantsOpen,
  participantCount,
  onToggleParticipants,
  chatOpen,
  chatUnread,
  onToggleChat,
  raise,
}: StudentControlsProps) {
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  return (
    <>
      <footer className="shrink-0 border-t border-slate-800/80 bg-[#0B1220]/95 px-3 py-3 sm:px-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2">
          <MediaControls />
          <RaiseHandControl raise={raise} />

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

          <ControlButton label="Leave class" onClick={() => setLeaveOpen(true)}>
            <LogOut className="h-5 w-5" aria-hidden />
            <span>Leave</span>
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
