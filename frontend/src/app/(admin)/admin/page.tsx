import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/permissions/rbac";
import { RoleKey } from "@prisma/client";
import { AccountStatusBadge } from "@/components/shared/account-status-badge";
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Radio,
  ClipboardCheck,
  Video,
  Building2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Institution Admin Dashboard — ClassBridge",
};

export default async function AdminDashboardPage() {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;
  const institutionName = user.activeMembership?.institutionName || "Institution";

  if (!institutionId) {
    return (
      <div className="p-8 text-center text-slate-600">
        No active institution membership associated with your administrator account.
      </div>
    );
  }

  const [
    studentCount,
    lecturerCount,
    activeCourseCount,
    upcomingClassCount,
    liveSessionCount,
    attendanceCount,
    recordingCount,
    campusMemberships,
  ] = await Promise.all([
    prisma.studentProfile.count({ where: { institutionId } }),
    prisma.lecturerProfile.count({ where: { institutionId } }),
    prisma.course.count({ where: { institutionId, status: "ACTIVE" } }),
    prisma.classSession.count({ where: { institutionId, status: "SCHEDULED" } }),
    prisma.classSession.count({ where: { institutionId, status: "LIVE" } }),
    prisma.classAttendance.count({
      where: { session: { institutionId } },
    }),
    prisma.classRecording.count({
      where: { session: { institutionId } },
    }),
    prisma.institutionUser.findMany({
      where: { institutionId },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        role: true,
      },
    }),
  ]);

  const cards = [
    {
      title: "Campus Students",
      value: studentCount,
      description: "Enrolled student profiles",
      icon: GraduationCap,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Campus Lecturers",
      value: lecturerCount,
      description: "Teaching faculty profiles",
      icon: Users,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Active Courses",
      value: activeCourseCount,
      description: "Published campus courses",
      icon: BookOpen,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      title: "Upcoming Classes",
      value: upcomingClassCount,
      description: "Scheduled classroom sessions",
      icon: Calendar,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      title: "Live WebRTC Sessions",
      value: liveSessionCount,
      description: "Active virtual classrooms",
      icon: Radio,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
    {
      title: "Attendance Snapshots",
      value: attendanceCount,
      description: "Verified participation logs",
      icon: ClipboardCheck,
      color: "text-teal-600 bg-teal-50 border-teal-100",
    },
    {
      title: "Campus Recordings",
      value: recordingCount,
      description: "Saved lecture recordings",
      icon: Video,
      color: "text-rose-600 bg-rose-50 border-rose-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              {institutionName} Campus Tenant
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Campus Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back, <span className="font-semibold text-slate-900">{user.fullName}</span>. Overview of students, faculty, and academic activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Manage Students</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="academic-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{card.title}</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">{card.value}</span>
              </div>
              <p className="text-[11px] text-slate-500">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Directory Snapshot & Recent Campus Members */}
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>Recent Campus Members</span>
            </h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3">Campus Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {campusMemberships.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{m.user.fullName}</p>
                      <p className="text-[10px] font-mono text-slate-500">{m.user.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                        {m.role.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <AccountStatusBadge status={m.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[11px] text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tenant Security & Policy Status */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Campus Policy &amp; Security</span>
          </h2>

          <div className="academic-card p-5 space-y-4 text-xs">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-950 space-y-1">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Tenant Scoping Active
              </p>
              <p className="text-[11px] text-emerald-800 leading-normal">
                Your campus data is strictly isolated to <strong>{institutionName}</strong> at the database level.
              </p>
            </div>

            <div className="space-y-2 pt-1 text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Institution ID</span>
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]">{institutionId}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Role Authorization</span>
                <span className="font-semibold text-slate-900">INSTITUTION_ADMIN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
