"use client";

import { ConnectionState } from "livekit-client";
import { cn } from "@/lib/utils";

type ConnectionStatusProps = {
  state: ConnectionState;
  className?: string;
};

export function connectionLabel(state: ConnectionState): string {
  switch (state) {
    case ConnectionState.Connected:
      return "Excellent connection";
    case ConnectionState.Connecting:
      return "Connecting…";
    case ConnectionState.Reconnecting:
      return "Trying to reconnect…";
    case ConnectionState.Disconnected:
      return "Connection lost";
    default:
      return "Checking connection…";
  }
}

export function ConnectionStatus({ state, className }: ConnectionStatusProps) {
  const tone =
    state === ConnectionState.Connected
      ? "text-emerald-400"
      : state === ConnectionState.Reconnecting || state === ConnectionState.Connecting
        ? "text-amber-300"
        : "text-red-400";

  const dot =
    state === ConnectionState.Connected
      ? "bg-emerald-400"
      : state === ConnectionState.Reconnecting || state === ConnectionState.Connecting
        ? "bg-amber-300 animate-pulse"
        : "bg-red-400";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium", tone, className)}
      role="status"
      aria-live="polite"
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} aria-hidden />
      {connectionLabel(state)}
    </span>
  );
}
