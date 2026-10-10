import {
  LayoutDashboard,
  BookOpen,
  Video,
  CalendarDays,
  Film,
  ClipboardList,
  BarChart3,
  ClipboardCheck,
  TrendingUp,
  MessageSquare,
  Bell,
  User,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type StudentNavItem = {
  href: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
  group?: "Learning" | "Academic" | "Communication" | "Account";
};

export const STUDENT_NAV: StudentNavItem[] = [
  {
    href: "/student",
    label: "Dashboard",
    title: "Dashboard",
    description: "Your learning hub for today and upcoming classes.",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/student/courses",
    label: "My Courses",
    title: "My Courses",
    description: "Courses you are enrolled in at this campus.",
    icon: BookOpen,
    group: "Learning",
  },
  {
    href: "/student/live-classes",
    label: "Live Classes",
    title: "Live Classes",
    description: "Join live virtual classrooms for your courses.",
    icon: Video,
    group: "Learning",
  },
  {
    href: "/student/schedule",
    label: "Class Schedule",
    title: "Class Schedule",
    description: "Day, week, and month views of your classes.",
    icon: CalendarDays,
    group: "Learning",
  },
  {
    href: "/student/recordings",
    label: "Recordings",
    title: "Recordings",
    description: "Replay completed class recordings you can access.",
    icon: Film,
    group: "Learning",
  },
  {
    href: "/student/assignments",
    label: "Assignments",
    title: "Assignments",
    description: "View, submit, and track coursework deadlines.",
    icon: ClipboardList,
    group: "Learning",
  },
  {
    href: "/student/results",
    label: "Results",
    title: "Results",
    description: "Grades and feedback on your submitted work.",
    icon: BarChart3,
    group: "Academic",
  },
  {
    href: "/student/attendance",
    label: "Attendance",
    title: "Attendance",
    description: "Live-session attendance for your enrolled courses.",
    icon: ClipboardCheck,
    group: "Academic",
  },
  {
    href: "/student/progress",
    label: "Progress",
    title: "Progress",
    description: "Course completion and learning activity overview.",
    icon: TrendingUp,
    group: "Academic",
  },
  {
    href: "/student/messages",
    label: "Messages",
    title: "Messages",
    description: "Private conversations with lecturers and campus staff.",
    icon: MessageSquare,
    group: "Communication",
  },
  {
    href: "/student/notifications",
    label: "Notifications",
    title: "Notifications",
    description: "Class reminders, grades, and campus notices.",
    icon: Bell,
    group: "Communication",
  },
  {
    href: "/student/profile",
    label: "Profile",
    title: "Profile",
    description: "Your student identity and contact details.",
    icon: User,
    group: "Account",
  },
  {
    href: "/student/settings",
    label: "Settings",
    title: "Settings",
    description: "Security, notifications, and classroom preferences.",
    icon: Settings,
    group: "Account",
  },
];

export function getStudentPageMeta(
  pathname: string,
): Pick<StudentNavItem, "title" | "description"> {
  const exact = STUDENT_NAV.find((item) => item.exact && pathname === item.href);
  if (exact) return { title: exact.title, description: exact.description };

  const match = [...STUDENT_NAV]
    .filter((item) => !item.exact)
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  if (match) return { title: match.title, description: match.description };

  return {
    title: "Student Portal",
    description: "Learn, join classes, and track your academic progress.",
  };
}
