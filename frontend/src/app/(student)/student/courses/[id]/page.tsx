import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionStatus } from "@prisma/client";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  UserCheck,
  Mail,
  Video,
  CheckCircle2,
  ClipboardList,
  Film,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";
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
    title: `${course.code}: ${course.title} — Student Portal`,
  };
}

export default async function StudentCourseDetailPage({ params }: PageProps) {
  const { user, studentProfile, institutionId } = await requireStudentContext();
  const { id: courseId } = await params;

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_studentProfileId: {
        courseId,
        studentProfileId: studentProfile.id,
      },
    },
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
          modules: { orderBy: { sortOrder: "asc" } },
          department: { select: { name: true } },
          program: { select: { name: true } },
          sessions: {
            orderBy: { scheduledStart: "desc" },
            take: 8,
          },
        },
      },
    },
  });

  if (!enrollment || enrollment.course.institutionId !== institutionId) {
    notFound();
  }

  const course = enrollment.course;
  const lecturerName = course.lecturerProfile
    ? course.lecturerProfile.institutionUser.user.fullName
    : "Unassigned";

  const [materials, panels, recordings, submissions] = await Promise.all([
    listMaterialsForCourse(course.id, institutionId),
    loadCourseLearningPanels({
      courseId: course.id,
      institutionId,
      viewerUserId: user.id,
      includeSubmissions: false,
      includeQuestionsForTake: true,
    }),
    prisma.classRecording.findMany({
      where: { session: { courseId: course.id, institutionId } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { session: { select: { title: true } } },
    }),
    prisma.assignmentSubmission.findMany({
      where: {
        userId: user.id,
        assignment: { courseId: course.id, published: true },
      },
      select: { assignmentId: true },
    }),
  ]);

  const { assignments, assessments } = panels;
  const publishedAssignments = assignments.filter((a) => a.published);
  const submittedSet = new Set(submissions.map((s) => s.assignmentId));
  const progressPct =
    publishedAssignments.length > 0
      ? Math.round(
          (publishedAssignments.filter((a) => submittedSet.has(a.id)).length /
            publishedAssignments.length) *
            100,
        )
      : null;

  return (
    <div className="space-y-6">
      <div className="space-y-3 border-b border-slate-200 pb-5">
        <Link
          href="/student/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Courses
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#2563EB] px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                  {course.code}
                </span>
                <h2 className="text-2xl font-bold text-slate-900">{course.title}</h2>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {course.description || "No course description provided."}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {[course.program?.name, course.department?.name].filter(Boolean).join(" · ") ||
                  null}
              </p>
            </div>
          </div>

          <Link
            href="/student/live-classes"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Video className="h-4 w-4" />
            Live Classes
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Modules</h3>
                  <p className="text-xs text-slate-500">{course.modules.length} modules</p>
                </div>
              </div>
              {progressPct != null ? (
                <span className="text-xs font-bold text-[#2563EB]">{progressPct}% assignment progress</span>
              ) : null}
            </div>

            {course.modules.length === 0 ? (
              <div className="py-8 text-center text-xs italic text-slate-500">
                No syllabus modules published for this course yet.
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
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{mod.title}</h4>
                      </div>
                      {mod.description ? (
                        <p className="pl-8 text-xs leading-relaxed text-slate-600">
                          {mod.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Video className="h-4 w-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-slate-900">Classes</h3>
            </div>
            {course.sessions.length === 0 ? (
              <p className="py-4 text-center text-xs italic text-slate-500">
                No class sessions for this course yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {course.sessions.map((session) => {
                  const canJoin =
                    session.status === SessionStatus.LIVE ||
                    session.status === SessionStatus.SCHEDULED;
                  return (
                    <li
                      key={session.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{session.title}</p>
                        <p className="text-[11px] text-slate-500">
                          {session.scheduledStart
                            ? session.scheduledStart.toLocaleString()
                            : session.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 ring-1 ring-slate-200">
                          {session.status}
                        </span>
                        {canJoin ? (
                          <Link
                            href={`/class/${session.id}/live`}
                            className="text-xs font-bold text-[#2563EB] hover:underline"
                          >
                            {session.status === SessionStatus.LIVE ? "Join" : "Waiting room"}
                          </Link>
                        ) : (
                          <Link
                            href={`/student/live-classes/${session.id}`}
                            className="text-xs font-bold text-slate-600 hover:underline"
                          >
                            Details
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <MaterialsPanel courseId={course.id} materials={materials} canManage={false} />

          <AssignmentsPanel
            courseId={course.id}
            assignments={publishedAssignments}
            canManage={false}
            canSubmit
          />

          <AssessmentsPanel
            courseId={course.id}
            assessments={assessments.filter((a) => a.published)}
            canManage={false}
            canTake
          />

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Film className="h-4 w-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-slate-900">Recordings</h3>
            </div>
            {recordings.length === 0 ? (
              <p className="py-4 text-center text-xs italic text-slate-500">
                No recordings available for this course yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {recordings.map((rec) => (
                  <li key={rec.id} className="flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{rec.title}</p>
                      <p className="text-[11px] text-slate-500">{rec.session.title}</p>
                    </div>
                    {rec.storageKey ? (
                      <Link
                        href={`/student/recordings/${rec.id}`}
                        className="text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        Play
                      </Link>
                    ) : (
                      <span className="text-[10px] font-bold uppercase text-amber-700">
                        Processing
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <UserCheck className="h-4 w-4 text-[#2563EB]" />
              Primary Lecturer
            </h3>

            {course.lecturerProfile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-sm font-bold text-blue-700">
                    {lecturerName[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{lecturerName}</h4>
                    <p className="text-xs text-slate-500">
                      {course.lecturerProfile.title || "Lecturer"}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">
                      {course.lecturerProfile.institutionUser.user.email}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-slate-500">
                No primary lecturer assigned to this course.
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Progress</h3>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-500">Enrollment</span>
                <span className="font-bold text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-500">Enrolled</span>
                <span className="font-medium text-slate-900">
                  {new Date(enrollment.enrolledAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-500">Modules</span>
                <span className="font-bold text-slate-900">{course.modules.length}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Assignments done</span>
                <span className="font-bold text-slate-900">
                  {submittedSet.size}/{publishedAssignments.length}
                </span>
              </div>
            </div>
            <Link
              href="/student/assignments"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              All assignments
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
