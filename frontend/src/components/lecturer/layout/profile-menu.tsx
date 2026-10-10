"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, Shield, User } from "lucide-react";
import { submitLogout } from "@/features/auth/actions";

export function LecturerProfileMenu({
  profile,
}: {
  profile: { fullName: string; email: string; avatarInitials: string; roleLabel: string };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white">
          {profile.avatarInitials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-xs font-bold text-slate-900">{profile.fullName}</span>
          <span className="block truncate text-[10px] text-slate-500">{profile.roleLabel}</span>
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <User className="h-4 w-4 text-[#2563EB]" />
              {profile.fullName}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">{profile.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/lecturer/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <User className="h-4 w-4 text-slate-500" />
              Profile
            </Link>
            <Link
              href="/lecturer/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              Settings
            </Link>
            <Link
              href="/lecturer/settings#security"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Shield className="h-4 w-4 text-slate-500" />
              Security
            </Link>
          </div>
          <form action={submitLogout} className="border-t border-slate-100">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
