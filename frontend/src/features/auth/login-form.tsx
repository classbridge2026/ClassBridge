"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitLogin, type AuthFormState } from "@/features/auth/actions";
import { Lock, Mail, AlertTriangle, ShieldCheck, KeyRound } from "lucide-react";
import { showError, toUserMessage } from "@/lib/ui/swal";

const initialState: AuthFormState | null = null;

const seedAccounts = [
  { label: "Super Admin", email: "superadmin@classbridge.local", role: "Platform Super Admin" },
  { label: "Transit Admin", email: "admin@transit.local", role: "Transit College Admin" },
  { label: "Admin Officer", email: "admin-officer@transit.local", role: "Transit Admin Officer" },
  { label: "Exam Officer", email: "exam-officer@transit.local", role: "Transit Exam Officer" },
  { label: "Finance Officer", email: "finance-officer@transit.local", role: "Transit Finance Officer" },
  { label: "Transit Lecturer", email: "lecturer@transit.local", role: "Transit College Lecturer" },
  { label: "Transit Student", email: "student@transit.local", role: "Transit College Student" },
  { label: "Riverside Admin", email: "admin@riverside.local", role: "Riverside Inst. Admin" },
];

export function LoginForm() {
  const [state, action, pending] = useActionState(submitLogin, initialState);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.redirectUrl) {
      router.push(state.redirectUrl);
      return;
    }
    if (state && !state.ok && state.error) {
      void showError(toUserMessage(state.error), "Sign-in failed");
    }
  }, [state, router]);

  const selectSeedAccount = (email: string) => {
    setEmailInput(email);
    setPasswordInput("ClassBridge!dev1");
  };

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-5" noValidate>
        {/* Email or Student ID Input */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-900 font-semibold text-sm flex items-center justify-between">
            <span>Email or Student ID</span>
            <span className="text-[11px] font-normal text-slate-500">Universal Login</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="email"
              name="email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              autoComplete="email"
              placeholder="e.g. student@transit.local"
              required
              aria-invalid={Boolean(state?.fieldErrors?.email)}
              aria-describedby={state?.fieldErrors?.email ? "email-error" : "email-help"}
              className="h-11 pl-10 rounded-lg border-slate-300 focus:border-blue-600 focus:ring-blue-600"
            />
          </div>
          <p id="email-help" className="text-xs text-slate-500">
            Enter your registered email address or institutional student identifier.
          </p>
          {state?.fieldErrors?.email ? (
            <p id="email-error" className="text-xs font-semibold text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{state.fieldErrors.email}</span>
            </p>
          ) : null}
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-slate-900 font-semibold text-sm">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="password"
              name="password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••••••"
              required
              aria-invalid={Boolean(state?.fieldErrors?.password)}
              aria-describedby={state?.fieldErrors?.password ? "password-error" : undefined}
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

        {/* General Auth Error Alert */}
        {state?.error ? (
          <div
            className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 font-medium flex items-start gap-2 animate-fade-in"
            role="status"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Authentication Alert</p>
              <p className="mt-0.5">{state.error}</p>
            </div>
          </div>
        ) : null}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 text-base font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          disabled={pending}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Logging in…</span>
            </span>
          ) : (
            <span>Login</span>
          )}
        </Button>
      </form>

      {/* Development Seed Accounts Helper Panel */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-xs text-blue-900 space-y-3">
        <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
          <span className="font-bold uppercase tracking-wider text-blue-800 text-[10px] flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            Development Seed Presets
          </span>
          <span className="text-[10px] font-mono text-blue-700 flex items-center gap-1">
            <KeyRound className="h-3 w-3" />
            ClassBridge!dev1
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {seedAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => selectSeedAccount(acc.email)}
              className="text-left rounded-lg border border-blue-200 bg-white p-2 hover:border-blue-500 hover:bg-blue-50/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
            >
              <p className="font-bold text-slate-900 text-[11px]">{acc.label}</p>
              <p className="font-mono text-[10px] text-blue-700 truncate">{acc.email}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
