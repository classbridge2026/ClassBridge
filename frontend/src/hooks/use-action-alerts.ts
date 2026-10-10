"use client";

import { useEffect, useRef } from "react";
import { showError, showSuccess, toUserMessage } from "@/lib/ui/swal";

type AlertableState = {
  ok: boolean;
  message?: string;
  error?: string;
} | null;

/** Shows SweetAlert when a server-action form state changes. */
export function useActionAlerts(state: AlertableState, options?: { successTitle?: string; errorTitle?: string }) {
  const last = useRef<AlertableState>(null);

  useEffect(() => {
    if (!state || state === last.current) return;
    last.current = state;

    if (state.ok && state.message) {
      void showSuccess(state.message, options?.successTitle ?? "Done");
      return;
    }
    if (!state.ok && state.error) {
      void showError(toUserMessage(state.error), options?.errorTitle ?? "Something went wrong");
    }
  }, [state, options?.successTitle, options?.errorTitle]);
}
