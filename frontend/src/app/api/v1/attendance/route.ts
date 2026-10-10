import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { RoleKey } from "@prisma/client";
import { z } from "zod";

const attendanceBodySchema = z.object({
  sessionId: z.string().uuid(),
  action: z.enum(["join", "leave"]),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user?.activeMembership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = user.activeMembership;
    if (membership.roleKey !== RoleKey.STUDENT) {
      return NextResponse.json(
        { error: "Only students generate attendance records." },
        { status: 403 },
      );
    }

    const parsed = attendanceBodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid attendance payload." }, { status: 400 });
    }

    const { sessionId, action } = parsed.data;

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { institutionUserId: membership.institutionUserId },
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      select: { id: true, institutionId: true, courseId: true, status: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }

    if (session.institutionId !== membership.institutionId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentProfileId: {
          courseId: session.courseId,
          studentProfileId: studentProfile.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course." }, { status: 403 });
    }

    if (action === "join") {
      const record = await prisma.classAttendance.upsert({
        where: {
          sessionId_studentProfileId: {
            sessionId,
            studentProfileId: studentProfile.id,
          },
        },
        create: {
          sessionId,
          studentProfileId: studentProfile.id,
          joinedAt: new Date(),
          leftAt: null,
          durationMinutes: 0,
          status: "PRESENT",
        },
        update: {
          joinedAt: new Date(),
          leftAt: null,
          status: "PRESENT",
        },
      });

      return NextResponse.json({ ok: true, record });
    }

    const existing = await prisma.classAttendance.findUnique({
      where: {
        sessionId_studentProfileId: {
          sessionId,
          studentProfileId: studentProfile.id,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const leftAt = new Date();
    const durationMinutes = Math.max(
      0,
      Math.round((leftAt.getTime() - existing.joinedAt.getTime()) / 60000),
    );

    const record = await prisma.classAttendance.update({
      where: { id: existing.id },
      data: {
        leftAt,
        durationMinutes,
      },
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    console.error("Attendance API error:", error);
    return NextResponse.json({ error: "Failed to update attendance." }, { status: 500 });
  }
}
