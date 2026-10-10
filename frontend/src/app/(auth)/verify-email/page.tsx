import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CircleAlert } from "lucide-react";
import { verifyEmailWithToken } from "@/lib/auth/email-verification";

export const metadata: Metadata = {
  title: "Verify Email — ClassBridge",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token
    ? await verifyEmailWithToken(token)
    : { ok: false, error: "Missing verification token. Use the link from your email." };

  return (
    <div className="space-y-6">
      <div>
        <div
          className={`mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            result.ok
              ? "border-teal-200 bg-teal-50 text-teal-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {result.ok ? (
            <BadgeCheck className="h-3.5 w-3.5" />
          ) : (
            <CircleAlert className="h-3.5 w-3.5" />
          )}
          <span>{result.ok ? "Email verified" : "Verification needed"}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {result.ok ? "You're verified" : "Could not verify email"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {result.ok ? result.message : result.error}
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
        >
          Continue to login
        </Link>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
