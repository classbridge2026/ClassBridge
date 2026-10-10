"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitChangePassword, type ProfileFormState } from "@/features/profile/actions";
import { Lock, CheckCircle2, AlertTriangle } from "lucide-react";

const initialState: ProfileFormState | null = null;

export function PasswordForm() {
  const [state, action, pending] = useActionState(submitChangePassword, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state?.ok && state.message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{state.message}</span>
        </div>
      ) : null}

      {state?.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 font-medium flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="currentPassword" className="text-slate-900 font-semibold text-sm">
          Current Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            aria-invalid={Boolean(state?.fieldErrors?.currentPassword)}
            className="h-11 pl-10 rounded-lg border-slate-300 focus:border-blue-600 focus:ring-blue-600"
          />
        </div>
        {state?.fieldErrors?.currentPassword ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.currentPassword}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-slate-900 font-semibold text-sm">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            aria-invalid={Boolean(state?.fieldErrors?.newPassword)}
            className="h-11 pl-10 rounded-lg border-slate-300 focus:border-blue-600 focus:ring-blue-600"
          />
        </div>
        {state?.fieldErrors?.newPassword ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.newPassword}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-slate-900 font-semibold text-sm">
          Confirm New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            aria-invalid={Boolean(state?.fieldErrors?.confirmPassword)}
            className="h-11 pl-10 rounded-lg border-slate-300 focus:border-blue-600 focus:ring-blue-600"
          />
        </div>
        {state?.fieldErrors?.confirmPassword ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.confirmPassword}</p>
        ) : null}
      </div>

      <Button type="submit" className="h-10 px-5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white" disabled={pending}>
        {pending ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}
