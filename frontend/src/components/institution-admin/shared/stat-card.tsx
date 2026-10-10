import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { cn } from "@/lib/utils";

export function InstStatCard({
  label,
  value,
  icon,
  hint,
  tone = "blue",
}: {
  label: string;
  value: number | string;
  icon: IconDefinition;
  hint?: string;
  tone?: "blue" | "green" | "amber" | "slate" | "sky" | "rose" | "violet";
}) {
  const tones = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25",
    green: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25",
    amber: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/25",
    slate: "bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-slate-500/25",
    sky: "bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-sky-500/25",
    rose: "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/25",
    violet: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-violet-500/25",
  };

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg",
            tones[tone],
          )}
        >
          <FontAwesomeIcon icon={icon} className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  );
}
