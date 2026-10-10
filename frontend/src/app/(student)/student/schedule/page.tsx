import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";
import { ScheduleCalendar } from "@/features/lecturer/schedule-calendar";

export const metadata: Metadata = {
  title: "Class Schedule — Student Portal",
};

export default async function StudentSchedulePage() {
  const { courseIds, institutionId, institutionName } = await requireStudentContext();

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
        <h2 className="text-2xl font-bold text-slate-900">Class Schedule</h2>
        <p className="mt-1 text-sm text-slate-600">
          Day, week, and month views of your enrolled classes at {institutionName}.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-900">No sessions on your schedule yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Scheduled classes for your courses will appear on this calendar.
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
          links={{
            detailHref: (id) => `/student/live-classes/${id}`,
            joinLabelLive: "Join",
            joinLabelScheduled: "Waiting room",
          }}
        />
      )}
    </div>
  );
}
