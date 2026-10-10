import type { Metadata } from "next";
import { BarChart3, Users, BookOpen, Video, ClipboardCheck } from "lucide-react";
import { RoleKey } from "@prisma/client";
import { requireRole } from "@/lib/permissions/rbac";
import { getInstitutionAnalytics } from "@/services/analytics";

export const metadata: Metadata = {
  title: "Reports — Campus Admin",
};

export default async function AdminReportsPage() {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;

  if (!institutionId) {
    return null;
  }

  const analytics = await getInstitutionAnalytics(institutionId);
  const t = analytics.totals;

  const cards = [
    { label: "Students", value: t.students, icon: Users },
    { label: "Courses", value: t.courses, icon: BookOpen },
    { label: "Sessions", value: t.sessions, icon: Video },
    { label: "Attendance rate", value: `${t.attendanceRate}%`, icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Campus Analytics &amp; Reports
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Live metrics for {user.activeMembership?.institutionName}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">Learning activity</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Materials</dt>
              <dd className="font-semibold text-slate-900">{t.materials}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Assignments</dt>
              <dd className="font-semibold text-slate-900">{t.assignments}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Assessments</dt>
              <dd className="font-semibold text-slate-900">{t.assessments}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Recordings</dt>
              <dd className="font-semibold text-slate-900">{t.recordings}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Enrollments</dt>
              <dd className="font-semibold text-slate-900">{t.enrollments}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Lecturers</dt>
              <dd className="font-semibold text-slate-900">{t.lecturers}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">Attendance breakdown</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Present</dt>
              <dd className="font-semibold text-emerald-700">{t.present}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Late</dt>
              <dd className="font-semibold text-amber-700">{t.late}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Absent</dt>
              <dd className="font-semibold text-red-700">{t.absent}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Live sessions</dt>
              <dd className="font-semibold text-slate-900">{t.liveSessions}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Completed sessions</dt>
              <dd className="font-semibold text-slate-900">{t.completedSessions}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Courses</h2>
        {analytics.courses.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No courses yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-2 py-2">Code</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Enrollments</th>
                  <th className="px-2 py-2">Sessions</th>
                  <th className="px-2 py-2">Materials</th>
                  <th className="px-2 py-2">Assignments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.courses.map((c) => (
                  <tr key={c.id}>
                    <td className="px-2 py-2 font-semibold text-slate-900">{c.code}</td>
                    <td className="px-2 py-2 text-slate-700">{c.title}</td>
                    <td className="px-2 py-2">{c._count.enrollments}</td>
                    <td className="px-2 py-2">{c._count.sessions}</td>
                    <td className="px-2 py-2">{c._count.materials}</td>
                    <td className="px-2 py-2">{c._count.assignments}</td>
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
