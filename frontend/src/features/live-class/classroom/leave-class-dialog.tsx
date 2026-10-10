"use client";

import { Button } from "@/components/ui/button";

type LeaveClassDialogProps = {
  open: boolean;
  leaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LeaveClassDialog({ open, leaving, onCancel, onConfirm }: LeaveClassDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !leaving) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-class-title"
        aria-describedby="leave-class-desc"
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-xl"
      >
        <h2 id="leave-class-title" className="text-lg font-semibold">
          Leave this class?
        </h2>
        <p id="leave-class-desc" className="mt-2 text-sm text-slate-400">
          You will disconnect from the live classroom. You can rejoin while the class is still live.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
            onClick={onCancel}
            disabled={leaving}
          >
            Stay
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={leaving}>
            {leaving ? "Leaving…" : "Leave Class"}
          </Button>
        </div>
      </div>
    </div>
  );
}
