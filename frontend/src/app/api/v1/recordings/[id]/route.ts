import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { RoleKey } from "@prisma/client";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recording = await prisma.classRecording.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            course: { select: { lecturerProfileId: true } },
          },
        },
      },
    });

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    if (!user.isPlatformSuperAdmin && recording.session.institutionId !== membership?.institutionId) {
      return NextResponse.json({ error: "Forbidden: Tenant mismatch" }, { status: 403 });
    }

    if (membership?.roleKey === RoleKey.LECTURER) {
      const lecturerProfile = membership.institutionUserId
        ? await prisma.lecturerProfile.findUnique({
            where: { institutionUserId: membership.institutionUserId },
            select: { id: true },
          })
        : null;

      if (
        !lecturerProfile ||
        recording.session.course.lecturerProfileId !== lecturerProfile.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.classRecording.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recording:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
