"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  submitResetPassword,
  type AuthFormState,
} from "@/features/auth/actions";
import { Lock, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

const initialState: AuthFormState | null = null;

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    submitResetPassword,
    initialState,
  );

  useEffect(() => {
    if (state?.ok && state.redirectUrl) {
      const timer = setTimeout(() => router.push(state.redirectUrl!), 1200);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token ?? ""} />

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-900 font-semibold text-sm">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            required
            aria-invalid={Boolean(state?.fieldErrors?.password)}
            aria-describedby={
              state?.fieldErrors?.password ? "password-error" : undefined
            }
            className="h-11 pl-10 rounded-lg border-slate-300 focus:border-blue-600 focus:ring-blue-600"
          />
        </div>
        {state?.fieldErrors?.password ? (
          <p id="password-error" className="text-xs font-semibold text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{state.fieldErrors.password}</span>
          </p>
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
            autoComplete="new-password"
            placeholder="••••••••••••"
            required
            aria-invalid={Boolean(state?.fieldErrors?.confirmPassword)}
            aria-describedby={
              state?.fieldErrors?.confirmPassword
                ? "confirm-password-error"
                : undefined
            }
            className="h-11 pl-10 rounded-lg border-slate-300 focus:border-blue-600 focus:ring-blue-600"
          />
        </div>
        {state?.fieldErrors?.confirmPassword ? (
          <p id="confirm-password-error" className="text-xs font-semibold text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{state.fieldErrors.confirmPassword}</span>
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
            <p className="font-bold">Reset Request</p>
            <p className="mt-0.5">{state.error}</p>
          </div>
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full h-11 text-base font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        disabled={pending || state?.ok}
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <span>Updating password…</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>Reset Password</span>
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </form>
  );
}
