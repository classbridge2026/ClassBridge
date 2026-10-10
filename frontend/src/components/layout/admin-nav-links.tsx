"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Video,
  ClipboardCheck,
  BarChart3,
  Bell,
  Settings,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/lecturers", label: "Lecturers", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/classes", label: "Classes", icon: Calendar },
  { href: "/admin/recordings", label: "Recordings", icon: Video },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {links.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

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
