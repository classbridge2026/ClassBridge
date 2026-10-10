"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, User } from "lucide-react";
import { submitLogout } from "@/features/auth/actions";

export function InstitutionAdminProfileMenu({
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
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left transition hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
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
              <User className="h-4 w-4 text-blue-600" />
              {profile.fullName}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">{profile.email}</p>
          </div>
          <form action={submitLogout}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
