import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CalendarDays,
  Users,
  ClipboardList,
  Video,
  Film,
  MessageSquare,
  Bell,
  User,
  Settings,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export type LecturerNavItem = {
  href: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
  group?: string;
};

export const LECTURER_NAV: LecturerNavItem[] = [
  {
    href: "/lecturer",
    label: "Dashboard",
    title: "Dashboard",
    description: "Your teaching command center for today and upcoming sessions.",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/lecturer/courses",
    label: "My Courses",
    title: "My Courses",
    description: "Courses assigned to you as primary lecturer.",
    icon: BookOpen,
    group: "Teaching",
  },
  {
    href: "/lecturer/classes",
    label: "My Classes",
    title: "My Classes",
    description: "Scheduled, live, and completed class sessions.",
    icon: Calendar,
    group: "Teaching",
  },
  {
    href: "/lecturer/schedule",
    label: "Schedule",
    title: "Schedule",
    description: "Calendar view of your teaching sessions.",
    icon: CalendarDays,
    group: "Teaching",
  },
  {
    href: "/lecturer/students",
    label: "Students",
    title: "Students",
    description: "Students enrolled in your courses.",
    icon: Users,
    group: "Teaching",
  },
  {
    href: "/lecturer/assignments",
    label: "Assignments",
    title: "Assignments",
    description: "Create, publish, and grade course assignments.",
    icon: ClipboardList,
  },
  {
    href: "/lecturer/live-classes",
    label: "Live Classes",
    title: "Live Classes",
    description: "Start and manage live virtual classrooms.",
    icon: Video,
  },
  {
    href: "/lecturer/recordings",
    label: "Recordings",
    title: "Recordings",
    description: "Review and manage recordings from your classes.",
    icon: Film,
  },
  {
    href: "/lecturer/attendance",
    label: "Attendance",
    title: "Attendance",
    description: "Live-session attendance for your classes.",
    icon: ClipboardCheck,
  },
  {
    href: "/lecturer/messages",
    label: "Messages",
    title: "Messages",
    description: "Conversations with students and campus staff.",
    icon: MessageSquare,
  },
  {
    href: "/lecturer/notifications",
    label: "Notifications",
    title: "Notifications",
    description: "Class reminders, submissions, and campus notices.",
    icon: Bell,
  },
  {
    href: "/lecturer/profile",
    label: "Profile",
    title: "Profile",
    description: "Your faculty profile and contact details.",
    icon: User,
  },
  {
    href: "/lecturer/settings",
    label: "Settings",
    title: "Settings",
    description: "Account security and notification preferences.",
    icon: Settings,
  },
];

export function getLecturerPageMeta(
  pathname: string,
): Pick<LecturerNavItem, "title" | "description"> {
  const exact = LECTURER_NAV.find((item) => item.exact && pathname === item.href);
  if (exact) return { title: exact.title, description: exact.description };

  const match = [...LECTURER_NAV]
    .filter((item) => !item.exact)
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  if (match) return { title: match.title, description: match.description };

  return {
    title: "Lecturer Portal",
    description: "Teach, schedule, and manage your ClassBridge classes.",
  };
}
