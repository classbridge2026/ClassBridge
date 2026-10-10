import type { Metadata } from "next";
import { MarketingPageHeader, TextLink } from "@/components/shared/marketing";
import { BookOpen, PlayCircle, Clock, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "For Students",
};

const studentFeatures = [
  {
    title: "Enrolled Course Dashboard",
    description: "View courses you are currently enrolled in, course schedules, and lecturer information.",
    icon: BookOpen,
  },
  {
    title: "Join Live Virtual Classroom",
    description: "Join live class sessions, participate in chat, listen to the lecturer, and raise your hand.",
    icon: Clock,
  },
  {
    title: "On-Demand Video Recordings",
    description: "Access published recordings from past classes to rewatch lectures and review course material.",
    icon: PlayCircle,
  },
  {
    title: "Attendance & Verification",
    description: "Your session duration and attendance are automatically logged when participating in live sessions.",
    icon: CheckCircle,
  },
];

export default function ForStudentsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <MarketingPageHeader
        eyebrow="For Students"
        title="Connect, learn, and rewatch published lectures"
        description="Join enrolled live classes, rewatch published recordings on demand, and follow course progress."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {studentFeatures.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="academic-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900">Already have student login credentials?</h3>
          <p className="text-xs text-slate-600 mt-1">
            Sign in using your email address or student identifier.
          </p>
        </div>
        <TextLink href="/login">Go to Login</TextLink>
      </div>
    </main>
  );
}
