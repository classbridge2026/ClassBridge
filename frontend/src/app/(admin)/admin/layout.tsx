import type { ReactNode } from "react";
import { requireRole } from "@/lib/permissions/rbac";
import { RoleKey } from "@prisma/client";
import { submitLogout } from "@/features/auth/actions";
import { Logo } from "@/components/shared/logo";
import { AdminNavLinks } from "@/components/layout/admin-nav-links";
import { LogOut, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const activeInstitutionName = user.activeMembership?.institutionName || "Institution Admin";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col lg:justify-between p-5">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Logo markClassName="bg-blue-600 text-white" />
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Active Campus Tenant
            </p>
            <p className="text-xs font-bold text-blue-950 truncate">{activeInstitutionName}</p>
          </div>

          <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Campus Management
          </div>

          <AdminNavLinks />
        </div>

        {/* Footer Session User Info */}
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <form action={submitLogout} className="w-full">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs h-9"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-500" />
              <span>Logout</span>
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content Surface */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Logo showText={false} />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>{activeInstitutionName} Console</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">{user.fullName}</p>
              <p className="text-[10px] text-slate-500">Institution Administrator</p>
            </div>
            <form action={submitLogout} className="lg:hidden">
              <Button type="submit" variant="secondary" size="sm" className="h-8 text-xs">
                Logout
              </Button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
