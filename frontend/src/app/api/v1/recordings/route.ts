import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { RoleKey } from "@prisma/client";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = user.activeMembership;
    if (!membership && !user.isPlatformSuperAdmin) {
      return NextResponse.json({ error: "No active membership" }, { status: 403 });
    }

    const institutionId = membership?.institutionId;
    const roleKey = membership?.roleKey;

    let recordings = [];

    if (user.isPlatformSuperAdmin) {
      recordings = await prisma.classRecording.findMany({
        include: {
          session: {
            include: {
              course: { select: { id: true, code: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (roleKey === RoleKey.STUDENT) {
      const studentProfile = membership?.institutionUserId
        ? await prisma.studentProfile.findUnique({
            where: { institutionUserId: membership.institutionUserId },
            include: { enrollments: true },
          })
        : null;

      const enrolledCourseIds = studentProfile?.enrollments.map((e) => e.courseId) || [];

      recordings = await prisma.classRecording.findMany({
        where: {
          session: {
            institutionId,
            courseId: { in: enrolledCourseIds },
          },
        },
        include: {
          session: {
            include: {
              course: { select: { id: true, code: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (roleKey === RoleKey.LECTURER) {
      const lecturerProfile = membership?.institutionUserId
        ? await prisma.lecturerProfile.findUnique({
            where: { institutionUserId: membership.institutionUserId },
            include: { courses: { select: { id: true } } },
          })
        : null;
      const lecturerCourseIds = lecturerProfile?.courses.map((c) => c.id) ?? [];

      recordings = await prisma.classRecording.findMany({
        where: {
          session: {
            institutionId,
            courseId: { in: lecturerCourseIds },
          },
        },
        include: {
          session: {
            include: {
              course: { select: { id: true, code: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Institution admin (and other campus staff with access)
      recordings = await prisma.classRecording.findMany({
        where: {
          session: { institutionId },
        },
        include: {
          session: {
            include: {
              course: { select: { id: true, code: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Convert BigInt fileSizeBytes to Number/String for JSON serialization
    const serializedRecordings = recordings.map((r) => ({
      ...r,
      fileSizeBytes: Number(r.fileSizeBytes),
    }));

    return NextResponse.json({ recordings: serializedRecordings });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = user.activeMembership;
    const isLecturerOrAdmin =
      user.isPlatformSuperAdmin ||
      membership?.roleKey === RoleKey.LECTURER ||
      membership?.roleKey === RoleKey.INSTITUTION_ADMIN;

    if (!isLecturerOrAdmin) {
      return NextResponse.json({ error: "Forbidden: Only lecturers or admins can create recordings" }, { status: 403 });
    }

    const body = await req.json();
    const { sessionId, title, durationSeconds, fileSizeBytes, storageKey } = body;

    if (!sessionId || !title) {
      return NextResponse.json({ error: "sessionId and title are required" }, { status: 400 });
    }

    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const recording = await prisma.classRecording.create({
      data: {
        sessionId,
        title,
        durationSeconds: durationSeconds || 0,
        fileSizeBytes: fileSizeBytes ? BigInt(fileSizeBytes) : BigInt(0),
        storageKey: storageKey || `recordings/${session.roomName}-${Date.now()}.mp4`,
      },
      include: {
        session: {
          include: {
            course: { select: { id: true, code: true, title: true } },
          },
        },
      },
    });

    return NextResponse.json({
      recording: {
        ...recording,
        fileSizeBytes: Number(recording.fileSizeBytes),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating recording:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
