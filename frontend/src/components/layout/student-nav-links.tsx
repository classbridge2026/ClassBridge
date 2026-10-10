"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/student/courses", label: "My Courses", icon: BookOpen },
  { href: "/student/live-classes", label: "Live Classes", icon: Video },
  { href: "/student/schedule", label: "Class Schedule", icon: CalendarDays },
  { href: "/student/recordings", label: "Recordings", icon: Film },
  { href: "/student/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/student/results", label: "Results", icon: BarChart3 },
  { href: "/student/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/student/progress", label: "Progress", icon: TrendingUp },
  { href: "/student/messages", label: "Messages", icon: MessageSquare },
  { href: "/student/notifications", label: "Notifications", icon: Bell },
  { href: "/student/profile", label: "Profile", icon: User },
  { href: "/student/settings", label: "Settings", icon: Settings },
];

/** Flat student nav (legacy). Prefer StudentSidebar in the student shell. */
export function StudentNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Student">
      {links.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-500")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
