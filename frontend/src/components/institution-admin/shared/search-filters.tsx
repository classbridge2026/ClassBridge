"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";

export function SearchFilters({
  placeholder = "Search…",
  statusOptions,
  extraFilters,
}: {
  placeholder?: string;
  statusOptions?: { value: string; label: string }[];
  extraFilters?: { name: string; label: string; options: { value: string; label: string }[] }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end ${pending ? "opacity-70" : ""}`}>
      <label className="relative min-w-0 flex-1 space-y-1.5 text-xs">
        <span className="font-semibold text-slate-600">Search</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            defaultValue={params.get("q") ?? ""}
            onChange={(e) => update("q", e.target.value)}
            placeholder={placeholder}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </span>
      </label>

      {statusOptions ? (
        <label className="space-y-1.5 text-xs sm:w-40">
          <span className="font-semibold text-slate-600">Status</span>
          <select
            defaultValue={params.get("status") ?? ""}
            onChange={(e) => update("status", e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">All</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {extraFilters?.map((filter) => (
        <label key={filter.name} className="space-y-1.5 text-xs sm:w-48">
          <span className="font-semibold text-slate-600">{filter.label}</span>
          <select
            defaultValue={params.get(filter.name) ?? ""}
            onChange={(e) => update(filter.name, e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">All</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) {
    return total > 0 ? (
      <p className="text-xs text-slate-500">{total} result{total === 1 ? "" : "s"}</p>
    ) : null;
  }

  function go(nextPage: number) {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(nextPage));
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
      <p>
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
