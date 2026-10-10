import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { ArrowLeft, KeyRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Reset Password — ClassBridge",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700 mb-2">
          <KeyRound className="h-3.5 w-3.5 text-blue-600" />
          <span>Secure Tokenized Reset</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Set new password</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Choose a strong password with at least 8 characters to secure your ClassBridge account.
        </p>
      </div>

      {!token ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Note: This page expects a valid reset token in the URL. You can test form fields below.
        </div>
      ) : null}

      <div className="pt-2">
        <ResetPasswordForm token={token} />
      </div>

      <div className="pt-4 border-t border-slate-200">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Login</span>
        </Link>
      </div>
    </div>
  );
}
