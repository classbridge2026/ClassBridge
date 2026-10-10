"use client";

import { Hand, Loader2 } from "lucide-react";
import { ControlButton } from "@/features/live-class/classroom/control-button";
import type { useRaiseHand } from "@/features/live-class/hooks/use-raise-hand";

type RaiseApi = ReturnType<typeof useRaiseHand>;

type RaiseHandControlProps = {
  raise: RaiseApi;
};

export function RaiseHandControl({ raise }: RaiseHandControlProps) {
  return (
    <ControlButton
      label={raise.handRaised ? "Lower hand" : "Raise hand"}
      active={raise.handRaised}
      onClick={() => void raise.toggleHand()}
      disabled={raise.busy}
    >
      {raise.busy ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      ) : (
        <Hand className="h-5 w-5" aria-hidden />
      )}
      <span>{raise.handRaised ? "Lower" : "Hand"}</span>
    </ControlButton>
  );
}
