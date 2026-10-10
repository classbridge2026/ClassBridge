"use client";

import { useSyncExternalStore } from "react";

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

function elapsedLabel(startedAt: string | null) {
  if (!startedAt) return "00:00:00";
  const origin = new Date(startedAt).getTime();
  if (Number.isNaN(origin)) return "00:00:00";
  const elapsed = Math.max(0, Math.floor((Date.now() - origin) / 1000));
  return formatDuration(elapsed);
}

/** Elapsed class time derived from the server `startedAt` timestamp. */
export function useClassTimer(startedAt: string | null) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const id = window.setInterval(onStoreChange, 1000);
      return () => window.clearInterval(id);
    },
    () => elapsedLabel(startedAt),
    () => "00:00:00",
  );
}
