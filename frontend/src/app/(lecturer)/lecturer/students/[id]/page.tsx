import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Student Profile — Lecturer Portal",
};

export default async function LecturerStudentDetailPage({ params }: PageProps) {
  const { lecturerProfile, courseIds } = await requireLecturerContext();
  const { id } = await params;

  if (courseIds.length === 0) notFound();

  const student = await prisma.studentProfile.findFirst({
    where: {
      id,
      enrollments: { some: { courseId: { in: courseIds } } },
    },
    include: {
      institutionUser: {
        select: {
          userId: true,
          user: { select: { fullName: true, email: true, phone: true } },
        },
      },
      department: { select: { name: true } },
      program: { select: { name: true } },
      enrollments: {
        where: { courseId: { in: courseIds } },
        include: { course: { select: { id: true, code: true, title: true } } },
      },
      attendance: {
        where: { session: { course: { lecturerProfileId: lecturerProfile.id } } },
        include: {
          session: {
            select: {
              id: true,
              title: true,
              scheduledStart: true,
              course: { select: { code: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!student) notFound();

  const assignmentRows = await prisma.assignmentSubmission.findMany({
    where: {
      userId: student.institutionUser.userId,
      assignment: { courseId: { in: courseIds } },
    },
    include: {
      assignment: {
        select: { id: true, title: true, course: { select: { code: true } } },
      },
    },
    orderBy: { submittedAt: "desc" },
    take: 20,
  });

  const u = student.institutionUser.user;

  return (
    <div className="space-y-6">
      <Link
        href="/lecturer/students"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to students
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">{u.fullName}</h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-slate-500">Email</dt>
            <dd>{u.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Student ID</dt>
            <dd className="font-mono">{student.studentNumber || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Program</dt>
            <dd>{student.program?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Department</dt>
            <dd>{student.department?.name || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Courses with you</h3>
        <ul className="mt-3 space-y-2">
          {student.enrollments.map((e) => (
            <li key={e.id}>
              <Link
                href={`/lecturer/courses/${e.course.id}`}
                className="text-sm font-semibold text-[#2563EB] hover:underline"
              >
                {e.course.code} — {e.course.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Recent attendance</h3>
          {student.attendance.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No attendance records yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 text-xs">
              {student.attendance.map((a) => (
                <li key={a.id} className="flex justify-between py-2">
                  <span>
                    <span className="font-semibold text-slate-900">{a.session.title}</span>
                    <span className="block text-slate-500">{a.session.course.code}</span>
                  </span>
                  <span className="text-right text-slate-600">
                    {a.status}
                    <span className="block">{a.durationMinutes} min</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Assignment performance</h3>
          {assignmentRows.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No submissions yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 text-xs">
              {assignmentRows.map((s) => (
                <li key={s.id} className="flex justify-between py-2">
                  <span>
                    <span className="font-semibold text-slate-900">{s.assignment.title}</span>
                    <span className="block text-slate-500">{s.assignment.course.code}</span>
                  </span>
                  <span className="font-bold text-slate-800">
                    {s.grade != null ? `${s.grade}%` : "Ungraded"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
