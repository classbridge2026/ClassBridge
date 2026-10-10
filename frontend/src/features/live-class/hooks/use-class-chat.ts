"use client";

import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  decodeLiveClassData,
  encodeLiveClassData,
  type ChatBroadcastPayload,
} from "@/features/live-class/lib/realtime-events";

export type ClassChatMessage = ChatBroadcastPayload["message"];

type ChatPermissions = {
  canChat: boolean;
  canAnnounce: boolean;
  isHost: boolean;
};

type UseClassChatOptions = {
  sessionId: string;
  viewerUserId?: string;
};

export function useClassChat({ sessionId }: UseClassChatOptions) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [messages, setMessages] = useState<ClassChatMessage[]>([]);
  const [permissions, setPermissions] = useState<ChatPermissions>({
    canChat: false,
    canAnnounce: false,
    isHost: false,
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const panelOpenRef = useRef(false);

  const setPanelOpen = useCallback((open: boolean) => {
    panelOpenRef.current = open;
    if (open) setUnread(0);
  }, []);

  const upsertMessage = useCallback((message: ClassChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/classes/${sessionId}/chat`);
        const body = (await res.json().catch(() => ({}))) as {
          messages?: ClassChatMessage[];
          permissions?: ChatPermissions;
          error?: string;
        };
        if (!res.ok) throw new Error(body.error || "We couldn't load class chat.");
        if (cancelled) return;
        setMessages(body.messages ?? []);
        if (body.permissions) setPermissions(body.permissions);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "We couldn't load class chat.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    const onData = (payload: Uint8Array) => {
      const decoded = decodeLiveClassData(payload);
      if (!decoded || decoded.kind !== "chat") return;
      if (decoded.message.sessionId !== sessionId) return;

      const localUserId = (() => {
        try {
          return JSON.parse(localParticipant.metadata || "{}") as { userId?: string };
        } catch {
          return {};
        }
      })().userId;

      const isOwn = Boolean(localUserId && decoded.message.sender.id === localUserId);
      upsertMessage(decoded.message);
      if (!panelOpenRef.current && !isOwn) {
        setUnread((n) => n + 1);
      }
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [localParticipant.metadata, room, sessionId, upsertMessage]);

  const sendMessage = useCallback(
    async (body: string, type: "MESSAGE" | "ANNOUNCEMENT" = "MESSAGE") => {
      const trimmed = body.trim();
      if (!trimmed || sending) return;
      setSending(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/classes/${sessionId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: trimmed, type }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          message?: ClassChatMessage;
          error?: string;
        };
        if (!res.ok || !data.message) {
          throw new Error(data.error || "We couldn't send your message.");
        }

        upsertMessage(data.message);

        const payload: ChatBroadcastPayload = { kind: "chat", message: data.message };
        await localParticipant.publishData(encodeLiveClassData(payload), { reliable: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "We couldn't send your message.");
      } finally {
        setSending(false);
      }
    },
    [localParticipant, sending, sessionId, upsertMessage],
  );

  return {
    messages,
    permissions,
    loading,
    sending,
    error,
    unread,
    setPanelOpen,
    sendMessage,
    clearError: () => setError(null),
  };
}
