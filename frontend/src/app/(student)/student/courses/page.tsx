import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Layers, ChevronRight, UserCheck, Building2, GraduationCap } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";

export const metadata: Metadata = {
  title: "My Courses — Student Portal",
};

export default async function StudentCoursesPage() {
  const { user, studentProfile, institutionName } = await requireStudentContext();

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentProfileId: studentProfile.id },
    include: {
      course: {
        include: {
          lecturerProfile: {
            include: {
              institutionUser: {
                include: {
                  user: { select: { fullName: true, email: true } },
                },
              },
            },
          },
          modules: { select: { id: true } },
          department: { select: { name: true } },
          program: { select: { name: true } },
          assignments: {
            where: { published: true },
            select: { id: true },
          },
          sessions: {
            where: { status: { in: ["SCHEDULED", "LIVE"] } },
            select: { id: true, status: true },
            take: 5,
          },
          _count: {
            select: {
              sessions: true,
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const assignmentIds = enrollments.flatMap((e) => e.course.assignments.map((a) => a.id));
  const submissions =
    assignmentIds.length > 0
      ? await prisma.assignmentSubmission.findMany({
          where: { userId: user.id, assignmentId: { in: assignmentIds } },
          select: { assignmentId: true },
        })
      : [];
  const submittedSet = new Set(submissions.map((s) => s.assignmentId));

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <BookOpen className="h-6 w-6 text-[#2563EB]" />
          My Courses
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Courses you are enrolled in at {institutionName}.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="mx-auto max-w-lg rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-lg font-bold text-slate-900">No course enrollments</h3>
          <p className="mt-1 text-sm text-slate-500">
            Contact your institution administrator to update your enrollment schedule.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {enrollments.map(({ course, enrolledAt }) => {
            const lecturerName =
              course.lecturerProfile?.institutionUser.user.fullName ?? "Unassigned";
            const totalAssignments = course.assignments.length;
            const done = course.assignments.filter((a) => submittedSet.has(a.id)).length;
            const progressPct =
              totalAssignments > 0 ? Math.round((done / totalAssignments) * 100) : null;
            const upcomingLive = course.sessions.filter((s) => s.status === "LIVE").length;
            const upcomingScheduled = course.sessions.filter((s) => s.status === "SCHEDULED").length;

            return (
              <article
                key={course.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-[#2563EB] px-2.5 py-1 font-mono text-xs font-bold text-white">
                      {course.code}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        course.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{course.title}</h3>
                    {course.description ? (
                      <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">
                        {course.description}
                      </p>
                    ) : null}
                  </div>

                  <dl className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-[#2563EB]" />
                      <span>Lecturer: {lecturerName}</span>
                    </div>
                    {course.program?.name ? (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                        <span>{course.program.name}</span>
                      </div>
                    ) : null}
                    {course.department?.name ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{course.department.name}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-indigo-500" />
                      <span>
                        {course.modules.length} modules · {course._count.sessions} classes
                      </span>
                    </div>
                  </dl>

                  {progressPct != null ? (
                    <div>
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-slate-600">Assignment progress</span>
                        <span className="font-bold text-slate-900">
                          {done}/{totalAssignments} ({progressPct}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#2563EB]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {(upcomingLive > 0 || upcomingScheduled > 0) && (
                    <p className="text-[11px] font-semibold text-slate-600">
                      {upcomingLive > 0
                        ? `${upcomingLive} live now`
                        : `${upcomingScheduled} upcoming class${upcomingScheduled === 1 ? "" : "es"}`}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                  <span className="text-slate-500">
                    Enrolled {new Date(enrolledAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/student/courses/${course.id}`}
                    className="inline-flex items-center gap-1 font-bold text-[#2563EB] hover:text-blue-800"
                  >
                    Open course
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
