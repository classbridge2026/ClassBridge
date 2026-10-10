"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { getPageMeta } from "@/components/super-admin/layout/nav-config";
import { SuperAdminGlobalSearch } from "@/components/super-admin/layout/global-search";
import {
  SuperAdminNotificationsMenu,
  type HeaderNotification,
} from "@/components/super-admin/layout/notifications-menu";
import {
  SuperAdminProfileMenu,
  type SuperAdminProfile,
} from "@/components/super-admin/layout/profile-menu";

export function SuperAdminHeader({
  profile,
  notifications,
  unreadCount,
  onOpenMobileNav,
}: {
  profile: SuperAdminProfile;
  notifications: HeaderNotification[];
  unreadCount: number;
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {meta.title}
            </h1>
            <p className="hidden truncate text-sm text-slate-500 sm:block">{meta.description}</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block md:w-[20rem] lg:w-[24rem] xl:w-[28rem]">
              <SuperAdminGlobalSearch />
            </div>
            <SuperAdminNotificationsMenu
              initialNotifications={notifications}
              unreadCount={unreadCount}
            />
            <SuperAdminProfileMenu profile={profile} />
          </div>
        </div>

        <div className="md:hidden">
          <SuperAdminGlobalSearch />
        </div>
      </div>
    </header>
  );
}
