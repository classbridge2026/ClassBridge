"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitAnnouncement, type NotificationFormState } from "./actions";

const initialState: NotificationFormState | null = null;

export function AnnouncementForm() {
  const [state, action, pending] = useActionState(submitAnnouncement, initialState);

  return (
    <form
      action={action}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
      noValidate
    >
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Send campus announcement</h2>
          <p className="text-xs text-slate-500">
            Delivers an in-app notification to all active campus members.
          </p>
        </div>
      </div>

      {state?.ok && state.message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{state.message}</span>
        </div>
      ) : null}

      {state?.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
          Title
        </Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g. Mid-semester schedule update"
          className="h-10 border-slate-300 text-slate-900 focus:border-blue-600"
        />
        {state?.fieldErrors?.title ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.title}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body" className="text-xs font-semibold text-slate-700">
          Message
        </Label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          placeholder="Write the announcement for students, lecturers, and staff…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />
        {state?.fieldErrors?.body ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.body}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-10 bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {pending ? "Sending…" : "Send announcement"}
      </Button>
    </form>
  );
}
