import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { RoleKey, SessionStatus } from "@prisma/client";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = user.activeMembership;
    if (!membership && !user.isPlatformSuperAdmin) {
      return NextResponse.json({ error: "No active institution membership" }, { status: 403 });
    }

    const institutionId = membership?.institutionId;
    const roleKey = membership?.roleKey;

    let sessions = [];

    const courseInclude = {
      include: {
        lecturerProfile: {
          include: {
            institutionUser: {
              include: { user: { select: { fullName: true, email: true } } },
            },
          },
        },
      },
    };

    if (user.isPlatformSuperAdmin) {
      sessions = await prisma.classSession.findMany({
        include: { course: courseInclude },
        orderBy: { createdAt: "desc" },
      });
    } else if (roleKey === RoleKey.LECTURER) {
      const lecturerProfile = membership?.institutionUserId
        ? await prisma.lecturerProfile.findUnique({
            where: { institutionUserId: membership.institutionUserId },
            include: { courses: { select: { id: true } } },
          })
        : null;

      const assignedCourseIds = lecturerProfile?.courses.map((c) => c.id) || [];

      sessions = await prisma.classSession.findMany({
        where: {
          institutionId,
          ...(assignedCourseIds.length > 0 ? { courseId: { in: assignedCourseIds } } : {}),
        },
        include: { course: courseInclude },
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

      sessions = await prisma.classSession.findMany({
        where: {
          institutionId,
          courseId: { in: enrolledCourseIds },
        },
        include: { course: courseInclude },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Institution Admin
      sessions = await prisma.classSession.findMany({
        where: { institutionId },
        include: { course: courseInclude },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching class sessions:", error);
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
    if (!membership && !user.isPlatformSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: Active membership required" }, { status: 403 });
    }

    const isLecturerOrAdmin =
      user.isPlatformSuperAdmin ||
      membership?.roleKey === RoleKey.LECTURER ||
      membership?.roleKey === RoleKey.INSTITUTION_ADMIN;

    if (!isLecturerOrAdmin) {
      return NextResponse.json({ error: "Forbidden: Only lecturers and admins can schedule classes" }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, title } = body;

    if (!courseId || !title) {
      return NextResponse.json({ error: "courseId and title are required" }, { status: 400 });
    }

    const institutionId = membership?.institutionId;

    // Generate secure room identifier
    const roomName = `class_${crypto.randomUUID().slice(0, 8)}`;

    const newSession = await prisma.classSession.create({
      data: {
        institutionId: institutionId || "",
        courseId,
        title,
        roomName,
        status: SessionStatus.SCHEDULED,
      },
      include: {
        course: { select: { id: true, code: true, title: true } },
      },
    });

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error("Error scheduling class session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
