import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";
import { AssignmentsHub } from "@/features/lecturer/assignments-hub";

export const metadata: Metadata = {
  title: "Assignments — Lecturer Portal",
};

export default async function LecturerAssignmentsPage() {
  const { lecturerProfile, courseIds, institutionId } = await requireLecturerContext();

  const courses = await prisma.course.findMany({
    where: { lecturerProfileId: lecturerProfile.id },
    select: { id: true, code: true, title: true },
    orderBy: { code: "asc" },
  });

  const assignments =
    courseIds.length > 0
      ? await prisma.assignment.findMany({
          where: { institutionId, courseId: { in: courseIds } },
          include: {
            course: { select: { id: true, code: true, title: true } },
            _count: { select: { submissions: true } },
            submissions: {
              where: { grade: null },
              select: { id: true },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">Assignments</h2>
        <p className="mt-1 text-sm text-slate-600">
          Create, publish, and grade work across your courses.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-900">No courses assigned</p>
          <p className="mt-1 text-xs text-slate-500">
            Assignments require at least one course.{" "}
            <Link href="/lecturer/courses" className="font-semibold text-[#2563EB] hover:underline">
              View courses
            </Link>
          </p>
        </div>
      ) : (
        <AssignmentsHub
          courses={courses}
          assignments={assignments.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            dueAt: a.dueAt?.toISOString() ?? null,
            published: a.published,
            courseId: a.course.id,
            courseCode: a.course.code,
            courseTitle: a.course.title,
            submissionCount: a._count.submissions,
            ungradedCount: a.submissions.length,
          }))}
        />
      )}
    </div>
  );
}
