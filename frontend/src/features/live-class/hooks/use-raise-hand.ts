"use client";

import { useLocalParticipant, useParticipants, useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  decodeLiveClassData,
  encodeLiveClassData,
  mergeParticipantMeta,
  parseParticipantMeta,
  type LowerHandPayload,
  type RaiseHandPayload,
} from "@/features/live-class/lib/realtime-events";

export type RaisedHandEntry = {
  identity: string;
  userId: string;
  fullName: string;
  raisedAt: string;
};

type UseRaiseHandOptions = {
  isHost: boolean;
  viewerName: string;
};

export function useRaiseHand({ isHost, viewerName }: UseRaiseHandOptions) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** Timestamps from realtime events (late joiners without an event sort last). */
  const [raisedAtByIdentity, setRaisedAtByIdentity] = useState<Record<string, string>>({});

  const localMeta = parseParticipantMeta(localParticipant.metadata);
  const handRaised = Boolean(localMeta.handRaised);

  const raisedHands: RaisedHandEntry[] = useMemo(() => {
    return participants
      .filter((p) => parseParticipantMeta(p.metadata).handRaised)
      .map((p) => {
        const meta = parseParticipantMeta(p.metadata);
        return {
          identity: p.identity,
          userId: meta.userId || p.identity,
          fullName: p.name || meta.fullName || p.identity,
          raisedAt: raisedAtByIdentity[p.identity] ?? "9999-12-31T23:59:59.999Z",
        };
      })
      .sort((a, b) => a.raisedAt.localeCompare(b.raisedAt));
  }, [participants, raisedAtByIdentity]);

  const setLocalHand = useCallback(
    async (raised: boolean) => {
      const nextMeta = mergeParticipantMeta(localParticipant.metadata, { handRaised: raised });
      await localParticipant.setMetadata(nextMeta);

      const at = new Date().toISOString();
      const payload: RaiseHandPayload = {
        kind: "raise_hand",
        identity: localParticipant.identity,
        userId: parseParticipantMeta(localParticipant.metadata).userId || localParticipant.identity,
        fullName: localParticipant.name || viewerName,
        raised,
        at,
      };

      setRaisedAtByIdentity((prev) => {
        const next = { ...prev };
        if (raised) next[localParticipant.identity] = at;
        else delete next[localParticipant.identity];
        return next;
      });

      await localParticipant.publishData(encodeLiveClassData(payload), { reliable: true });
    },
    [localParticipant, viewerName],
  );

  const toggleHand = useCallback(async () => {
    if (isHost || busy) return;
    setBusy(true);
    try {
      await setLocalHand(!handRaised);
    } finally {
      setBusy(false);
    }
  }, [busy, handRaised, isHost, setLocalHand]);

  const lowerOwnHand = useCallback(async () => {
    if (!handRaised || busy) return;
    setBusy(true);
    try {
      await setLocalHand(false);
    } finally {
      setBusy(false);
    }
  }, [busy, handRaised, setLocalHand]);

  const lowerParticipantHand = useCallback(
    async (targetIdentity: string) => {
      if (!isHost) return;
      const payload: LowerHandPayload = {
        kind: "lower_hand",
        targetIdentity,
        byIdentity: localParticipant.identity,
        at: new Date().toISOString(),
      };
      await localParticipant.publishData(encodeLiveClassData(payload), { reliable: true });

      setRaisedAtByIdentity((prev) => {
        const next = { ...prev };
        delete next[targetIdentity];
        return next;
      });

      if (targetIdentity === localParticipant.identity) {
        await setLocalHand(false);
      }
    },
    [isHost, localParticipant, setLocalHand],
  );

  useEffect(() => {
    const onData = (payload: Uint8Array) => {
      const decoded = decodeLiveClassData(payload);
      if (!decoded) return;

      if (decoded.kind === "raise_hand") {
        setRaisedAtByIdentity((prev) => {
          const next = { ...prev };
          if (decoded.raised) next[decoded.identity] = decoded.at;
          else delete next[decoded.identity];
          return next;
        });
        if (decoded.raised && decoded.identity !== localParticipant.identity) {
          setToast(`${decoded.fullName} raised their hand.`);
        }
        return;
      }

      if (decoded.kind === "lower_hand") {
        setRaisedAtByIdentity((prev) => {
          const next = { ...prev };
          delete next[decoded.targetIdentity];
          return next;
        });

        if (decoded.targetIdentity === localParticipant.identity) {
          const meta = parseParticipantMeta(localParticipant.metadata);
          if (meta.handRaised) {
            void setLocalHand(false).then(() => {
              setToast("The lecturer lowered your hand.");
            });
          }
        }
      }
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [localParticipant, room, setLocalHand]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  return {
    handRaised,
    busy,
    raisedHands,
    raisedCount: raisedHands.length,
    toast,
    clearToast: () => setToast(null),
    toggleHand,
    lowerOwnHand,
    lowerParticipantHand,
    acknowledgeHand: lowerParticipantHand,
  };
}
