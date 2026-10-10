import type { Metadata } from "next";
import { MarketingPageHeader, TextLink } from "@/components/shared/marketing";
import { Calendar, Video, CircleDot, FileCheck, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "For Lecturers",
};

const steps = [
  {
    step: "1",
    title: "Schedule & View Today's Classes",
    description: "Access assigned courses from your dashboard, set start times, and view enrolled student rosters.",
    icon: Calendar,
  },
  {
    step: "2",
    title: "Start Class via WebRTC",
    description: "Initialize LiveKit classroom sessions securely after server-side authorization verifies your ownership.",
    icon: Video,
  },
  {
    step: "3",
    title: "Interactive Live Teaching",
    description: "Share screen, toggle microphone/camera, monitor raised hands, and engage through live classroom chat.",
    icon: FileCheck,
  },
  {
    step: "4",
    title: "Explicit Recording & Publishing",
    description: "Recordings are never silent. Explicitly start recording, review the output, and publish for student rewatches.",
    icon: CircleDot,
  },
];

export default function ForLecturersPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <MarketingPageHeader
        eyebrow="For Lecturers"
        title="Teach live classes with role-scoped tools"
        description="Lecturers work inside assigned courses: schedule a class, start it when it is time, optionally record, and publish recordings for enrolled students."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.step} className="academic-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {item.step}
                  </div>
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.description}</p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Server Enforced</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Want to learn more about the platform?</h3>
        <p className="mt-1 text-sm text-slate-600">
          See how ClassBridge supports teaching across institutions.
        </p>
        <div className="mt-4">
          <TextLink href="/platform">Explore Platform</TextLink>
        </div>
      </div>
    </main>
  );
}
