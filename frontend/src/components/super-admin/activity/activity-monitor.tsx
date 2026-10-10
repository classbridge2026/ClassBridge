"use client";

import { useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import { EmptyState } from "@/components/super-admin/shared/empty-state";
import { formatAuditAction } from "@/lib/audit/format";

export type ActivityRow = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  institutionName: string | null;
  metadata: string | null;
};

export function ActivityMonitor({ rows }: { rows: ActivityRow[] }) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const actions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.action))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (action !== "ALL" && row.action !== action) return false;
      if (!q) return true;
      return (
        row.action.toLowerCase().includes(q) ||
        row.resourceType.toLowerCase().includes(q) ||
        (row.actorName?.toLowerCase().includes(q) ?? false) ||
        (row.actorEmail?.toLowerCase().includes(q) ?? false) ||
        (row.institutionName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, query, action]);

  const selected = filtered.find((row) => row.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actor, action, institution…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          aria-label="Filter by action"
        >
          <option value="ALL">All actions</option>
          {actions.map((value) => (
            <option key={value} value={value}>
              {formatAuditAction(value)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-8 w-8" />}
          title={rows.length === 0 ? "No activity recorded yet" : "No matching activity"}
          description={
            rows.length === 0
              ? "Privileged Super Admin actions will appear here automatically."
              : "Try changing your search or filters."
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      selectedId === row.id ? "bg-blue-50/70" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {row.actorName ?? "System"} · {formatAuditAction(row.action)}
                      </p>
                      <span className="text-[11px] font-medium text-slate-400">
                        {new Date(row.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {row.resourceType}
                      {row.institutionName ? ` · ${row.institutionName}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Activity details</h3>
            {!selected ? (
              <p className="mt-3 text-sm text-slate-500">Select an activity record to inspect it.</p>
            ) : (
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-400">Actor</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {selected.actorName ?? "System"}
                  </dd>
                  <dd className="text-xs text-slate-500">{selected.actorEmail ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-400">Action</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {formatAuditAction(selected.action)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-400">Target</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{selected.resourceType}</dd>
                  <dd className="break-all text-xs text-slate-500">{selected.resourceId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-400">Institution</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {selected.institutionName ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-400">Timestamp</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {new Date(selected.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-400">Result</dt>
                  <dd className="mt-1 font-semibold text-emerald-700">Recorded</dd>
                </div>
                {selected.metadata ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-400">Metadata</dt>
                    <dd className="mt-1 overflow-x-auto rounded-xl bg-slate-50 p-3 font-mono text-[11px] text-slate-600">
                      {selected.metadata}
                    </dd>
                  </div>
                ) : null}
              </dl>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
