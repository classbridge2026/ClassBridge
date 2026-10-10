import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, ShieldCheck, GraduationCap, Building2, Users, ArrowRight } from "lucide-react";

const audiences = [
  {
    href: "/for-institutions",
    title: "For Institutions",
    icon: Building2,
    badge: "Tenant Isolation",
    body: "Manage lecturers, students, courses, and classes as an isolated tenant. Platform administration stays strictly separate from campus administration.",
  },
  {
    href: "/for-lecturers",
    title: "For Lecturers",
    icon: GraduationCap,
    badge: "Teaching Scoped",
    body: "Schedule classes, teach live via WebRTC, explicitly trigger recordings, and review automated participant attendance.",
  },
  {
    href: "/for-students",
    title: "For Students",
    icon: Users,
    badge: "Enrolled Only",
    body: "Join live classes for enrolled courses, rewatch published recordings on demand, and follow course progress.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 py-16 sm:py-24 gradient-hero-bg">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>ONLINE LEARNING, CONNECTED.</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.12]">
                Teach. Learn. Connect.
                <span className="block gradient-text mt-1">
                  All in one virtual classroom.
                </span>
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
                ClassBridge is a multi-institution education platform. Transit College is the first tenant. Live virtual classroom is integrated with courses, enrollment, attendance, and optional recording.
              </p>
              <div className="flex flex-col gap-3.5 sm:flex-row pt-2">
                <Link href="/get-started" className={cn(buttonVariants({ size: "lg" }), "h-12 px-7 text-base shadow-sm")}>
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/platform"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-12 px-7 text-base")}
                >
                  <span>Explore Platform</span>
                </Link>
              </div>
            </div>

            {/* Architectural Workflow Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  <span>Architecture & Tenancy Flow</span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-white">How ClassBridge Works</h3>
                <ol className="mt-5 space-y-4 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                    <span>Institution tenant is provisioned (Transit College is Tenant Zero)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
                    <span>Admins manage lecturers, students, and course enrollments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
                    <span>Lecturers schedule &amp; start LiveKit WebRTC sessions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">4</span>
                    <span>Students join live; optional recordings are reviewed &amp; published</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audiences Section */}
      <section id="platform" className="bg-white py-16 sm:py-24 border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Built for Every Institution
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Multi-tenant architecture from day one
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Each educational institution keeps its users, courses, classes, and recordings strictly isolated at the database level.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {audiences.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="academic-card group p-6 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {item.body}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                    <span>Learn more</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
