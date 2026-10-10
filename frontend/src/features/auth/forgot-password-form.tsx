"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  submitForgotPassword,
  type AuthFormState,
} from "@/features/auth/actions";
import { Mail, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useActionAlerts } from "@/hooks/use-action-alerts";

const initialState: AuthFormState | null = null;

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    submitForgotPassword,
    initialState,
  );
  useActionAlerts(state, {
    successTitle: "Check your email",
    errorTitle: "Could not start reset",
  });

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-900 font-semibold text-sm">
          Registered Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="e.g. user@institution.edu"
            required
            aria-invalid={Boolean(state?.fieldErrors?.email)}
            aria-describedby={
              state?.fieldErrors?.email ? "email-error" : undefined
            }
            className="h-11 pl-10 rounded-lg border-slate-300 focus:border-blue-600 focus:ring-blue-600"
          />
        </div>
        {state?.fieldErrors?.email ? (
          <p id="email-error" className="text-xs font-semibold text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{state.fieldErrors.email}</span>
          </p>
        ) : null}
      </div>

      {state?.ok && state.message ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 font-medium flex items-start gap-2 animate-fade-in"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>{state.message}</p>
        </div>
      ) : null}

      {state?.error ? (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 font-medium flex items-start gap-2 animate-fade-in"
          role="status"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Password Reset</p>
            <p className="mt-0.5">{state.error}</p>
          </div>
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full h-11 text-base font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        disabled={pending}
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <span>Checking email…</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>Send Reset Link</span>
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </form>
  );
}
