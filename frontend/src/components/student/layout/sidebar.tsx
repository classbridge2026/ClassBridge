"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { STUDENT_NAV } from "@/components/student/layout/nav-config";
import { submitLogout } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

function NavSection({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed?: boolean;
  children: ReactNode;
}) {
  if (collapsed) return <>{children}</>;
  return (
    <div className="space-y-1 pt-3">
      <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      {children}
    </div>
  );
}

export function StudentSidebar({
  institutionName,
  collapsed,
  onToggleCollapsed,
  onNavigate,
  className,
}: {
  institutionName: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  const dashboard = STUDENT_NAV.find((item) => item.exact);
  const learning = STUDENT_NAV.filter((item) => item.group === "Learning");
  const academic = STUDENT_NAV.filter((item) => item.group === "Academic");
  const communication = STUDENT_NAV.filter((item) => item.group === "Communication");
  const account = STUDENT_NAV.filter((item) => item.group === "Account");

  function renderItem(item: (typeof STUDENT_NAV)[number]) {
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
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            isActive ? "text-white" : "text-slate-400 group-hover:text-white",
          )}
        />
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
        {collapsed ? (
          <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block group-focus-visible:block">
            {item.label}
          </span>
        ) : null}
      </Link>
    );
  }

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
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-300">
            <Building2 className="h-3 w-3" />
            Student Campus
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-white">{institutionName}</p>
        </div>
      ) : null}

      <nav aria-label="Student" className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {dashboard ? renderItem(dashboard) : null}
        <NavSection label="Learning" collapsed={collapsed}>
          {learning.map(renderItem)}
        </NavSection>
        <NavSection label="Academic" collapsed={collapsed}>
          {academic.map(renderItem)}
        </NavSection>
        <NavSection label="Communication" collapsed={collapsed}>
          {communication.map(renderItem)}
        </NavSection>
        <NavSection label="Account" collapsed={collapsed}>
          {account.map(renderItem)}
        </NavSection>
      </nav>

      <div className="space-y-1 border-t border-white/10 p-2">
        <form action={submitLogout}>
          <button
            type="submit"
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
              collapsed && "justify-center px-2",
            )}
            aria-label="Logout"
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>Logout</span> : null}
          </button>
        </form>
        {onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
