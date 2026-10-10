import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Clock, Ban } from "lucide-react";

export type AccountStatus = "ACTIVE" | "PENDING" | "INACTIVE" | "SUSPENDED";

interface AccountStatusBadgeProps {
  status: AccountStatus;
  className?: string;
  showIcon?: boolean;
}

export function AccountStatusBadge({
  status,
  className,
  showIcon = true,
}: AccountStatusBadgeProps) {
  switch (status) {
    case "ACTIVE":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700",
            className,
          )}
        >
          {showIcon && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          <span>Active</span>
        </span>
      );

    case "PENDING":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700",
            className,
          )}
        >
          {showIcon && <Clock className="h-3.5 w-3.5 text-amber-600" />}
          <span>Pending Approval</span>
        </span>
      );

    case "INACTIVE":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600",
            className,
          )}
        >
          {showIcon && <AlertCircle className="h-3.5 w-3.5 text-slate-500" />}
          <span>Inactive</span>
        </span>
      );

    case "SUSPENDED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700",
            className,
          )}
        >
          {showIcon && <Ban className="h-3.5 w-3.5 text-red-600" />}
          <span>Deactivated / Suspended</span>
        </span>
      );

    default:
      return null;
  }
}
