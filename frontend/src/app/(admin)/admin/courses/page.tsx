import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/permissions/rbac";
import { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BookOpen, Layers, Users, ChevronRight, UserCheck } from "lucide-react";
import { CreateCourseDialog } from "@/features/courses/create-course-dialog";

export const metadata: Metadata = {
  title: "Courses — Campus Admin",
};

export default async function AdminCoursesPage() {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;

  if (!institutionId) {
    return null;
  }

  // Fetch courses in active institution
  const courses = await prisma.course.findMany({
    where: { institutionId },
    include: {
      lecturerProfile: {
        include: {
          institutionUser: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      modules: {
        select: { id: true },
      },
      enrollments: {
        select: { id: true },
      },
    },
    orderBy: { code: "asc" },
  });

  // Fetch available lecturers for course assignment modal
  const lecturers = await prisma.lecturerProfile.findMany({
    where: { institutionId },
    include: {
      institutionUser: {
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  const lecturerOptions = lecturers.map((lec) => ({
    id: lec.id,
    name: lec.institutionUser.user.fullName,
    title: lec.title,
  }));

  const totalModulesCount = courses.reduce((acc, c) => acc + c.modules.length, 0);
  const totalEnrollmentsCount = courses.reduce((acc, c) => acc + c.enrollments.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span>Course Management</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create courses, organize curriculum modules, assign lecturers, and track student enrollments for {user.activeMembership?.institutionName}.
          </p>
        </div>
        <div>
          <CreateCourseDialog lecturers={lecturerOptions} />
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Courses</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{courses.length}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Curriculum Modules</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalModulesCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Student Enrollments</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalEnrollmentsCount}</p>
        </div>
      </div>

      {/* Courses Grid / Roster */}
      {courses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-3 shadow-sm max-w-lg mx-auto">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Courses Provisioned Yet</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Click the &quot;Create Course&quot; button above to add your first institution course, assign a lecturer, and build modules.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const lecturerName = course.lecturerProfile
              ? course.lecturerProfile.institutionUser.user.fullName
              : "Unassigned";

            return (
              <div
                key={course.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-mono font-bold text-blue-700">
                      {course.code}
                    </span>
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                      {lecturerName}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {course.title}
                    </h3>
                    {course.description ? (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{course.description}</p>
                    ) : (
                      <p className="mt-1 text-xs italic text-slate-400">No course description provided.</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-indigo-500" />
                      {course.modules.length} Modules
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-emerald-500" />
                      {course.enrollments.length} Enrolled
                    </span>
                  </div>

                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <span>View Roster</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
