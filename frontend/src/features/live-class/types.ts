import type { SessionStatus } from "@prisma/client";

export type LiveClassRole = "host" | "student" | "observer";

export type PreJoinSettings = {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  videoDeviceId?: string;
  audioDeviceId?: string;
  audioOutputDeviceId?: string;
};

export type LiveClassSessionPayload = {
  id: string;
  title: string;
  roomName: string;
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  course: {
    id: string;
    code: string;
    title: string;
  };
  lecturerName: string | null;
  role: LiveClassRole;
  canJoin: boolean;
  canStart: boolean;
  blockReason: string | null;
  backHref: string;
  viewerName: string;
};

export type LiveClassPhase =
  | "prejoin"
  | "connecting"
  | "live"
  | "ended"
  | "removed"
  | "error";
