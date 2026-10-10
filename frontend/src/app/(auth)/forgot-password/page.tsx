import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Forgot Password — ClassBridge",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Forgot password?</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Enter your registered institution email address. Reset instructions will be sent securely if an active account is matched.
        </p>
      </div>

      <div className="pt-2">
        <ForgotPasswordForm />
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
