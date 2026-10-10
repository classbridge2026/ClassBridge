import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";
import { StudentAssignmentSubmitForm } from "@/features/student/assignment-submit-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const a = await prisma.assignment.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: a ? `${a.title} — Assignment` : "Assignment" };
}

export default async function StudentAssignmentDetailPage({ params }: PageProps) {
  const { user, courseIds, institutionId } = await requireStudentContext();
  const { id } = await params;

  const assignment = await prisma.assignment.findFirst({
    where: {
      id,
      institutionId,
      courseId: { in: courseIds },
      published: true,
    },
    include: {
      course: { select: { id: true, code: true, title: true } },
      createdBy: { select: { fullName: true } },
      submissions: {
        where: { userId: user.id },
        take: 1,
      },
    },
  });

  if (!assignment) notFound();

  const submission = assignment.submissions[0] ?? null;
  const isPastDue = Boolean(assignment.dueAt && assignment.dueAt < new Date());

  return (
    <div className="space-y-6">
      <Link
        href="/student/assignments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2563EB]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Assignments
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="font-mono text-xs font-bold text-[#2563EB]">
              {assignment.course.code}
            </span>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{assignment.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{assignment.course.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              Lecturer: {assignment.createdBy.fullName}
              {assignment.dueAt
                ? ` · Due ${assignment.dueAt.toLocaleString()}`
                : " · No due date"}
              {isPastDue && !submission ? " · Past due" : ""}
            </p>
          </div>
        </div>

        {assignment.description ? (
          <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
            {assignment.description}
          </div>
        ) : (
          <p className="mt-5 text-sm italic text-slate-500">No additional instructions provided.</p>
        )}
      </div>

      {submission ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Your submission</h3>
          <p className="text-xs text-slate-500">
            Submitted {submission.submittedAt.toLocaleString()}
            {submission.fileName ? ` · File: ${submission.fileName}` : ""}
          </p>
          {submission.textContent ? (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
              {submission.textContent}
            </div>
          ) : null}
          {submission.grade != null ? (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-800">
                Grade: {submission.grade}
              </p>
              {submission.feedback ? (
                <p className="mt-2 text-sm text-emerald-900 whitespace-pre-wrap">
                  {submission.feedback}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs font-semibold text-blue-700">Submitted — awaiting grade</p>
          )}
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">
          {submission ? "Resubmit assignment" : "Submit assignment"}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {submission
            ? "Resubmitting replaces your previous work and clears any existing grade."
            : "Upload a file and/or add written work, then submit."}
        </p>
        <div className="mt-4">
          <StudentAssignmentSubmitForm assignmentId={assignment.id} />
        </div>
      </section>

      <Link
        href={`/student/courses/${assignment.course.id}`}
        className="inline-flex text-xs font-semibold text-[#2563EB] hover:underline"
      >
        Open course
      </Link>
    </div>
  );
}
