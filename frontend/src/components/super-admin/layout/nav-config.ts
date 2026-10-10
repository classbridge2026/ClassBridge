import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  CreditCard,
  BarChart3,
  Activity,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type SuperAdminNavItem = {
  href: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const SUPER_ADMIN_NAV: SuperAdminNavItem[] = [
  {
    href: "/super-admin",
    label: "Dashboard",
    title: "Dashboard",
    description: "Monitor and manage the entire ClassBridge platform.",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/super-admin/institutions",
    label: "Institutions",
    title: "Institutions",
    description: "Create, review, and manage every campus tenant.",
    icon: Building2,
  },
  {
    href: "/super-admin/users",
    label: "Users",
    title: "Users",
    description: "Manage institution users across the platform.",
    icon: Users,
  },
  {
    href: "/super-admin/platform-users",
    label: "Platform Users",
    title: "Platform Users",
    description: "Administer ClassBridge platform staff accounts.",
    icon: Shield,
  },
  {
    href: "/super-admin/subscriptions",
    label: "Subscriptions & Licensing",
    title: "Subscriptions & Licensing",
    description: "Manage plans, seats, and licensing for institutions.",
    icon: CreditCard,
  },
  {
    href: "/super-admin/reports",
    label: "Reports",
    title: "Reports",
    description: "Platform analytics and operational reports.",
    icon: BarChart3,
  },
  {
    href: "/super-admin/activity",
    label: "Activity Monitor",
    title: "Activity Monitor",
    description: "Audit trail of privileged platform actions.",
    icon: Activity,
  },
  {
    href: "/super-admin/settings",
    label: "Settings",
    title: "Settings",
    description: "Configure platform-level Super Admin preferences.",
    icon: Settings,
  },
];

export function getPageMeta(pathname: string): Pick<SuperAdminNavItem, "title" | "description"> {
  const exact = SUPER_ADMIN_NAV.find((item) => item.exact && pathname === item.href);
  if (exact) return { title: exact.title, description: exact.description };

  const match = SUPER_ADMIN_NAV.find(
    (item) => !item.exact && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  if (match) return { title: match.title, description: match.description };

  return {
    title: "Super Admin",
    description: "ClassBridge platform control center.",
  };
}
