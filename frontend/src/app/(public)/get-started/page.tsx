import type { Metadata } from "next";
import { MarketingPageHeader, TextLink } from "@/components/shared/marketing";
import { ShieldCheck, UserPlus, CalendarPlus, Video } from "lucide-react";

export const metadata: Metadata = {
  title: "Get Started",
};

const onboardingSteps = [
  {
    step: "1",
    title: "Platform Provisioning",
    description: "A ClassBridge Super Admin provisions the institution tenant record (Transit College is Tenant Zero) and creates the primary Institution Admin.",
    icon: ShieldCheck,
  },
  {
    step: "2",
    title: "Faculty & Student Onboarding",
    description: "The Institution Admin logs in and populates the campus directory with Lecturers and Students.",
    icon: UserPlus,
  },
  {
    step: "3",
    title: "Course Creation & Enrollment",
    description: "Courses are assigned to primary lecturers, and students are enrolled into their respective course rosters.",
    icon: CalendarPlus,
  },
  {
    step: "4",
    title: "Live Teaching & Recording Rewatch",
    description: "Lecturers schedule and start WebRTC live classes; students join from their dashboard and rewatch published recordings.",
    icon: Video,
  },
];

export default function GetStartedPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <MarketingPageHeader
        eyebrow="Onboarding Guide"
        title="How institutions join ClassBridge"
        description="ClassBridge is built for multi-tenant scalability. Institution onboarding follows a structured, admin-guided flow rather than open self-registration."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {onboardingSteps.map((item) => {
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
            </div>
          );
        })}
      </div>

      <div className="mt-12 rounded-xl border border-blue-100 bg-blue-50/70 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-blue-950">Already have active account credentials?</h3>
          <p className="text-xs text-blue-800 mt-1">
            Log in to access your Super Admin, Admin, Lecturer, or Student portal.
          </p>
        </div>
        <TextLink href="/login">Go to Login Page</TextLink>
      </div>
    </main>
  );
}
