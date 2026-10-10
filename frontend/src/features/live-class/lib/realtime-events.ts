/** Shared LiveKit data-channel payloads for class chat + raise hand. */

export const LIVE_CLASS_DATA_TOPIC = "classbridge.live";

export type ChatBroadcastPayload = {
  kind: "chat";
  message: {
    id: string;
    sessionId: string;
    body: string;
    type: "MESSAGE" | "ANNOUNCEMENT";
    createdAt: string;
    sender: {
      id: string;
      fullName: string;
    };
  };
};

export type RaiseHandPayload = {
  kind: "raise_hand";
  identity: string;
  userId: string;
  fullName: string;
  raised: boolean;
  at: string;
};

export type LowerHandPayload = {
  kind: "lower_hand";
  /** Target participant identity to lower. */
  targetIdentity: string;
  byIdentity: string;
  at: string;
};

export type ForceMutePayload = {
  kind: "force_mute";
  targetIdentity: string;
  source: "microphone";
  at: string;
};

export type LiveClassDataPayload =
  | ChatBroadcastPayload
  | RaiseHandPayload
  | LowerHandPayload
  | ForceMutePayload;

export function encodeLiveClassData(payload: LiveClassDataPayload): Uint8Array<ArrayBuffer> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return new Uint8Array(bytes) as Uint8Array<ArrayBuffer>;
}

export function decodeLiveClassData(data: Uint8Array): LiveClassDataPayload | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(data)) as LiveClassDataPayload;
    if (!parsed || typeof parsed !== "object" || !("kind" in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export type ParticipantLiveMeta = {
  userId?: string;
  email?: string;
  fullName?: string;
  roleKey?: string;
  institutionId?: string;
  isHost?: boolean;
  sessionId?: string | null;
  handRaised?: boolean;
};

export function parseParticipantMeta(metadata?: string): ParticipantLiveMeta {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata) as ParticipantLiveMeta;
  } catch {
    return {};
  }
}

export function mergeParticipantMeta(
  metadata: string | undefined,
  patch: Partial<ParticipantLiveMeta>,
): string {
  return JSON.stringify({ ...parseParticipantMeta(metadata), ...patch });
}
