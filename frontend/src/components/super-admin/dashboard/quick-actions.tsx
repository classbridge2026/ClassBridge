import Link from "next/link";
import { BarChart3, Building2, Plus, ShieldPlus, Users } from "lucide-react";

const ACTIONS = [
  {
    href: "/super-admin/institutions?action=create",
    label: "Add Institution",
    description: "Onboard a new campus tenant",
    icon: Plus,
  },
  {
    href: "/super-admin/institutions",
    label: "Manage Institutions",
    description: "Search, filter, and update campuses",
    icon: Building2,
  },
  {
    href: "/super-admin/users",
    label: "Manage Users",
    description: "Review users across institutions",
    icon: Users,
  },
  {
    href: "/super-admin/platform-users?action=create",
    label: "Add Platform User",
    description: "Create ClassBridge staff access",
    icon: ShieldPlus,
  },
  {
    href: "/super-admin/reports",
    label: "View Reports",
    description: "Open platform analytics",
    icon: BarChart3,
  },
];

export function DashboardQuickActions() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
        <p className="mt-1 text-xs text-slate-500">Jump into the most common platform tasks.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="group rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition group-hover:scale-105">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{action.label}</p>
              <p className="mt-1 text-xs text-slate-500">{action.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
