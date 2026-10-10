import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";
import { ScheduleCalendar } from "@/features/lecturer/schedule-calendar";

export const metadata: Metadata = {
  title: "Schedule — Lecturer Portal",
};

export default async function LecturerSchedulePage() {
  const { institutionId, courseIds } = await requireLecturerContext();

  const sessions =
    courseIds.length > 0
      ? await prisma.classSession.findMany({
          where: { institutionId, courseId: { in: courseIds } },
          include: { course: { select: { code: true, title: true } } },
          orderBy: { scheduledStart: "asc" },
        })
      : [];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">Teaching Schedule</h2>
        <p className="mt-1 text-sm text-slate-600">
          Day, week, and month views of your assigned class sessions.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-900">No sessions on your schedule yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Schedule a class from My Classes to see it on this calendar.
          </p>
        </div>
      ) : (
        <ScheduleCalendar
          sessions={sessions.map((s) => ({
            id: s.id,
            title: s.title,
            status: s.status,
            scheduledStart: s.scheduledStart?.toISOString() ?? null,
            scheduledEnd: s.scheduledEnd?.toISOString() ?? null,
            courseCode: s.course.code,
            courseTitle: s.course.title,
          }))}
        />
      )}
    </div>
  );
}
