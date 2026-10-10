"use client";

import { useActionState, useState } from "react";
import {
  updatePreferences,
  type NotificationFormState,
} from "@/features/notifications/actions";

const initial: NotificationFormState | null = null;

type Prefs = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  classReminders: boolean;
  announcements: boolean;
  assignments: boolean;
  messages: boolean;
};

const LABELS: { key: keyof Prefs; label: string; hint: string }[] = [
  { key: "emailEnabled", label: "Email notifications", hint: "Receive important updates by email." },
  { key: "inAppEnabled", label: "In-app notifications", hint: "Show alerts in the lecturer portal." },
  { key: "classReminders", label: "Class reminders", hint: "Upcoming and starting class notices." },
  { key: "announcements", label: "Campus announcements", hint: "Institution-wide faculty notices." },
  { key: "assignments", label: "Assignment activity", hint: "Submission and grading related alerts." },
  { key: "messages", label: "Message alerts", hint: "New private message notifications." },
];

export function LecturerNotificationPrefsForm({ initialPrefs }: { initialPrefs: Prefs }) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [state, action, pending] = useActionState(updatePreferences, initial);

  return (
    <form action={action} className="space-y-4">
      {LABELS.map((item) => (
        <div key={item.key} className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{item.label}</p>
            <p className="text-xs text-slate-500">{item.hint}</p>
          </div>
          <input type="hidden" name={item.key} value={prefs[item.key] ? "true" : "false"} />
          <button
            type="button"
            role="switch"
            aria-checked={prefs[item.key]}
            aria-label={item.label}
            onClick={() => setPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              prefs[item.key] ? "bg-[#2563EB]" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                prefs[item.key] ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      ))}

      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state?.ok && state.message ? (
        <p className="text-xs text-emerald-600">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
