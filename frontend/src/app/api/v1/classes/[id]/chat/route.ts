import { NextResponse } from "next/server";
import { ClassChatMessageType } from "@prisma/client";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { resolveClassSessionAccess } from "@/features/live-class/lib/class-session-access";

const postSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  type: z.enum(["MESSAGE", "ANNOUNCEMENT"]).default("MESSAGE"),
});

type RouteContext = { params: Promise<{ id: string }> };

function serializeMessage(message: {
  id: string;
  sessionId: string;
  body: string;
  type: ClassChatMessageType;
  createdAt: Date;
  sender: { id: string; fullName: string };
}) {
  return {
    id: message.id,
    sessionId: message.sessionId,
    body: message.body,
    type: message.type,
    createdAt: message.createdAt.toISOString(),
    sender: {
      id: message.sender.id,
      fullName: message.sender.fullName,
    },
  };
}

export async function GET(_request: Request, context: RouteContext) {
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

    const messages = await prisma.classChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: {
        sender: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({
      messages: messages.map(serializeMessage),
      permissions: {
        canChat: access.data.canChat && access.data.session.status === "LIVE",
        canAnnounce: access.data.canAnnounce,
        isHost: access.data.isHost,
      },
    });
  } catch (error) {
    console.error("Class chat GET error:", error);
    return NextResponse.json({ error: "Failed to load class chat." }, { status: 500 });
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

    if (access.data.session.status !== "LIVE") {
      return NextResponse.json(
        { error: "Chat is only available while the class is live." },
        { status: 403 },
      );
    }

    const parsed = postSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid chat message." }, { status: 400 });
    }

    const { body, type } = parsed.data;

    if (type === "ANNOUNCEMENT" && !access.data.canAnnounce) {
      return NextResponse.json(
        { error: "Only the lecturer can send announcements." },
        { status: 403 },
      );
    }

    if (!access.data.canChat) {
      return NextResponse.json({ error: "Chat is disabled for this class." }, { status: 403 });
    }

    const message = await prisma.classChatMessage.create({
      data: {
        sessionId,
        senderId: user.id,
        body,
        type: type as ClassChatMessageType,
      },
      include: {
        sender: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({ message: serializeMessage(message) });
  } catch (error) {
    console.error("Class chat POST error:", error);
    return NextResponse.json({ error: "Failed to send chat message." }, { status: 500 });
  }
}
