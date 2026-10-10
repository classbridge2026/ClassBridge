import { NextResponse } from "next/server";
import { SessionStatus } from "@prisma/client";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { resolveClassSessionAccess } from "@/features/live-class/lib/class-session-access";
import {
  getLiveKitRoomService,
  muteParticipantMicrophone,
  removeLiveKitParticipant,
} from "@/lib/livekit/room-admin";

const postSchema = z.object({
  action: z.enum(["mute_mic", "remove"]),
  identity: z.string().trim().min(1).max(200),
});

type RouteContext = { params: Promise<{ id: string }> };

function isHostMetadata(metadata?: string): boolean {
  if (!metadata) return false;
  try {
    const parsed = JSON.parse(metadata) as { isHost?: boolean };
    return Boolean(parsed.isHost);
  } catch {
    return false;
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await context.params;
    const access = await resolveClassSessionAccess(user, sessionId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    if (!access.data.isHost) {
      return NextResponse.json(
        { error: "Only the lecturer can moderate participants." },
        { status: 403 },
      );
    }

    if (access.data.session.status !== SessionStatus.LIVE) {
      return NextResponse.json(
        { error: "Participant controls are only available while the class is live." },
        { status: 400 },
      );
    }

    const parsed = postSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 });
    }

    const { action, identity } = parsed.data;
    const roomName = access.data.session.roomName;

    const client = getLiveKitRoomService();
    if (!client) {
      return NextResponse.json({ error: "LiveKit is not configured." }, { status: 503 });
    }

    let target;
    try {
      target = await client.getParticipant(roomName, identity);
    } catch {
      return NextResponse.json({ error: "That participant is not in the room." }, { status: 404 });
    }

    if (isHostMetadata(target.metadata)) {
      return NextResponse.json(
        { error: "You cannot moderate another lecturer." },
        { status: 403 },
      );
    }

    // Host must not target themselves (identity is LiveKit identity, e.g. user_xxxxxxxx).
    const selfIdentityPrefix = `user_${user.id.slice(0, 8)}`;
    if (identity === selfIdentityPrefix || target.identity === selfIdentityPrefix) {
      return NextResponse.json({ error: "You cannot moderate yourself." }, { status: 400 });
    }

    if (action === "mute_mic") {
      const result = await muteParticipantMicrophone(roomName, identity);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ ok: true, action });
    }

    const result = await removeLiveKitParticipant(roomName, identity);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, action });
  } catch (error) {
    console.error("Class participants moderation error:", error);
    return NextResponse.json({ error: "Failed to moderate participant." }, { status: 500 });
  }
}
