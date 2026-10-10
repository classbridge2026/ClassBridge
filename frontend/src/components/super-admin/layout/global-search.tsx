"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Building2, Loader2, Search, Users, X } from "lucide-react";
import {
  searchSuperAdmin,
  type SuperAdminSearchResult,
} from "@/features/super-admin/search-actions";
import { cn } from "@/lib/utils";

export function SuperAdminGlobalSearch({ className }: { className?: string }) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SuperAdminSearchResult>({
    institutions: [],
    users: [],
  });
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ institutions: [], users: [] });
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const data = await searchSuperAdmin(query);
        setResults(data);
        setOpen(true);
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const hasResults = results.institutions.length > 0 || results.users.length > 0;
  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-xl", className)}>
      <label htmlFor="super-admin-search" className="sr-only">
        Search institutions and users
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="super-admin-search"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder="Search institutions, users…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="h-10 w-full rounded-full border border-slate-200 bg-[#F1F6FB] pl-10 pr-10 text-sm text-slate-900 outline-none ring-blue-600/30 transition focus:border-blue-300 focus:bg-white focus:ring-2"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          {isPending ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-6 text-sm text-slate-500">
              No matches for “{query.trim()}”.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.institutions.length > 0 ? (
                <div className="px-2 pb-2">
                  <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Institutions
                  </p>
                  {results.institutions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/super-admin/institutions/${item.id}`}
                      role="option"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50"
                    >
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-slate-900">{item.name}</span>
                        <span className="block truncate text-xs text-slate-500">{item.slug}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}

              {results.users.length > 0 ? (
                <div className="px-2 pb-2">
                  <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Users
                  </p>
                  {results.users.map((item) => (
                    <Link
                      key={item.id}
                      href={
                        item.isPlatformSuperAdmin
                          ? `/super-admin/platform-users/${item.id}`
                          : `/super-admin/users/${item.id}`
                      }
                      role="option"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50"
                    >
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-slate-900">
                          {item.fullName}
                        </span>
                        <span className="block truncate text-xs text-slate-500">{item.email}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
