"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { SuperAdminSidebar } from "@/components/super-admin/layout/sidebar";
import { SuperAdminHeader } from "@/components/super-admin/layout/header";
import type { HeaderNotification } from "@/components/super-admin/layout/notifications-menu";
import type { SuperAdminProfile } from "@/components/super-admin/layout/profile-menu";
import { cn } from "@/lib/utils";

export function SuperAdminShell({
  profile,
  notifications,
  unreadCount,
  children,
}: {
  profile: SuperAdminProfile;
  notifications: HeaderNotification[];
  unreadCount: number;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <SuperAdminSidebar
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((value) => !value)}
          />
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-slate-900/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[min(18rem,85vw)] transform transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="relative h-full">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SuperAdminSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <SuperAdminHeader
          profile={profile}
          notifications={notifications}
          unreadCount={unreadCount}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
