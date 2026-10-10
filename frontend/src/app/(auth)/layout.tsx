import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Sparkles, ShieldCheck, GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-slate-50">
      {/* Left Column: CLASSBRIDGE Visual Hero Branding */}
      <section className="hidden flex-col justify-between bg-slate-950 p-12 text-white lg:flex relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 h-96 w-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-96 w-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Logo markClassName="bg-blue-600 text-white shadow-lg" showText={true} />
          </Link>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>CLASSBRIDGE PLATFORM</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            Connect. Learn. Teach.
          </h1>

          <p className="text-base text-slate-300 leading-relaxed">
            Multi-institution digital education platform. Securely connects administrators, lecturers, and students inside isolated campus tenants.
          </p>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 text-xs text-slate-300 space-y-2 backdrop-blur-md">
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Multi-Tenant Architecture</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Transit College is Tenant Zero. Data isolation is strictly enforced across all institutions.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-900">
          <span className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-blue-400" />
            <span>ClassBridge EdTech Engine</span>
          </span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </section>

      {/* Right Column: Form Container */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white relative">
        <div className="mb-8 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
