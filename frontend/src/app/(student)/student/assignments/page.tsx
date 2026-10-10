import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";

export const metadata: Metadata = {
  title: "Assignments — Student Portal",
};

function statusFor(assignment: {
  dueAt: Date | null;
  submission: {
    grade: number | null;
    submittedAt: Date;
    feedback: string | null;
  } | null;
}) {
  if (assignment.submission?.grade != null) return "Graded" as const;
  if (assignment.submission) {
    if (assignment.dueAt && assignment.submission.submittedAt > assignment.dueAt) {
      return "Late" as const;
    }
    return "Submitted" as const;
  }
  if (assignment.dueAt && assignment.dueAt < new Date()) return "Late" as const;
  return "Not Submitted" as const;
}

const STATUS_STYLES: Record<string, string> = {
  Graded: "bg-emerald-50 text-emerald-700",
  Submitted: "bg-blue-50 text-blue-700",
  Late: "bg-amber-50 text-amber-700",
  "Not Submitted": "bg-slate-100 text-slate-700",
  Returned: "bg-violet-50 text-violet-700",
};

export default async function StudentAssignmentsPage() {
  const { user, courseIds, institutionId, institutionName } = await requireStudentContext();

  const assignments =
    courseIds.length > 0
      ? await prisma.assignment.findMany({
          where: {
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
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        })
      : [];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <ClipboardList className="h-6 w-6 text-[#2563EB]" />
          Assignments
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Coursework for your enrolled classes at {institutionName}.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-lg font-bold text-slate-900">No assignments yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Published assignments from your lecturers will show up here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Assignment</th>
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Grade</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const submission = a.submissions[0] ?? null;
                const status = statusFor({ dueAt: a.dueAt, submission });
                return (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.createdBy.fullName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.course.code}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.dueAt ? a.dueAt.toLocaleString() : "No due date"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${STATUS_STYLES[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {submission?.grade != null ? submission.grade : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/student/assignments/${a.id}`}
                        className="text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
