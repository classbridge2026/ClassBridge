import type { Metadata } from "next";
import { ClipboardCheck, CheckCircle2, Calendar, Clock, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";

export const metadata: Metadata = {
  title: "Attendance — Student Portal",
};

export default async function StudentAttendancePage() {
  const { studentProfile, institutionName } = await requireStudentContext();

  const attendanceRecords = await prisma.classAttendance.findMany({
    where: { studentProfileId: studentProfile.id },
    include: {
      session: {
        include: {
          course: {
            select: { code: true, title: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const lateCount = attendanceRecords.filter((a) => a.status === "LATE").length;
  const absentCount = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const attended = presentCount + lateCount;
  const attendanceRate =
    attendanceRecords.length > 0
      ? Math.round((attended / attendanceRecords.length) * 100)
      : null;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <ClipboardCheck className="h-6 w-6 text-emerald-600" />
          Attendance
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Live-session attendance logs for your courses at {institutionName}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Attendance rate
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {attendanceRate == null ? "—" : `${attendanceRate}%`}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Present
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{presentCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Late</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{lateCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Absent
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{absentCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Attendance history</h3>

        {attendanceRecords.length === 0 ? (
          <div className="py-10 text-center">
            <ClipboardCheck className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-900">No attendance records yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Joining a live class records your attendance automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Course</th>
                  <th className="px-3 py-2.5">Class</th>
                  <th className="px-3 py-2.5">Joined</th>
                  <th className="px-3 py-2.5">Left</th>
                  <th className="px-3 py-2.5">Duration</th>
                  <th className="px-3 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {attendanceRecords.map((rec) => (
                  <tr key={rec.id} className="transition hover:bg-slate-50/80">
                    <td className="px-3 py-3 text-slate-900">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(rec.joinedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {rec.session.course.code}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{rec.session.title}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {new Date(rec.joinedAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {rec.leftAt
                        ? new Date(rec.leftAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {rec.durationMinutes} mins
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          rec.status === "PRESENT"
                            ? "text-emerald-600"
                            : rec.status === "LATE"
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {rec.status === "ABSENT" ? (
                          <AlertCircle className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
