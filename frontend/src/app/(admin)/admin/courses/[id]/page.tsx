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
  UserCheck,
  Mail,
  Calendar,
} from "lucide-react";
import { CreateModuleDialog } from "@/features/courses/create-module-dialog";
import { EnrollStudentDialog } from "@/features/courses/enroll-student-dialog";
import { RemoveStudentButton } from "@/features/courses/remove-student-button";
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
    title: `${course.code}: ${course.title} — Campus Admin`,
  };
}

export default async function AdminCourseDetailPage({ params }: PageProps) {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;
  const { id: courseId } = await params;

  if (!institutionId) {
    return null;
  }

  // Fetch course details
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      institutionId,
    },
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

  // Fetch all students in institution who are NOT currently enrolled
  const enrolledStudentIds = course.enrollments.map((e) => e.studentProfileId);

  const availableStudents = await prisma.studentProfile.findMany({
    where: {
      institutionId,
      id: { notIn: enrolledStudentIds.length > 0 ? enrolledStudentIds : undefined },
    },
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
    orderBy: { createdAt: "desc" },
  });

  const availableStudentOptions = availableStudents.map((s) => ({
    id: s.id,
    name: s.institutionUser.user.fullName,
    studentId: s.studentNumber,
    email: s.institutionUser.user.email,
  }));

  const materials = await listMaterialsForCourse(course.id, institutionId);
  const { assignments, assessments } = await loadCourseLearningPanels({
    courseId: course.id,
    institutionId,
    viewerUserId: user.id,
    includeSubmissions: true,
    includeQuestionsForTake: false,
  });

  const lecturerName = course.lecturerProfile
    ? course.lecturerProfile.institutionUser.user.fullName
    : "Unassigned";

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 pb-5">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Courses</span>
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-1">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-600 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                  {course.code}
                </span>
                <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {course.description || "No description provided for this course."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Lecturer + Modules + Enrollment */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Sidebar: Assigned Lecturer & Stats */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span>Assigned Lecturer</span>
            </h2>

            {course.lecturerProfile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200">
                    {course.lecturerProfile.institutionUser.user.fullName[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{lecturerName}</h3>
                    <p className="text-xs text-slate-500">{course.lecturerProfile.title || "Lecturer"}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{course.lecturerProfile.institutionUser.user.email}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-slate-500">No primary lecturer currently assigned to this course.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Course Summary</h2>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Total Modules</span>
                <span className="font-bold text-slate-900">{course.modules.length}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Enrolled Students</span>
                <span className="font-bold text-slate-900">{course.enrollments.length}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Created Date</span>
                <span className="font-medium text-slate-700">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Column: Modules and Enrolled Roster */}
        <div className="lg:col-span-2 space-y-6">
          {/* Modules Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Curriculum Modules</h2>
                  <p className="text-xs text-slate-500">{course.modules.length} modules configured</p>
                </div>
              </div>
              <CreateModuleDialog courseId={course.id} />
            </div>

            {course.modules.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 italic">
                No syllabus modules created yet. Click &quot;Add Module&quot; to start structuring course content.
              </div>
            ) : (
              <div className="space-y-3">
                {course.modules.map((mod, idx) => (
                  <div
                    key={mod.id}
                    className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900">{mod.title}</h3>
                      </div>
                      {mod.description && <p className="text-xs text-slate-600 pl-7">{mod.description}</p>}
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

          {/* Enrolled Students Roster */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Enrolled Students Roster</h2>
                  <p className="text-xs text-slate-500">{course.enrollments.length} enrolled students</p>
                </div>
              </div>
              <EnrollStudentDialog courseId={course.id} availableStudents={availableStudentOptions} />
            </div>

            {course.enrollments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 italic">
                No students currently enrolled in this course. Click &quot;Enroll Student&quot; to register students.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5">Student Name</th>
                      <th className="px-3 py-2.5">Matrix / ID</th>
                      <th className="px-3 py-2.5">Email</th>
                      <th className="px-3 py-2.5">Enrolled Date</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {course.enrollments.map((en) => {
                      const studentName = en.studentProfile.institutionUser.user.fullName;
                      return (
                        <tr key={en.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-3 py-3 font-semibold text-slate-900">{studentName}</td>
                          <td className="px-3 py-3 font-mono text-slate-600">{en.studentProfile.studentNumber || "—"}</td>
                          <td className="px-3 py-3 text-slate-600">{en.studentProfile.institutionUser.user.email}</td>
                          <td className="px-3 py-3 text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {new Date(en.enrolledAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <RemoveStudentButton
                              enrollmentId={en.id}
                              courseId={course.id}
                              studentName={studentName}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
