import type { Metadata } from "next";
import { MarketingPageHeader, TextLink } from "@/components/shared/marketing";
import { FileText, Database, Shield, Code, Server, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Resources & Architecture",
};

const documentationCards = [
  {
    title: "Product Requirements",
    description: "Detailed specification of platform roles, permissions, multi-tenancy, and module boundaries.",
    path: "docs/PRODUCT_REQUIREMENTS.md",
    icon: FileText,
  },
  {
    title: "Product Map",
    description: "Surface map for Super Admin, Institution Admin, Lecturer, Student, and Live Virtual Classroom.",
    path: "docs/PRODUCT_MAP.md",
    icon: BookOpen,
  },
  {
    title: "Technical Architecture",
    description: "Full-stack Next.js 16, PostgreSQL 16, Prisma ORM, LiveKit WebRTC, and S3-compatible storage strategy.",
    path: "docs/ARCHITECTURE.md",
    icon: Server,
  },
  {
    title: "Database Schema Specification",
    description: "Relational data model covering Institutions, Users, Roles, Enrollments, Sessions, Attendance, and Recordings.",
    path: "docs/DATABASE_SCHEMA.md",
    icon: Database,
  },
  {
    title: "Security & Tenancy Policies",
    description: "Tenant isolation rules, RBAC enforcement, session security, password hashing, and audit logging standards.",
    path: "docs/SECURITY.md",
    icon: Shield,
  },
  {
    title: "Development Roadmap",
    description: "23-phase implementation plan starting from project foundation to production hardening.",
    path: "docs/DEVELOPMENT_ROADMAP.md",
    icon: Code,
  },
];

export default function ResourcesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <MarketingPageHeader
        eyebrow="Documentation & Resources"
        title="Architecture specifications and contracts"
        description="ClassBridge documentation lives directly inside the codebase repository. We prioritize real architectural contracts over marketing placeholders."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {documentationCards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="academic-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{item.path}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900">Looking to bring an institution to ClassBridge?</h3>
          <p className="text-xs text-slate-600 mt-1">
            Review the onboarding workflow.
          </p>
        </div>
        <TextLink href="/get-started">View Onboarding Guide</TextLink>
      </div>
    </main>
  );
}
