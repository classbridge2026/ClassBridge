import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  INACTIVE: "bg-amber-50 text-amber-700 ring-amber-600/20",
  PENDING: "bg-sky-50 text-sky-700 ring-sky-600/20",
  TRASHED: "bg-red-50 text-red-700 ring-red-600/20",
  TRIALING: "bg-violet-50 text-violet-700 ring-violet-600/20",
  PAST_DUE: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  EXPIRED: "bg-red-50 text-red-700 ring-red-600/20",
};

const LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Suspended",
  PENDING: "Pending",
  TRASHED: "Trashed",
  TRIALING: "Trial",
  PAST_DUE: "Past due",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        STYLES[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20",
        className,
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
