import Link from "next/link";
import { Activity } from "lucide-react";
import { EmptyState } from "@/components/super-admin/shared/empty-state";
import { formatAuditAction } from "@/lib/audit/format";
import type { RecentAuditRow } from "@/services/audit";

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function DashboardRecentActivity({ rows }: { rows: RecentAuditRow[] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Recent Platform Activity</h2>
          <p className="mt-1 text-xs text-slate-500">Latest audit events from the platform.</p>
        </div>
        <Link
          href="/super-admin/activity"
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-8 w-8" />}
          title="No activity recorded yet"
          description="Privileged Super Admin actions will appear here as audit events."
          className="border-0 bg-slate-50 py-10 shadow-none"
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {row.actorName ?? "System"}{" "}
                  <span className="font-medium text-slate-600">
                    {formatAuditAction(row.action).toLowerCase()}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {row.resourceType}
                  {row.institutionName ? ` · ${row.institutionName}` : ""}
                  {row.actorEmail ? ` · ${row.actorEmail}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-xs font-medium text-slate-500">{relativeTime(row.createdAt)}</p>
                <p className="text-[11px] font-semibold text-emerald-600">Recorded</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
