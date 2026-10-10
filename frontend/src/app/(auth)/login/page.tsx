import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";
import { AccountStatusBadge } from "@/components/shared/account-status-badge";

export const metadata: Metadata = {
  title: "Login — ClassBridge",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AccountStatusBadge status="ACTIVE" showIcon={false} />
          <span className="text-[11px] text-slate-500 font-medium">RBAC Authentication Scoped</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Enter the email address or student identifier associated with your institution account.
        </p>
      </div>

      <div className="pt-2">
        <LoginForm />
      </div>

      <div className="pt-4 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-600">
          Need a new campus tenant on ClassBridge?{" "}
          <Link href="/get-started" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            Read onboarding path
          </Link>
        </p>
      </div>
    </div>
  );
}
