import type { Metadata } from "next";
import { requireFullInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { storageAdapter } from "@/lib/storage/adapter";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstitutionSettingsForm } from "@/components/institution-admin/settings/settings-form";

export const metadata: Metadata = {
  title: "Settings — Institution Admin",
};

export default async function SettingsPage() {
  const { institutionId } = await requireFullInstitutionAdmin();

  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: {
      name: true,
      email: true,
      phone: true,
      website: true,
      address: true,
      country: true,
      city: true,
      description: true,
      timezone: true,
      slug: true,
      status: true,
      logoStorageKey: true,
    },
  });

  if (!institution) {
    return (
      <p className="text-sm text-slate-600">
        You don&apos;t have permission to access this resource.
      </p>
    );
  }

  const logoUrl = institution.logoStorageKey
    ? storageAdapter.getFileUrl(institution.logoStorageKey)
    : null;

  return (
    <div className="space-y-6">
      <InstPageHeader
        title="Settings"
        description={`Institution profile and preferences for ${institution.name}.`}
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Slug:</span> {institution.slug}
        <span className="mx-2 text-slate-300">·</span>
        <span className="font-semibold text-slate-800">Status:</span> {institution.status}
      </div>

      <InstitutionSettingsForm
        values={{
          name: institution.name,
          email: institution.email,
          phone: institution.phone,
          website: institution.website,
          address: institution.address,
          country: institution.country,
          city: institution.city,
          description: institution.description,
          timezone: institution.timezone,
          logoUrl,
        }}
      />
    </div>
  );
}
