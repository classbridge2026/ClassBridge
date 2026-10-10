import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { deleteLiveKitRoom } from "@/lib/livekit/room-admin";
import { SessionStatus, RoleKey } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = user.activeMembership;
    if (!membership && !user.isPlatformSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const session = await prisma.classSession.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, lecturerProfileId: true } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Class session not found" }, { status: 404 });
    }

    // Verify tenant boundary
    if (!user.isPlatformSuperAdmin && session.institutionId !== membership?.institutionId) {
      return NextResponse.json({ error: "Forbidden: Access denied to another institution's session" }, { status: 403 });
    }

    // Verify lecturer authorization via course
    let isHostLecturer = false;
    if (membership?.roleKey === RoleKey.LECTURER && membership.institutionUserId) {
      const lecturerProfile = await prisma.lecturerProfile.findUnique({
        where: { institutionUserId: membership.institutionUserId },
      });
      if (lecturerProfile && session.course.lecturerProfileId === lecturerProfile.id) {
        isHostLecturer = true;
      }
    }

    const isAdminOrSuperAdmin =
      user.isPlatformSuperAdmin || membership?.roleKey === RoleKey.INSTITUTION_ADMIN;

    if (!isHostLecturer && !isAdminOrSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only the assigned lecturer or institution admin can update class status" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status } = body as { status: SessionStatus };

    if (!status || !Object.values(SessionStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updateData: {
      status: SessionStatus;
      startedAt?: Date | null;
      endedAt?: Date | null;
    } = { status };

    if (status === SessionStatus.LIVE) {
      if (!session.startedAt) {
        updateData.startedAt = new Date();
      }
    } else if (status === SessionStatus.COMPLETED || status === SessionStatus.CANCELLED) {
      updateData.endedAt = new Date();
    }

    const updatedSession = await prisma.classSession.update({
      where: { id },
      data: updateData,
    });

    // End class for everyone: close the LiveKit room so participants disconnect.
    if (status === SessionStatus.COMPLETED || status === SessionStatus.CANCELLED) {
      await deleteLiveKitRoom(session.roomName);
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("Error updating class session status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
