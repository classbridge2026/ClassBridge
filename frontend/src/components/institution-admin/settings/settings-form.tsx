"use client";

import { useActionState, useState } from "react";
import { updateInstitutionSettingsAction } from "@/features/institution-admin/settings-actions";
import { Field, TextAreaField } from "@/components/institution-admin/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { InstitutionLogoMark } from "@/components/shared/institution-logo-mark";
import { useActionAlerts } from "@/hooks/use-action-alerts";

export type InstitutionSettingsValues = {
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  description: string | null;
  timezone: string;
  logoUrl: string | null;
};

export function InstitutionSettingsForm({ values }: { values: InstitutionSettingsValues }) {
  const [state, formAction, pending] = useActionState(updateInstitutionSettingsAction, null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  useActionAlerts(state, { successTitle: "Settings saved", errorTitle: "Could not save settings" });

  const shownLogo = removeLogo ? null : preview ?? values.logoUrl;

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-6">
      {removeLogo ? <input type="hidden" name="removeLogo" value="1" /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Institution logo</h3>
        <p className="mt-1 text-xs text-slate-500">
          Shown on campus portals (admin, lecturer, student). Stored locally — no cloud storage
          required. PNG, JPG, WebP, or SVG · max 2 MB.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <InstitutionLogoMark
            name={values.name}
            logoUrl={shownLogo}
            tone="on-light"
            className="sm:items-center"
          />
          <div className="min-w-0 flex-1 space-y-3">
            <label className="block space-y-1.5 text-left text-xs">
              <span className="block font-semibold text-slate-700">Upload logo</span>
              <input
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={removeLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setPreview(null);
                    return;
                  }
                  setRemoveLogo(false);
                  setPreview(URL.createObjectURL(file));
                }}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
            </label>
            {values.logoUrl || preview ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setRemoveLogo(true);
                  setPreview(null);
                }}
              >
                Remove logo
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Institution profile</h3>
        <p className="mt-1 text-xs text-slate-500">Public campus identity and contact details.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Institution name" name="name" required defaultValue={values.name} />
          <Field label="Timezone" name="timezone" required defaultValue={values.timezone} />
          <Field label="Email" name="email" type="email" defaultValue={values.email} />
          <Field label="Phone" name="phone" defaultValue={values.phone} />
          <Field label="Website" name="website" defaultValue={values.website} />
          <Field label="Country" name="country" defaultValue={values.country} />
          <Field label="City" name="city" defaultValue={values.city} />
          <Field label="Address" name="address" defaultValue={values.address} />
          <div className="sm:col-span-2">
            <TextAreaField label="Description" name="description" defaultValue={values.description} rows={4} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Academic settings</h3>
        <p className="mt-1 text-xs text-slate-500">
          Academic structure is managed under Departments, Programs, Courses, and Classes.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Security</h3>
        <p className="mt-1 text-xs text-slate-500">
          Institution data is scoped to your campus membership. Password resets for campus users are
          available from student, lecturer, and administrator detail screens.
        </p>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
