"use client";

import { useActionState } from "react";
import {
  submitUpdateLecturerProfile,
  type LecturerActionState,
} from "@/features/lecturer/actions";

const initial: LecturerActionState | null = null;

export function LecturerFacultyForm({
  initialTitle,
  initialBio,
}: {
  initialTitle: string;
  initialBio: string;
}) {
  const [state, action, pending] = useActionState(submitUpdateLecturerProfile, initial);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state?.ok && state.message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          {state.message}
        </p>
      ) : null}
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
          {state.error}
        </p>
      ) : null}

      <label className="block text-xs font-semibold text-slate-700">
        Title
        <input
          name="title"
          defaultValue={initialTitle}
          placeholder="e.g. Dr, Prof"
          aria-invalid={Boolean(state?.fieldErrors?.title)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        {state?.fieldErrors?.title ? (
          <span className="mt-1 block text-xs text-red-600">{state.fieldErrors.title}</span>
        ) : null}
      </label>

      <label className="block text-xs font-semibold text-slate-700">
        Bio
        <textarea
          name="bio"
          rows={5}
          defaultValue={initialBio}
          placeholder="Brief teaching background and research interests…"
          aria-invalid={Boolean(state?.fieldErrors?.bio)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        {state?.fieldErrors?.bio ? (
          <span className="mt-1 block text-xs text-red-600">{state.fieldErrors.bio}</span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save faculty profile"}
      </button>
    </form>
  );
}
