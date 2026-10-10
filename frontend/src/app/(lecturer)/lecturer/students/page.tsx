import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";
import { StudentsDirectory } from "@/features/lecturer/students-directory";

export const metadata: Metadata = {
  title: "Students — Lecturer Portal",
};

export default async function LecturerStudentsPage() {
  const { lecturerProfile, courseIds } = await requireLecturerContext();

  if (courseIds.length === 0) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-2xl font-bold text-slate-900">Students</h2>
          <p className="mt-1 text-sm text-slate-600">
            Students enrolled in courses assigned to you.
          </p>
        </div>
        <StudentsDirectory students={[]} />
      </div>
    );
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      course: { select: { id: true, code: true, title: true } },
      studentProfile: {
        include: {
          institutionUser: {
            include: { user: { select: { id: true, fullName: true, email: true } } },
          },
          attendance: {
            where: { session: { course: { lecturerProfileId: lecturerProfile.id } } },
            select: { id: true },
          },
        },
      },
    },
  });

  const userIds = [
    ...new Set(enrollments.map((e) => e.studentProfile.institutionUser.user.id)),
  ];

  const submissions =
    userIds.length > 0
      ? await prisma.assignmentSubmission.findMany({
          where: {
            userId: { in: userIds },
            assignment: { courseId: { in: courseIds } },
          },
          select: { userId: true, grade: true },
        })
      : [];

  const byStudent = new Map<
    string,
    {
      id: string;
      fullName: string;
      email: string;
      studentNumber: string | null;
      courses: Map<string, { id: string; code: string; title: string }>;
      attendanceCount: number;
      submissionCount: number;
      grades: number[];
    }
  >();

  for (const e of enrollments) {
    const sp = e.studentProfile;
    const u = sp.institutionUser.user;
    let row = byStudent.get(sp.id);
    if (!row) {
      row = {
        id: sp.id,
        fullName: u.fullName,
        email: u.email,
        studentNumber: sp.studentNumber,
        courses: new Map(),
        attendanceCount: sp.attendance.length,
        submissionCount: 0,
        grades: [],
      };
      byStudent.set(sp.id, row);
    }
    row.courses.set(e.course.id, e.course);
  }

  const userToStudent = new Map(
    enrollments.map((e) => [e.studentProfile.institutionUser.user.id, e.studentProfile.id]),
  );

  for (const sub of submissions) {
    const studentId = userToStudent.get(sub.userId);
    if (!studentId) continue;
    const row = byStudent.get(studentId);
    if (!row) continue;
    row.submissionCount += 1;
    if (sub.grade != null) row.grades.push(sub.grade);
  }

  const students = [...byStudent.values()]
    .map((s) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      studentNumber: s.studentNumber,
      courses: [...s.courses.values()],
      attendanceCount: s.attendanceCount,
      submissionCount: s.submissionCount,
      gradedAvg: s.grades.length
        ? s.grades.reduce((a, b) => a + b, 0) / s.grades.length
        : null,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">Students</h2>
        <p className="mt-1 text-sm text-slate-600">
          {students.length} student{students.length === 1 ? "" : "s"} across your courses.
        </p>
      </div>
      <StudentsDirectory students={students} />
    </div>
  );
}
