import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/permissions/rbac";
import { AccountStatusBadge } from "@/components/shared/account-status-badge";
import { ProfileForm } from "@/features/profile/profile-form";
import { PasswordForm } from "@/features/profile/password-form";
import { User, Mail, Shield, Building2, Lock, Camera } from "lucide-react";

export const metadata: Metadata = {
  title: "Account Profile & Settings — ClassBridge",
};

export default async function ProfilePage() {
  const sessionUser = await requireAuthUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      memberships: {
        include: {
          institution: true,
          role: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white shadow-md border-2 border-white">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
              <Camera className="h-3 w-3" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AccountStatusBadge status={user.status === "ACTIVE" ? "ACTIVE" : "PENDING"} />
              {user.isPlatformSuperAdmin && (
                <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  <Shield className="h-3 w-3 text-blue-600" />
                  Super Admin
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">{user.fullName}</h1>
            <p className="text-xs font-mono text-slate-500">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Left Column: Profile Info & Memberships */}
        <div className="md:col-span-7 space-y-6">
          <div className="academic-card p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span>Personal Information</span>
            </h2>
            <ProfileForm initialFullName={user.fullName} initialPhone={user.phone} />
          </div>

          <div className="academic-card p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>Institution Memberships</span>
            </h2>
            <div className="space-y-3">
              {user.memberships.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{m.institution.name}</p>
                    <p className="text-[11px] text-slate-500">Role: <strong className="text-blue-700">{m.role.name}</strong></p>
                  </div>
                  <AccountStatusBadge status={m.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Security & Password */}
        <div className="md:col-span-5 space-y-6">
          <div className="academic-card p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-600" />
              <span>Security &amp; Password</span>
            </h2>
            <PasswordForm />
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-950 space-y-1">
            <p className="font-bold text-blue-900 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-blue-600" />
              Account Verification
            </p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Email address is managed by your campus administrator or platform Super Admin.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
