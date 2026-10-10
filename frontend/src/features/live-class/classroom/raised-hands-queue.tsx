"use client";

import { Hand, X } from "lucide-react";
import type { RaisedHandEntry } from "@/features/live-class/hooks/use-raise-hand";

type RaisedHandsQueueProps = {
  hands: RaisedHandEntry[];
  onAcknowledge: (identity: string) => void;
  onClose?: () => void;
};

export function RaisedHandsQueue({ hands, onAcknowledge, onClose }: RaisedHandsQueueProps) {
  if (hands.length === 0) return null;

  return (
    <div
      className="border-b border-amber-900/40 bg-amber-950/30 px-3 py-2"
      role="region"
      aria-label="Raised hands"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-200">
          <Hand className="h-3.5 w-3.5" aria-hidden />
          Raised hands ({hands.length})
        </p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-amber-200/70 hover:bg-amber-900/40 hover:text-amber-100"
            aria-label="Dismiss raised hands banner"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
      <ul className="flex flex-wrap gap-2">
        {hands.map((hand, index) => (
          <li
            key={hand.identity}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-800/50 bg-slate-950/50 px-2.5 py-1.5 text-xs text-slate-100"
          >
            <span className="tabular-nums text-amber-300">{index + 1}.</span>
            <span className="font-medium">{hand.fullName}</span>
            <button
              type="button"
              onClick={() => onAcknowledge(hand.identity)}
              className="rounded-md bg-amber-600/90 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              Lower
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
