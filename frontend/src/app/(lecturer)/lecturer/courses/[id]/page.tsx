import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/permissions/rbac";
import { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Users,
  Video,
  Calendar,
} from "lucide-react";
import { CreateModuleDialog } from "@/features/courses/create-module-dialog";
import { MaterialsPanel } from "@/features/materials/materials-panel";
import { AssignmentsPanel } from "@/features/assignments/assignments-panel";
import { AssessmentsPanel } from "@/features/assessments/assessments-panel";
import { listMaterialsForCourse } from "@/services/materials";
import { loadCourseLearningPanels } from "@/features/courses/course-learning-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    select: { code: true, title: true },
  });

  if (!course) {
    return { title: "Course Not Found" };
  }

  return {
    title: `${course.code}: ${course.title} — Faculty Console`,
  };
}

export default async function LecturerCourseDetailPage({ params }: PageProps) {
  const user = await requireRole([RoleKey.LECTURER]);
  const activeMembershipId = user.activeMembership?.institutionUserId;
  const { id: courseId } = await params;

  if (!activeMembershipId) {
    return null;
  }

  const lecturerProfile = await prisma.lecturerProfile.findUnique({
    where: { institutionUserId: activeMembershipId },
  });

  if (!lecturerProfile) {
    notFound();
  }

  // Fetch course ensured to be assigned to this lecturer
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      lecturerProfileId: lecturerProfile.id,
    },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
      },
      enrollments: {
        include: {
          studentProfile: {
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
        },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const institutionId = user.activeMembership!.institutionId;
  const materials = await listMaterialsForCourse(course.id, institutionId);
  const { assignments, assessments } = await loadCourseLearningPanels({
    courseId: course.id,
    institutionId,
    viewerUserId: user.id,
    includeSubmissions: true,
    includeQuestionsForTake: false,
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="space-y-3 border-b border-slate-200 pb-5">
        <Link
          href="/lecturer/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Assigned Courses</span>
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0 mt-1">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-indigo-600 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                  {course.code}
                </span>
                <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {course.description || "No description provided for this course."}
              </p>
            </div>
          </div>

          <Link
            href="/lecturer/classes"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <Video className="h-4 w-4" />
            <span>Launch Virtual Lecture</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Modules + Roster */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Module Authoring & Syllabus */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Curriculum Syllabus Modules</h2>
                  <p className="text-xs text-slate-500">{course.modules.length} modules published</p>
                </div>
              </div>
              <CreateModuleDialog courseId={course.id} />
            </div>

            {course.modules.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 italic">
                No syllabus modules created yet. Click &quot;Add Module&quot; above to author course content.
              </div>
            ) : (
              <div className="space-y-3">
                {course.modules.map((mod, idx) => (
                  <div
                    key={mod.id}
                    className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-slate-50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white font-bold text-xs">
                          {idx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{mod.title}</h3>
                      </div>
                      {mod.description && (
                        <p className="text-xs text-slate-600 pl-8 leading-relaxed">{mod.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <MaterialsPanel
            courseId={course.id}
            materials={materials}
            modules={course.modules.map((m) => ({ id: m.id, title: m.title }))}
            canManage
          />

          <AssignmentsPanel
            courseId={course.id}
            assignments={assignments}
            canManage
            canSubmit={false}
          />

          <AssessmentsPanel
            courseId={course.id}
            assessments={assessments}
            canManage
            canTake={false}
          />
        </div>

        {/* Right Column: Student Roster Summary */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Enrolled Student Roster</h2>
                  <p className="text-xs text-slate-500">{course.enrollments.length} enrolled students</p>
                </div>
              </div>
            </div>

            {course.enrollments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 italic">
                No students currently enrolled in this course.
              </div>
            ) : (
              <div className="space-y-3">
                {course.enrollments.map((en) => {
                  const studentName = en.studentProfile.institutionUser.user.fullName;
                  return (
                    <div
                      key={en.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-1 text-xs"
                    >
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{studentName}</span>
                        <span className="font-mono text-slate-500 font-normal">
                          {en.studentProfile.studentNumber || "—"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>Enrolled: {new Date(en.enrolledAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
