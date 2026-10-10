import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";
import { AssignmentGradingPanel } from "@/features/lecturer/assignment-grading-panel";
import { submitPublishAssignment } from "@/features/assignments/actions";
import { submitUnpublishAssignment } from "@/features/lecturer/actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: assignment ? `${assignment.title} — Assignment` : "Assignment" };
}

export default async function LecturerAssignmentDetailPage({ params }: PageProps) {
  const { courseIds, institutionId } = await requireLecturerContext();
  const { id } = await params;

  const assignment = await prisma.assignment.findFirst({
    where: {
      id,
      institutionId,
      courseId: { in: courseIds },
    },
    include: {
      course: { select: { id: true, code: true, title: true } },
      submissions: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/lecturer/assignments"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to assignments
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#2563EB]" />
              <span className="font-mono text-xs font-bold text-[#2563EB]">
                {assignment.course.code}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                  assignment.published
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {assignment.published ? "Published" : "Draft"}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{assignment.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              <Link
                href={`/lecturer/courses/${assignment.course.id}`}
                className="font-semibold text-[#2563EB] hover:underline"
              >
                {assignment.course.title}
              </Link>
              {assignment.dueAt
                ? ` · Due ${assignment.dueAt.toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`
                : ""}
            </p>
            {assignment.description ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                {assignment.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {assignment.published ? (
              <form
                action={async () => {
                  "use server";
                  await submitUnpublishAssignment(assignment.id, assignment.courseId);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Unpublish
                </button>
              </form>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await submitPublishAssignment(assignment.id, assignment.courseId);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Publish
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <AssignmentGradingPanel
        submissions={assignment.submissions.map((s) => ({
          id: s.id,
          userName: s.user.fullName,
          userEmail: s.user.email,
          textContent: s.textContent,
          grade: s.grade,
          feedback: s.feedback,
          submittedAt: s.submittedAt.toISOString(),
          gradedAt: s.gradedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
