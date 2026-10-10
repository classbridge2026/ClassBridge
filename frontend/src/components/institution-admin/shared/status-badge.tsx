import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-600 ring-slate-200",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  DRAFT: "bg-slate-100 text-slate-600 ring-slate-200",
  SCHEDULED: "bg-blue-50 text-blue-700 ring-blue-200",
  LIVE: "bg-rose-50 text-rose-700 ring-rose-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
  ARCHIVED: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function InstStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1",
        MAP[status] ?? "bg-slate-100 text-slate-600 ring-slate-200",
      )}
    >
      {status === "LIVE" ? "🔴 LIVE" : status}
    </span>
  );
}
