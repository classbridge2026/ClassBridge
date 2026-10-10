"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, KeyRound, LogOut, Settings, UserRound } from "lucide-react";
import { submitLogout } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

export type SuperAdminProfile = {
  fullName: string;
  email: string;
  avatarInitials: string;
  roleLabel: string;
};

export function SuperAdminProfileMenu({ profile }: { profile: SuperAdminProfile }) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A] text-xs font-bold text-white">
          {profile.avatarInitials}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[9rem] truncate text-xs font-semibold text-slate-900">
            {profile.fullName}
          </span>
          <span className="block text-[10px] text-slate-500">{profile.roleLabel}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl"
        >
          <div className="border-b border-slate-100 px-3 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{profile.fullName}</p>
            <p className="truncate text-xs text-slate-500">{profile.email}</p>
          </div>

          <Link
            href="/super-admin/settings?section=profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <UserRound className="h-4 w-4 text-slate-400" />
            My Profile
          </Link>
          <Link
            href="/super-admin/settings?section=account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            Account Settings
          </Link>
          <Link
            href="/super-admin/settings?section=security"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <KeyRound className="h-4 w-4 text-slate-400" />
            Security
          </Link>

          <form action={submitLogout} className="border-t border-slate-100 p-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
