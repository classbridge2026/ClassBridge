import "server-only";
import { prisma } from "@/lib/db/prisma";
import { AttendanceStatus, SessionStatus } from "@prisma/client";

export async function getInstitutionAnalytics(institutionId: string) {
  const [
    studentCount,
    lecturerCount,
    courseCount,
    sessionCount,
    liveSessions,
    completedSessions,
    attendanceTotal,
    presentCount,
    lateCount,
    absentCount,
    recordingCount,
    materialCount,
    assignmentCount,
    assessmentCount,
    enrollmentCount,
  ] = await Promise.all([
    prisma.studentProfile.count({ where: { institutionId } }),
    prisma.lecturerProfile.count({ where: { institutionId } }),
    prisma.course.count({ where: { institutionId } }),
    prisma.classSession.count({ where: { institutionId } }),
    prisma.classSession.count({
      where: { institutionId, status: SessionStatus.LIVE },
    }),
    prisma.classSession.count({
      where: { institutionId, status: SessionStatus.COMPLETED },
    }),
    prisma.classAttendance.count({
      where: { session: { institutionId } },
    }),
    prisma.classAttendance.count({
      where: { session: { institutionId }, status: AttendanceStatus.PRESENT },
    }),
    prisma.classAttendance.count({
      where: { session: { institutionId }, status: AttendanceStatus.LATE },
    }),
    prisma.classAttendance.count({
      where: { session: { institutionId }, status: AttendanceStatus.ABSENT },
    }),
    prisma.classRecording.count({
      where: { session: { institutionId } },
    }),
    prisma.learningMaterial.count({ where: { institutionId } }),
    prisma.assignment.count({ where: { institutionId } }),
    prisma.assessment.count({ where: { institutionId } }),
    prisma.courseEnrollment.count({
      where: { course: { institutionId } },
    }),
  ]);

  const attendanceRate =
    attendanceTotal === 0
      ? 0
      : Math.round(((presentCount + lateCount) / attendanceTotal) * 100);

  const courses = await prisma.course.findMany({
    where: { institutionId },
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      _count: {
        select: {
          enrollments: true,
          sessions: true,
          materials: true,
          assignments: true,
        },
      },
    },
    orderBy: { code: "asc" },
    take: 20,
  });

  return {
    totals: {
      students: studentCount,
      lecturers: lecturerCount,
      courses: courseCount,
      sessions: sessionCount,
      liveSessions,
      completedSessions,
      recordings: recordingCount,
      materials: materialCount,
      assignments: assignmentCount,
      assessments: assessmentCount,
      enrollments: enrollmentCount,
      attendanceRecords: attendanceTotal,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      attendanceRate,
    },
    courses,
  };
}

export async function getPlatformAnalytics() {
  const [
    institutions,
    activeInstitutions,
    users,
    students,
    lecturers,
    courses,
    sessions,
    subscriptions,
  ] = await Promise.all([
    prisma.institution.count(),
    prisma.institution.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.studentProfile.count(),
    prisma.lecturerProfile.count(),
    prisma.course.count(),
    prisma.classSession.count(),
    prisma.subscription.groupBy({
      by: ["planKey", "status"],
      _count: true,
    }),
  ]);

  return {
    institutions,
    activeInstitutions,
    users,
    students,
    lecturers,
    courses,
    sessions,
    subscriptions,
  };
}
