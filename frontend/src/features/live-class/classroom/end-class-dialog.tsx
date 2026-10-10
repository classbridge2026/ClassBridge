"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type EndClassDialogProps = {
  open: boolean;
  ending: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function EndClassDialog({ open, ending, error, onCancel, onConfirm }: EndClassDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !ending) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="end-class-title"
        aria-describedby="end-class-desc"
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-xl"
      >
        <h2 id="end-class-title" className="text-lg font-semibold">
          End this class for everyone?
        </h2>
        <p id="end-class-desc" className="mt-2 text-sm text-slate-400">
          All participants will be disconnected. You can review attendance and recordings afterward.
        </p>
        {error ? (
          <p className="mt-3 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
            onClick={onCancel}
            disabled={ending}
          >
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={ending}>
            {ending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Ending…
              </>
            ) : (
              "End Class"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
