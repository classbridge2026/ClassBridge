"use client";

import { useEffect } from "react";
import Link from "next/link";
import { showError, toUserMessage } from "@/lib/ui/swal";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    void showError(
      toUserMessage(error, "Something went wrong on this page. You can try again or go back home."),
      "Page error",
    );
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
      <p className="max-w-md text-sm text-slate-600">
        We could not load this page. Please try again. If the problem continues, contact support.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
