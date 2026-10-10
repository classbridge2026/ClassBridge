import "server-only";
import { DataPacket_Kind, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import { encodeLiveClassData } from "@/features/live-class/lib/realtime-events";
import { serverEnv } from "@/config/env";

function toHttpHost(url: string) {
  return url.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
}

export function getLiveKitRoomService(): RoomServiceClient | null {
  const url = serverEnv.LIVEKIT_URL || "ws://127.0.0.1:7880";
  const apiKey = serverEnv.LIVEKIT_API_KEY || "devkey";
  const apiSecret =
    serverEnv.LIVEKIT_API_SECRET || "secret32bytesminimumlengthforlivekitdev";

  if (!url || !apiKey || !apiSecret) return null;

  return new RoomServiceClient(toHttpHost(url), apiKey, apiSecret);
}

/** Close a LiveKit room so all participants disconnect. */
export async function deleteLiveKitRoom(roomName: string): Promise<void> {
  const client = getLiveKitRoomService();
  if (!client) return;
  try {
    await client.deleteRoom(roomName);
  } catch (error) {
    // Room may already be empty / missing — log and continue DB lifecycle.
    console.warn("LiveKit deleteRoom failed:", roomName, error);
  }
}

export type LiveKitModerationResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/** Force-mute a participant's published microphone track. */
export async function muteParticipantMicrophone(
  roomName: string,
  identity: string,
): Promise<LiveKitModerationResult> {
  const client = getLiveKitRoomService();
  if (!client) {
    return { ok: false, error: "LiveKit is not configured.", status: 503 };
  }

  try {
    const participant = await client.getParticipant(roomName, identity);
    const micTrack = participant.tracks.find(
      (track) => track.source === TrackSource.MICROPHONE && !track.muted,
    );

    if (!micTrack?.sid) {
      // Already muted or no mic published — treat as success for idempotent UX.
      const anyMic = participant.tracks.find((track) => track.source === TrackSource.MICROPHONE);
      if (anyMic) {
        return { ok: true };
      }
      return { ok: false, error: "That participant has no microphone published.", status: 400 };
    }

    await client.mutePublishedTrack(roomName, identity, micTrack.sid, true);

    try {
      await client.sendData(
        roomName,
        encodeLiveClassData({
          kind: "force_mute",
          targetIdentity: identity,
          source: "microphone",
          at: new Date().toISOString(),
        }),
        DataPacket_Kind.RELIABLE,
        { destinationIdentities: [identity] },
      );
    } catch (notifyError) {
      // Mute already applied; notification is best-effort.
      console.warn("LiveKit force_mute notify failed:", roomName, identity, notifyError);
    }

    return { ok: true };
  } catch (error) {
    console.warn("LiveKit muteParticipantMicrophone failed:", roomName, identity, error);
    return { ok: false, error: "We couldn't mute that participant.", status: 502 };
  }
}

/** Disconnect a participant from the LiveKit room. */
export async function removeLiveKitParticipant(
  roomName: string,
  identity: string,
): Promise<LiveKitModerationResult> {
  const client = getLiveKitRoomService();
  if (!client) {
    return { ok: false, error: "LiveKit is not configured.", status: 503 };
  }

  try {
    await client.removeParticipant(roomName, identity);
    return { ok: true };
  } catch (error) {
    console.warn("LiveKit removeLiveKitParticipant failed:", roomName, identity, error);
    return { ok: false, error: "We couldn't remove that participant.", status: 502 };
  }
}
