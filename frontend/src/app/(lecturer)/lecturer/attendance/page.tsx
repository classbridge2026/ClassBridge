import type { Metadata } from "next";
import { requireRole } from "@/lib/permissions/rbac";
import { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ClipboardCheck, Users, CheckCircle2, Calendar, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Student Attendance — Lecturer Portal",
};

export default async function LecturerAttendancePage() {
  const user = await requireRole([RoleKey.LECTURER]);
  const activeMembershipId = user.activeMembership?.institutionUserId;

  if (!activeMembershipId) {
    return null;
  }

  const lecturerProfile = await prisma.lecturerProfile.findUnique({
    where: { institutionUserId: activeMembershipId },
  });

  const attendanceRecords = lecturerProfile
    ? await prisma.classAttendance.findMany({
        where: {
          session: {
            course: {
              lecturerProfileId: lecturerProfile.id,
            },
          },
        },
        include: {
          session: {
            include: {
              course: {
                select: {
                  code: true,
                  title: true,
                },
              },
            },
          },
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
        orderBy: { joinedAt: "desc" },
      })
    : [];

  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const attendanceRate =
    attendanceRecords.length > 0
      ? Math.round((presentCount / attendanceRecords.length) * 100)
      : 100;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-emerald-600" />
          <span>Student Attendance Management</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor automated WebRTC room attendance logs for your assigned courses at {user.activeMembership?.institutionName}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Class Attendance</span>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{attendanceRate}%</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Logged Sessions</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{attendanceRecords.length}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Students Attended</span>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{presentCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span>Recent Class Session Attendance Logs</span>
        </h2>

        {attendanceRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 italic">
            No student attendance recorded for your assigned courses yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Course</th>
                  <th className="px-3 py-2.5">Student Name</th>
                  <th className="px-3 py-2.5">Matrix ID</th>
                  <th className="px-3 py-2.5">Duration</th>
                  <th className="px-3 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {attendanceRecords.map((rec) => {
                  const studentName = rec.studentProfile.institutionUser.user.fullName;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-3 py-3 text-slate-900">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(rec.joinedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {rec.session.course.code}: {rec.session.course.title}
                      </td>
                      <td className="px-3 py-3 text-slate-900 font-bold">{studentName}</td>
                      <td className="px-3 py-3 font-mono text-slate-600">
                        {rec.studentProfile.studentNumber || "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {rec.durationMinutes} mins
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {rec.status}
                        </span>
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
  );
}
