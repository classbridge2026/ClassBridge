"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { publicNav } from "@/components/shared/marketing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          {publicNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md px-1 py-0.5",
                  isActive
                    ? "font-semibold text-blue-600"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Login
          </Link>
          <Link
            href="/get-started"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {open ? (
        <div
          id="mobile-navigation"
          className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-2">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-700 hover:bg-slate-50",
                )}
                onClick={() => setOpen(false)}
              >
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-slate-100">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "md" }),
                  "w-full justify-center",
                )}
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/get-started"
                className={cn(
                  buttonVariants({ variant: "primary", size: "md" }),
                  "w-full justify-center",
                )}
                onClick={() => setOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
