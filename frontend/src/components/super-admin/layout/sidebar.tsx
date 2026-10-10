"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { SUPER_ADMIN_NAV } from "@/components/super-admin/layout/nav-config";
import { cn } from "@/lib/utils";

export function SuperAdminSidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  className,
}: {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-slate-800/80 bg-[#0F172A] text-slate-100 transition-[width] duration-200",
        collapsed ? "w-[4.5rem]" : "w-64",
        className,
      )}
    >
      <div className={cn("flex items-center gap-2 px-4 py-5", collapsed && "justify-center px-2")}>
        <Logo showText={false} size="sm" />
        {!collapsed ? (
          <span className="font-black tracking-tight uppercase text-sm">
            <span className="text-white">CLASS</span>
            <span className="text-blue-400">BRIDGE</span>
          </span>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="mx-3 mb-4 rounded-xl bg-gradient-to-br from-[#1E3A5F] to-[#0F172A] px-3 py-3 ring-1 ring-white/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-300">
            Control Center
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Platform-wide administration for ClassBridge.
          </p>
        </div>
      ) : null}

      <nav aria-label="Super Admin" className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {SUPER_ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-[#2563EB] text-white shadow-lg shadow-blue-900/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
              {collapsed ? (
                <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block group-focus-visible:block">
                  {item.label}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {onToggleCollapsed ? (
        <div className="border-t border-white/10 p-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        </div>
      ) : null}
    </aside>
  );
}
