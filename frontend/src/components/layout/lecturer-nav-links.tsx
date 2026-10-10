"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Bell,
  User,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/lecturer", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/lecturer/courses", label: "Assigned Courses", icon: BookOpen },
  { href: "/lecturer/classes", label: "Virtual Lectures", icon: Calendar },
  { href: "/lecturer/attendance", label: "Student Attendance", icon: ClipboardCheck },
  { href: "/lecturer/messages", label: "Messages", icon: MessageSquare },
  { href: "/lecturer/notifications", label: "Faculty Notices", icon: Bell },
  { href: "/profile", label: "My Profile", icon: User },
];

export function LecturerNavLinks() {
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
