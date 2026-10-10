import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";

export const metadata: Metadata = {
  title: "Results — Student Portal",
};

export default async function StudentResultsPage() {
  const { user, courseIds, institutionId, institutionName } = await requireStudentContext();

  const [submissions, assessmentAttempts] = await Promise.all([
    courseIds.length > 0
      ? prisma.assignmentSubmission.findMany({
          where: {
            userId: user.id,
            grade: { not: null },
            assignment: {
              institutionId,
              courseId: { in: courseIds },
              published: true,
            },
          },
          include: {
            assignment: {
              include: {
                course: { select: { id: true, code: true, title: true } },
                createdBy: { select: { fullName: true } },
              },
            },
          },
          orderBy: { gradedAt: "desc" },
        })
      : Promise.resolve([]),
    courseIds.length > 0
      ? prisma.assessmentAttempt.findMany({
          where: {
            userId: user.id,
            assessment: {
              institutionId,
              courseId: { in: courseIds },
              published: true,
            },
          },
          include: {
            assessment: {
              include: {
                course: { select: { id: true, code: true, title: true } },
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const hasResults = submissions.length > 0 || assessmentAttempts.length > 0;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <BarChart3 className="h-6 w-6 text-[#2563EB]" />
          Results
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Graded assignments and assessments for your courses at {institutionName}.
        </p>
      </div>

      {!hasResults ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-lg font-bold text-slate-900">No results yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Graded work will appear here after lecturers return your submissions.
          </p>
          <Link
            href="/student/assignments"
            className="mt-4 inline-flex rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            View assignments
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {submissions.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Assignment grades
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Course</th>
                      <th className="px-4 py-3 font-semibold">Assignment</th>
                      <th className="px-4 py-3 font-semibold">Score</th>
                      <th className="px-4 py-3 font-semibold">Feedback</th>
                      <th className="px-4 py-3 font-semibold">Graded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-[#2563EB]">
                          {s.assignment.course.code}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/student/assignments/${s.assignment.id}`}
                            className="font-semibold text-slate-900 hover:text-[#2563EB]"
                          >
                            {s.assignment.title}
                          </Link>
                          <p className="text-xs text-slate-500">{s.assignment.createdBy.fullName}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{s.grade}</td>
                        <td className="max-w-xs px-4 py-3 text-xs text-slate-600">
                          {s.feedback || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {s.gradedAt ? s.gradedAt.toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {assessmentAttempts.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Assessment scores
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Course</th>
                      <th className="px-4 py-3 font-semibold">Assessment</th>
                      <th className="px-4 py-3 font-semibold">Score</th>
                      <th className="px-4 py-3 font-semibold">Percentage</th>
                      <th className="px-4 py-3 font-semibold">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessmentAttempts.map((a) => {
                      const pct =
                        a.maxScore && a.maxScore > 0 && a.score != null
                          ? Math.round((a.score / a.maxScore) * 100)
                          : null;
                      return (
                        <tr key={a.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-[#2563EB]">
                            {a.assessment.course.code}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {a.assessment.title}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {a.score ?? "—"}
                            {a.maxScore != null ? ` / ${a.maxScore}` : ""}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {pct != null ? `${pct}%` : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {a.submittedAt.toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
