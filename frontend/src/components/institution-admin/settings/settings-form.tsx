"use client";

import { useActionState } from "react";
import { updateInstitutionSettingsAction } from "@/features/institution-admin/settings-actions";
import { Field, TextAreaField } from "@/components/institution-admin/shared/form-dialog";
import { Button } from "@/components/ui/button";

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
};

export function InstitutionSettingsForm({ values }: { values: InstitutionSettingsValues }) {
  const [state, formAction, pending] = useActionState(updateInstitutionSettingsAction, null);

  return (
    <form action={formAction} className="space-y-6">
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

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{state.error}</p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
