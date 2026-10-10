import type { Metadata } from "next";
import { MarketingPageHeader, TextLink } from "@/components/shared/marketing";
import { Building2, Shield, Users, Calendar, BarChart3, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "For Institutions",
};

const capabilities = [
  {
    title: "Isolated Tenant Database",
    description: "Your campus operates independently. Records, student numbers, and faculty assignments are strictly partitioned.",
    icon: Building2,
  },
  {
    title: "Faculty & Student Management",
    description: "Administrators can add, activate, suspend, or update lecturer profiles and student enrollments.",
    icon: Users,
  },
  {
    title: "Course & Schedule Governance",
    description: "Create courses, assign primary lecturers, and oversee active or upcoming class schedules.",
    icon: Calendar,
  },
  {
    title: "Attendance & Recording Control",
    description: "Review automated class attendance logs and audit published video recordings across all campus courses.",
    icon: BarChart3,
  },
  {
    title: "Institution Policies & Timezone",
    description: "Configure local institution timezone, attendance thresholds, and media policies.",
    icon: Settings,
  },
  {
    title: "Cross-Tenant Protection",
    description: "Campus administrators can never access or query data from another institution on ClassBridge.",
    icon: Shield,
  },
];

export default function ForInstitutionsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <MarketingPageHeader
        eyebrow="For Institutions"
        title="Run your campus with complete data isolation"
        description="Institution administrators manage students, lecturers, courses, classes, recordings, and reports for one organization."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="academic-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-12 rounded-xl border border-blue-100 bg-blue-50/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm font-medium text-blue-950">
          Institutions are provisioned by a ClassBridge Super Admin. Read the step-by-step path.
        </p>
        <TextLink href="/get-started">Read Onboarding Path</TextLink>
      </div>
    </main>
  );
}
