import { NextResponse } from "next/server";
import { NotificationType, RoleKey, SessionStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { storageAdapter } from "@/lib/storage/adapter";
import { createNotificationsForUsers } from "@/services/notifications";

async function assertLecturerOwnsSession(sessionId: string) {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const membership = user.activeMembership;
  if (!membership && !user.isPlatformSuperAdmin) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          title: true,
          lecturerProfileId: true,
          enrollments: {
            select: {
              studentProfile: {
                select: { institutionUser: { select: { userId: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: "Session not found" }, { status: 404 }) };
  }

  if (!user.isPlatformSuperAdmin && session.institutionId !== membership?.institutionId) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  let allowed = user.isPlatformSuperAdmin || membership?.roleKey === RoleKey.INSTITUTION_ADMIN;

  if (!allowed && membership?.roleKey === RoleKey.LECTURER && membership.institutionUserId) {
    const lecturerProfile = await prisma.lecturerProfile.findUnique({
      where: { institutionUserId: membership.institutionUserId },
      select: { id: true },
    });
    allowed = Boolean(
      lecturerProfile && session.course.lecturerProfileId === lecturerProfile.id,
    );
  }

  if (!allowed) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, user, session };
}

/** Upload a finished classroom recording (MediaRecorder / egress file). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: sessionId } = await params;
    const auth = await assertLecturerOwnsSession(sessionId);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    if (
      session.status !== SessionStatus.LIVE &&
      session.status !== SessionStatus.COMPLETED
    ) {
      return NextResponse.json(
        { error: "Recordings can only be saved for live or completed classes." },
        { status: 400 },
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    const titleRaw = form.get("title");
    const durationRaw = form.get("durationSeconds");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Recording file is required." }, { status: 400 });
    }

    const title =
      typeof titleRaw === "string" && titleRaw.trim()
        ? titleRaw.trim().slice(0, 200)
        : `${session.title} — Recording`;

    const durationSeconds = Math.max(
      0,
      Number.parseInt(typeof durationRaw === "string" ? durationRaw : "0", 10) || 0,
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = await storageAdapter.uploadFile(
      buffer,
      file.name || `recording-${sessionId}.webm`,
    );

    const recording = await prisma.classRecording.create({
      data: {
        sessionId,
        title,
        storageKey,
        durationSeconds,
        fileSizeBytes: BigInt(file.size),
      },
    });

    const studentIds = session.course.enrollments.map(
      (e) => e.studentProfile.institutionUser.userId,
    );

    if (studentIds.length > 0) {
      await createNotificationsForUsers(studentIds, {
        institutionId: session.institutionId,
        type: NotificationType.RECORDING_PUBLISHED,
        title: `Recording ready: ${session.title}`,
        body: `A recording from ${session.course.code} is now available.`,
        resourceType: "ClassRecording",
        resourceId: recording.id,
      });
    }

    return NextResponse.json(
      {
        recording: {
          ...recording,
          fileSizeBytes: Number(recording.fileSizeBytes),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Recording upload error:", error);
    return NextResponse.json({ error: "Failed to save recording." }, { status: 500 });
  }
}

/** List recordings for a session (lecturer-owned). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: sessionId } = await params;
    const auth = await assertLecturerOwnsSession(sessionId);
    if (!auth.ok) return auth.response;

    const recordings = await prisma.classRecording.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      recordings: recordings.map((r) => ({
        ...r,
        fileSizeBytes: Number(r.fileSizeBytes),
      })),
    });
  } catch (error) {
    console.error("List recordings error:", error);
    return NextResponse.json({ error: "Failed to list recordings." }, { status: 500 });
  }
}
