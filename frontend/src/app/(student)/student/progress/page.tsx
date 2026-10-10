import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, BookOpen, ClipboardList, ClipboardCheck, Layers } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";

export const metadata: Metadata = {
  title: "Progress — Student Portal",
};

export default async function StudentProgressPage() {
  const { user, studentProfile, courseIds, institutionId, institutionName } =
    await requireStudentContext();

  const enrollments =
    courseIds.length > 0
      ? await prisma.courseEnrollment.findMany({
          where: { studentProfileId: studentProfile.id },
          include: {
            course: {
              include: {
                modules: { select: { id: true } },
                assignments: {
                  where: { published: true },
                  select: { id: true },
                },
                sessions: {
                  select: { id: true, status: true },
                },
                _count: { select: { materials: true } },
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        })
      : [];

  const assignmentIds = enrollments.flatMap((e) => e.course.assignments.map((a) => a.id));
  const sessionIds = enrollments.flatMap((e) => e.course.sessions.map((s) => s.id));

  const [submissions, attendance] = await Promise.all([
    assignmentIds.length > 0
      ? prisma.assignmentSubmission.findMany({
          where: { userId: user.id, assignmentId: { in: assignmentIds } },
          select: { assignmentId: true, grade: true },
        })
      : Promise.resolve([]),
    sessionIds.length > 0
      ? prisma.classAttendance.findMany({
          where: {
            studentProfileId: studentProfile.id,
            sessionId: { in: sessionIds },
          },
          select: { sessionId: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const submittedSet = new Set(submissions.map((s) => s.assignmentId));
  const attendedSet = new Set(attendance.map((a) => a.sessionId));

  const totalAssignments = assignmentIds.length;
  const completedAssignments = submittedSet.size;
  const assignmentPct =
    totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  const completedSessions = enrollments.reduce(
    (acc, e) => acc + e.course.sessions.filter((s) => s.status === "COMPLETED").length,
    0,
  );
  const attendedCount = attendance.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE",
  ).length;
  const attendancePct =
    completedSessions > 0
      ? Math.round((attendedCount / Math.max(completedSessions, attendedSet.size || 1)) * 100)
      : attendance.length > 0
        ? Math.round(
            (attendedCount / attendance.length) * 100,
          )
        : null;

  const graded = submissions.filter((s) => s.grade != null);
  const avgGrade =
    graded.length > 0
      ? Math.round(graded.reduce((acc, s) => acc + (s.grade ?? 0), 0) / graded.length)
      : null;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <TrendingUp className="h-6 w-6 text-[#2563EB]" />
          Progress
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Academic activity across your enrolled courses at {institutionName}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Enrolled courses"
          value={String(enrollments.length)}
        />
        <StatCard
          icon={ClipboardList}
          label="Assignments completed"
          value={`${completedAssignments}/${totalAssignments || 0}`}
          hint={totalAssignments > 0 ? `${assignmentPct}%` : undefined}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Attendance"
          value={attendancePct == null ? "—" : `${attendancePct}%`}
          hint={`${attendedCount} sessions logged`}
        />
        <StatCard
          icon={Layers}
          label="Average grade"
          value={avgGrade == null ? "—" : String(avgGrade)}
          hint={graded.length > 0 ? `${graded.length} graded` : "No grades yet"}
        />
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-900">No course progress to show</p>
          <p className="mt-1 text-xs text-slate-500">
            Progress metrics appear after you are enrolled in courses.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map(({ course }) => {
            const courseAssignmentIds = course.assignments.map((a) => a.id);
            const courseSubmitted = courseAssignmentIds.filter((id) => submittedSet.has(id)).length;
            const courseAssignmentPct =
              courseAssignmentIds.length > 0
                ? Math.round((courseSubmitted / courseAssignmentIds.length) * 100)
                : 0;
            const courseSessions = course.sessions.length;
            const courseAttended = course.sessions.filter((s) => attendedSet.has(s.id)).length;
            const courseAttendancePct =
              courseSessions > 0 ? Math.round((courseAttended / courseSessions) * 100) : null;
            const moduleCount = course.modules.length;
            const overall =
              courseAssignmentIds.length + courseSessions > 0
                ? Math.round(
                    ((courseSubmitted + courseAttended) /
                      (courseAssignmentIds.length + courseSessions)) *
                      100,
                  )
                : moduleCount > 0
                  ? 0
                  : null;

            return (
              <article
                key={course.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#2563EB]">{course.code}</span>
                    <h3 className="mt-1 text-base font-bold text-slate-900">{course.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {moduleCount} modules · {course._count.materials} materials ·{" "}
                      {courseAssignmentIds.length} assignments · {courseSessions} classes
                    </p>
                  </div>
                  <Link
                    href={`/student/courses/${course.id}`}
                    className="text-xs font-bold text-[#2563EB] hover:underline"
                  >
                    Open course
                  </Link>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <ProgressBar label="Assignments" value={courseAssignmentPct} />
                  <ProgressBar
                    label="Attendance"
                    value={courseAttendancePct}
                    emptyLabel="No sessions yet"
                  />
                  <ProgressBar
                    label="Overall activity"
                    value={overall}
                    emptyLabel="No activity yet"
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function ProgressBar({
  label,
  value,
  emptyLabel,
}: {
  label: string;
  value: number | null;
  emptyLabel?: string;
}) {
  if (value == null) {
    return (
      <div>
        <div className="flex justify-between text-xs">
          <span className="font-semibold text-slate-700">{label}</span>
          <span className="text-slate-400">{emptyLabel ?? "—"}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#2563EB] transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${value}%`}
        />
      </div>
    </div>
  );
}
