import type { Metadata } from "next";
import { MarketingPageHeader, TextLink } from "@/components/shared/marketing";
import { Building2, ShieldCheck, Users, Layers, Lock, Cpu } from "lucide-react";

export const metadata: Metadata = {
  title: "Platform Overview",
};

export default function PlatformPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <MarketingPageHeader
        eyebrow="Platform Architecture"
        title="One platform, isolated institutions"
        description="ClassBridge is built as a multi-tenant education system. Each institution has isolated users, courses, classes, attendance, and video recordings."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article className="academic-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Multi-Tenancy Scoping</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Every database query evaluates institution ownership on the server side. Campus data is strictly isolated across tenants.
          </p>
        </article>

        <article className="academic-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Role-Based Access Control</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Platform Super Admins, Institution Admins, Lecturers, and Students each operate inside server-enforced role shells.
          </p>
        </article>

        <article className="academic-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
            <Cpu className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">LiveKit WebRTC Classroom</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Real-time video, audio, screen share, classroom chat, and hand-raising powered by integrated WebRTC infrastructure.
          </p>
        </article>

        <article className="academic-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
            <Layers className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Explicit Recording Workflow</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Recordings require explicit lecturer initialization. Video streams process to object storage and require lecturer review before publication.
          </p>
        </article>

        <article className="academic-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Automated Attendance</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Attendance tracks join/leave timestamps and duration per session rather than inferring presence from enrollment alone.
          </p>
        </article>

        <article className="academic-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Security & Privacy First</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            HttpOnly session cookies, AES-GCM encryption, Zod input validation, and password hashing via bcryptjs.
          </p>
        </article>
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Ready to learn more?</h3>
          <p className="text-sm text-slate-600 mt-1">
            Read about the onboarding path or view technical resources.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TextLink href="/get-started">Get Started Guide</TextLink>
          <TextLink href="/resources">Resources</TextLink>
        </div>
      </div>
    </main>
  );
}
