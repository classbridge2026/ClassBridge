import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";
import { LecturerClassesBoard } from "@/features/lecturer/classes-board";

export const metadata: Metadata = {
  title: "My Classes — Lecturer Console",
};

export default async function LecturerClassesPage() {
  const { institutionId, lecturerProfile, courseIds } = await requireLecturerContext();

  const courses = await prisma.course.findMany({
    where: { lecturerProfileId: lecturerProfile.id },
    select: { id: true, code: true, title: true },
    orderBy: { code: "asc" },
  });

  const sessions =
    courseIds.length > 0
      ? await prisma.classSession.findMany({
          where: { institutionId, courseId: { in: courseIds } },
          include: {
            course: { select: { code: true, title: true } },
            _count: { select: { attendance: true, recordings: true } },
          },
          orderBy: [{ scheduledStart: "desc" }, { createdAt: "desc" }],
        })
      : [];

  return (
    <LecturerClassesBoard
      courses={courses}
      sessions={sessions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        status: s.status,
        scheduledStart: s.scheduledStart?.toISOString() ?? null,
        scheduledEnd: s.scheduledEnd?.toISOString() ?? null,
        courseCode: s.course.code,
        courseTitle: s.course.title,
        attendanceCount: s._count.attendance,
        recordingCount: s._count.recordings,
      }))}
    />
  );
}
