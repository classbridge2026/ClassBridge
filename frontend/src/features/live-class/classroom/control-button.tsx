"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ControlButtonProps = {
  label: string;
  /** false = muted/off (red). true/undefined = neutral unless `active`. */
  pressed?: boolean;
  /** Highlight when a panel/tool is open (not the same as muted). */
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
};

export function ControlButton({
  label,
  pressed,
  active,
  danger,
  onClick,
  children,
  disabled,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed ?? active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50",
        danger
          ? "bg-red-600 text-white hover:bg-red-500"
          : pressed === false
            ? "bg-red-600/90 text-white hover:bg-red-500"
            : active
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "bg-slate-800 text-slate-100 hover:bg-slate-700",
      )}
    >
      {children}
    </button>
  );
}
