import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Building2, Mail, Phone, User } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";
import { ProfileForm } from "@/features/profile/profile-form";
import { LecturerFacultyForm } from "@/features/lecturer/faculty-form";

export const metadata: Metadata = {
  title: "Profile — Lecturer Portal",
};

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "LC";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export default async function LecturerProfilePage() {
  const { user, lecturerProfile, institutionName, institutionId } =
    await requireLecturerContext();

  const [dbUser, profile, courses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true, email: true, phone: true },
    }),
    prisma.lecturerProfile.findUnique({
      where: { id: lecturerProfile.id },
      include: {
        department: { select: { name: true } },
      },
    }),
    prisma.course.findMany({
      where: { lecturerProfileId: lecturerProfile.id, institutionId },
      select: { id: true, code: true, title: true },
      orderBy: { code: "asc" },
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
          Your faculty identity at {institutionName}.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2563EB] text-xl font-bold text-white">
          {initials(fullName)}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900">
            {profile?.title ? `${profile.title} ` : ""}
            {fullName}
          </p>
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
              {profile?.department?.name ?? institutionName}
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
          <p className="mt-1 text-xs text-slate-500">Name and phone used across ClassBridge.</p>
          <div className="mt-4">
            <ProfileForm initialFullName={fullName} initialPhone={phone} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Faculty profile</h3>
          <p className="mt-1 text-xs text-slate-500">
            Title and bio visible to students and campus staff.
          </p>
          <div className="mt-4">
            <LecturerFacultyForm
              initialTitle={profile?.title ?? ""}
              initialBio={profile?.bio ?? ""}
            />
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <BookOpen className="h-4 w-4 text-[#2563EB]" />
          Assigned courses
        </h3>
        {courses.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">No courses assigned yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {courses.map((course) => (
              <li key={course.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold text-[#2563EB]">{course.code}</p>
                  <p className="truncate text-sm font-semibold text-slate-900">{course.title}</p>
                </div>
                <Link
                  href={`/lecturer/courses/${course.id}`}
                  className="shrink-0 text-xs font-bold text-[#2563EB] hover:underline"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Need to change password or notifications?{" "}
        <Link href="/lecturer/settings" className="font-semibold text-[#2563EB] hover:underline">
          Open settings
        </Link>
      </p>
    </div>
  );
}
