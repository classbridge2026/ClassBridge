import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/permissions/rbac";
import { RoleKey } from "@prisma/client";
import { Settings, Building2, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings — Campus Admin",
};

export default async function AdminSettingsPage() {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;

  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
  });

  if (!institution) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-slate-700" />
            <span>Campus Configuration</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Institution settings and tenancy parameters for {institution.name}.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="academic-card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span>Campus Tenant Details</span>
          </h2>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Institution Name</span>
              <span className="font-bold text-slate-900">{institution.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Tenant Slug</span>
              <span className="font-mono text-blue-700 font-bold">{institution.slug}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Timezone</span>
              <span className="font-mono text-slate-800">{institution.timezone}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Tenant Status</span>
              <span className="font-semibold text-emerald-700">{institution.status}</span>
            </div>
          </div>
        </div>

        <div className="academic-card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Security &amp; Isolation Rules</span>
          </h2>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Multi-Tenant Guard</span>
              <span className="font-mono text-emerald-700 font-bold">Server Enforced</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Data Scoping</span>
              <span className="font-mono text-blue-700">{institution.id}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Administrator</span>
              <span className="font-semibold text-slate-900">{user.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
