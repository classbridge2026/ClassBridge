import type { Metadata } from "next";
import { Building2, GraduationCap, Mail, Phone, User } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";
import { ProfileForm } from "@/features/profile/profile-form";

export const metadata: Metadata = {
  title: "Profile — Student Portal",
};

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export default async function StudentProfilePage() {
  const { user, studentProfile, institutionName } = await requireStudentContext();

  const [dbUser, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true, email: true, phone: true },
    }),
    prisma.studentProfile.findUnique({
      where: { id: studentProfile.id },
      include: {
        department: { select: { name: true } },
        program: { select: { name: true } },
        enrollments: {
          include: {
            course: { select: { id: true, code: true, title: true } },
          },
          orderBy: { enrolledAt: "desc" },
        },
      },
    }),
  ]);

  const fullName = dbUser?.fullName ?? user.fullName;
  const email = dbUser?.email ?? user.email;
  const phone = dbUser?.phone ?? null;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
        <p className="mt-1 text-sm text-slate-600">
          Your student identity at {institutionName}.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2563EB] text-xl font-bold text-white">
          {initials(fullName)}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900">{fullName}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {email}
            </span>
            {phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {phone}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {institutionName}
            </span>
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <User className="h-4 w-4 text-[#2563EB]" />
            Account details
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Name and phone used across ClassBridge. Email is managed by your institution.
          </p>
          <div className="mt-4">
            <ProfileForm initialFullName={fullName} initialPhone={phone} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <GraduationCap className="h-4 w-4 text-[#2563EB]" />
            Academic profile
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Student ID</dt>
              <dd className="font-mono font-bold text-slate-900">
                {profile?.studentNumber || "—"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Program</dt>
              <dd className="font-semibold text-slate-900">{profile?.program?.name || "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Department</dt>
              <dd className="font-semibold text-slate-900">
                {profile?.department?.name || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Institution</dt>
              <dd className="font-semibold text-slate-900">{institutionName}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Program, department, and student ID are managed by campus administrators.
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Enrolled courses</h3>
        {profile?.enrollments.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">No course enrollments yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {profile?.enrollments.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  <span className="font-mono text-xs font-bold text-[#2563EB]">
                    {e.course.code}
                  </span>{" "}
                  <span className="font-semibold text-slate-900">{e.course.title}</span>
                </span>
                <a
                  href={`/student/courses/${e.course.id}`}
                  className="text-xs font-bold text-[#2563EB] hover:underline"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
