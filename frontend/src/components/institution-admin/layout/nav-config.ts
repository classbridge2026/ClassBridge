import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Shield,
  Building2,
  BookMarked,
  BookOpen,
  Calendar,
  BarChart3,
  Activity,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type InstAdminNavItem = {
  href: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
  group?: string;
};

export const INST_ADMIN_NAV: InstAdminNavItem[] = [
  {
    href: "/institution-admin",
    label: "Dashboard",
    title: "Dashboard",
    description: "Institution command center and academic overview.",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/institution-admin/students",
    label: "Students",
    title: "Students",
    description: "Manage student accounts and academic placement.",
    icon: GraduationCap,
    group: "People",
  },
  {
    href: "/institution-admin/lecturers",
    label: "Lecturers",
    title: "Lecturers",
    description: "Manage faculty and teaching assignments.",
    icon: Users,
    group: "People",
  },
  {
    href: "/institution-admin/administrators",
    label: "Administrators",
    title: "Administrators",
    description: "Manage Institution Admins and campus officers.",
    icon: Shield,
    group: "People",
  },
  {
    href: "/institution-admin/departments",
    label: "Departments",
    title: "Departments",
    description: "Organize academic departments and faculty.",
    icon: Building2,
    group: "Academic",
  },
  {
    href: "/institution-admin/programs",
    label: "Programs",
    title: "Programs",
    description: "Create and manage academic programs.",
    icon: BookMarked,
    group: "Academic",
  },
  {
    href: "/institution-admin/courses",
    label: "Courses",
    title: "Courses",
    description: "Manage courses, lecturers, and enrollments.",
    icon: BookOpen,
    group: "Academic",
  },
  {
    href: "/institution-admin/classes",
    label: "Classes",
    title: "Classes",
    description: "Schedule and monitor institution class sessions.",
    icon: Calendar,
    group: "Academic",
  },
  {
    href: "/institution-admin/reports",
    label: "Reports",
    title: "Reports",
    description: "Institution analytics and exportable reports.",
    icon: BarChart3,
  },
  {
    href: "/institution-admin/activity",
    label: "Activity",
    title: "Activity",
    description: "Audit trail of institution actions.",
    icon: Activity,
  },
  {
    href: "/institution-admin/settings",
    label: "Settings",
    title: "Settings",
    description: "Institution profile and campus preferences.",
    icon: Settings,
  },
];

export function getInstAdminPageMeta(
  pathname: string,
): Pick<InstAdminNavItem, "title" | "description"> {
  const exact = INST_ADMIN_NAV.find((item) => item.exact && pathname === item.href);
  if (exact) return { title: exact.title, description: exact.description };

  const match = INST_ADMIN_NAV.find(
    (item) => !item.exact && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  if (match) return { title: match.title, description: match.description };

  return {
    title: "Institution Admin",
    description: "Manage your ClassBridge institution.",
  };
}
