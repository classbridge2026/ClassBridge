import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function InstitutionLogoMark({
  name,
  logoUrl,
  caption,
  className,
  tone = "on-dark",
}: {
  name: string;
  logoUrl?: string | null;
  /** Optional label under/beside the mark (e.g. "Institution analytics"). */
  caption?: string;
  className?: string;
  tone?: "on-dark" | "on-light";
}) {
  const frame =
    tone === "on-dark"
      ? "border-white/25 bg-white/95 shadow-lg shadow-black/20 ring-1 ring-white/30"
      : "border-slate-200 bg-white shadow-md ring-1 ring-slate-100";
  const captionClass =
    tone === "on-dark" ? "text-blue-50/90" : "text-slate-500";

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center gap-2 sm:items-end",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border sm:h-20 sm:w-20",
          frame,
        )}
        title={name}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local upload URLs
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-gradient-to-br from-slate-50 to-slate-100 px-1">
            <Building2 className="h-6 w-6 text-slate-400 sm:h-7 sm:w-7" />
            <span className="max-w-full truncate px-1 text-center text-[8px] font-bold uppercase tracking-wide text-slate-400">
              Logo
            </span>
          </div>
        )}
      </div>
      {caption ? (
        <p
          className={cn(
            "max-w-[9rem] text-center text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-right",
            captionClass,
          )}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
