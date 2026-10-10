import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AccessToken } from "livekit-server-sdk";
import { serverEnv } from "@/config/env";
import { RoleKey } from "@prisma/client";

async function generateTokenForUser(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized: Session login required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let sessionId = searchParams.get("sessionId");
  let roomParam = searchParams.get("room");

  if (!sessionId && !roomParam && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    sessionId = body.sessionId;
    roomParam = body.room;
  }

  const membership = user.activeMembership;
  if (!membership && !user.isPlatformSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Active institution membership required" }, { status: 403 });
  }

  const institutionId = membership?.institutionId;
  const roleKey = membership?.roleKey;

  // Attempt to resolve ClassSession from Database
  let session = null;
  const courseInclude = { select: { id: true, code: true, title: true, lecturerProfileId: true } };

  if (sessionId) {
    session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { course: courseInclude },
    });
  } else if (roomParam) {
    session = await prisma.classSession.findFirst({
      where: { roomName: roomParam },
      include: { course: courseInclude },
    });
  }

  let isHost = false;
  let roomName = roomParam || "CS101-ROOM";
  let courseTitle = "Interactive Virtual Lecture";

  if (session) {
    roomName = session.roomName;
    courseTitle = `${session.course.code} — ${session.title}`;

    // 1. Tenant Isolation Guard
    if (!user.isPlatformSuperAdmin && session.institutionId !== institutionId) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to another institution's classroom" },
        { status: 403 }
      );
    }

    // 2. Role & Academic Authorization Guard
    if (user.isPlatformSuperAdmin || roleKey === RoleKey.INSTITUTION_ADMIN) {
      isHost = true;
    } else if (roleKey === RoleKey.LECTURER) {
      const lecturerProfile = membership?.institutionUserId
        ? await prisma.lecturerProfile.findUnique({
            where: { institutionUserId: membership.institutionUserId },
          })
        : null;

      const isAssignedLecturer =
        session.course.lecturerProfileId === lecturerProfile?.id;

      if (!isAssignedLecturer) {
        return NextResponse.json(
          { error: "Forbidden: You are not assigned as the lecturer for this class" },
          { status: 403 }
        );
      }
      isHost = true;
    } else if (roleKey === RoleKey.STUDENT) {
      const studentProfile = membership?.institutionUserId
        ? await prisma.studentProfile.findUnique({
            where: { institutionUserId: membership.institutionUserId },
          })
        : null;

      if (!studentProfile) {
        return NextResponse.json({ error: "Forbidden: Student profile not found" }, { status: 403 });
      }

      const isEnrolled = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentProfileId: {
            courseId: session.courseId,
            studentProfileId: studentProfile.id,
          },
        },
      });

      if (!isEnrolled) {
        return NextResponse.json(
          { error: "Forbidden: You are not enrolled in this course" },
          { status: 403 }
        );
      }

      // 3. Class Lifecycle Guard for Students
      if (session.status === "SCHEDULED") {
        return NextResponse.json(
          { error: "Class has not been started by the instructor yet." },
          { status: 403 }
        );
      }

      if (session.status === "COMPLETED" || session.status === "CANCELLED") {
        return NextResponse.json({ error: "This class session has ended." }, { status: 403 });
      }

      isHost = false;
    }
  } else {
    // Fallback mode for preview rooms
    isHost =
      user.isPlatformSuperAdmin ||
      roleKey === RoleKey.INSTITUTION_ADMIN ||
      roleKey === RoleKey.LECTURER;
  }

  // Issue LiveKit Server AccessToken
  const apiKey = serverEnv.LIVEKIT_API_KEY || "devkey";
  const apiSecret = serverEnv.LIVEKIT_API_SECRET || "secret32bytesminimumlengthforlivekitdev";
  const serverUrl = serverEnv.LIVEKIT_URL || "ws://127.0.0.1:7880";

  const identity = `user_${user.id.slice(0, 8)}`;
  const participantName = user.fullName;

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name: participantName,
    metadata: JSON.stringify({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      roleKey: roleKey || "GUEST",
      institutionId: institutionId || "campus",
      isHost,
      sessionId: session?.id || null,
    }),
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    roomAdmin: isHost,
  });

  const token = await at.toJwt();

  return NextResponse.json({
    token,
    serverUrl,
    roomName,
    courseTitle,
    identity,
    participantName,
    isHost,
    userRole: roleKey || "STUDENT",
    sessionId: session?.id || null,
  });
}

export async function GET(request: Request) {
  try {
    return await generateTokenForUser(request);
  } catch (error) {
    console.error("LiveKit token GET error:", error);
    return NextResponse.json({ error: "Failed to generate LiveKit room token." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await generateTokenForUser(request);
  } catch (error) {
    console.error("LiveKit token POST error:", error);
    return NextResponse.json({ error: "Failed to generate LiveKit room token." }, { status: 500 });
  }
}
