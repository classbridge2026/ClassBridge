import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";
import { BookOpen, Layers, Users, ChevronRight, Calendar } from "lucide-react";
import { SessionStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "My Courses — Lecturer Portal",
};

export default async function LecturerCoursesPage() {
  const { lecturerProfile, institutionName, courseIds } = await requireLecturerContext();

  const courses = await prisma.course.findMany({
    where: { lecturerProfileId: lecturerProfile.id },
    include: {
      department: { select: { name: true } },
      program: { select: { name: true } },
      modules: { select: { id: true } },
      enrollments: { select: { id: true } },
    },
    orderBy: { code: "asc" },
  });

  const upcomingByCourse =
    courseIds.length > 0
      ? await prisma.classSession.groupBy({
          by: ["courseId"],
          where: {
            courseId: { in: courseIds },
            status: { in: [SessionStatus.SCHEDULED, SessionStatus.LIVE] },
            OR: [{ scheduledStart: { gte: new Date() } }, { status: SessionStatus.LIVE }],
          },
          _count: { _all: true },
        })
      : [];

  const upcomingMap = new Map(upcomingByCourse.map((r) => [r.courseId, r._count._all]));

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">My Courses</h2>
        <p className="mt-1 text-sm text-slate-600">
          Courses assigned to you at {institutionName}.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-lg font-bold text-slate-900">No courses assigned yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            You don&apos;t have any courses assigned yet. Contact your institution administrator to
            update your teaching roster.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article
              key={course.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md bg-[#2563EB] px-2.5 py-1 font-mono text-xs font-bold text-white">
                    {course.code}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                    {course.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{course.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {[course.program?.name, course.department?.name].filter(Boolean).join(" · ") ||
                      "No program / department"}
                  </p>
                  {course.description ? (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-600">{course.description}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                    {course.enrollments.length} students
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    {upcomingMap.get(course.id) ?? 0} upcoming
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    {course.modules.length} modules
                  </span>
                </div>
                <Link
                  href={`/lecturer/courses/${course.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
                >
                  Open course <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
