"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { getLecturerPageMeta } from "@/components/lecturer/layout/nav-config";
import { LecturerProfileMenu } from "@/components/lecturer/layout/profile-menu";

export function LecturerHeader({
  profile,
  unreadNotifications = 0,
  onOpenMobileNav,
}: {
  profile: { fullName: string; email: string; avatarInitials: string; roleLabel: string };
  unreadNotifications?: number;
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const meta = getLecturerPageMeta(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">{meta.title}</h1>
          <p className="hidden truncate text-xs text-slate-500 sm:block">{meta.description}</p>
        </div>

        <Link
          href="/lecturer/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={
            unreadNotifications > 0
              ? `Notifications, ${unreadNotifications} unread`
              : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {unreadNotifications > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          ) : null}
        </Link>

        <LecturerProfileMenu profile={profile} />
      </div>
    </header>
  );
}
