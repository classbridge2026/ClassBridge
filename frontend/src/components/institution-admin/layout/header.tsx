"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { getInstAdminPageMeta } from "@/components/institution-admin/layout/nav-config";
import { InstitutionAdminProfileMenu } from "@/components/institution-admin/layout/profile-menu";

export function InstitutionAdminHeader({
  profile,
  onOpenMobileNav,
}: {
  profile: { fullName: string; email: string; avatarInitials: string; roleLabel: string };
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const meta = getInstAdminPageMeta(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">{meta.title}</h1>
          <p className="hidden truncate text-xs text-slate-500 sm:block">{meta.description}</p>
        </div>

        <InstitutionAdminProfileMenu profile={profile} />
      </div>
    </header>
  );
}
