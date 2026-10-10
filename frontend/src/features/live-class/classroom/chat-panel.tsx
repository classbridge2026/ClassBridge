"use client";

import { Loader2, Megaphone, MessageSquare, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChatMessageItem } from "@/features/live-class/classroom/chat-message";
import type { useClassChat } from "@/features/live-class/hooks/use-class-chat";
import { parseParticipantMeta } from "@/features/live-class/lib/realtime-events";
import { useLocalParticipant } from "@livekit/components-react";
import { cn } from "@/lib/utils";

type ChatApi = ReturnType<typeof useClassChat>;

type ChatPanelProps = {
  open: boolean;
  onClose: () => void;
  chat: ChatApi;
  variant?: "sidebar" | "sheet";
  className?: string;
};

export function ChatPanel({
  open,
  onClose,
  chat,
  variant = "sidebar",
  className,
}: ChatPanelProps) {
  const { localParticipant } = useLocalParticipant();
  const localUserId = parseParticipantMeta(localParticipant.metadata).userId;
  const [draft, setDraft] = useState("");
  const [asAnnouncement, setAsAnnouncement] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chat.setPanelOpen(open);
  }, [chat, open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages, open]);

  if (!open) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const type = asAnnouncement && chat.permissions.canAnnounce ? "ANNOUNCEMENT" : "MESSAGE";
    void chat.sendMessage(draft, type).then(() => setDraft(""));
  };

  const panel = (
    <aside
      className={cn(
        "flex h-full min-h-0 w-full flex-col border-slate-800 bg-[#0E1628]",
        variant === "sidebar" && "border-l",
        variant === "sheet" && "rounded-t-2xl border-t shadow-2xl",
        className,
      )}
      aria-label="Class chat"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-3 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-300" aria-hidden />
          <h2 className="text-sm font-semibold text-white">Chat</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {chat.loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading messages…
          </div>
        ) : chat.messages.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-500">
            No messages yet. Say hello to the class.
          </p>
        ) : (
          chat.messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              isOwn={Boolean(localUserId && message.sender.id === localUserId)}
            />
          ))
        )}
      </div>

      <form onSubmit={onSubmit} className="shrink-0 border-t border-slate-800 p-3">
        {chat.permissions.canAnnounce ? (
          <label className="mb-2 flex items-center gap-2 text-[11px] text-slate-400">
            <input
              type="checkbox"
              checked={asAnnouncement}
              onChange={(e) => setAsAnnouncement(e.target.checked)}
              className="rounded border-slate-600"
            />
            <Megaphone className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            Send as announcement
          </label>
        ) : null}

        {chat.error ? (
          <p className="mb-2 text-[11px] text-amber-300" role="alert">
            {chat.error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <label className="sr-only" htmlFor="class-chat-input">
            Message
          </label>
          <input
            id="class-chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!chat.permissions.canChat || chat.sending}
            placeholder={
              chat.permissions.canChat ? "Type a message…" : "Chat is unavailable"
            }
            maxLength={2000}
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!chat.permissions.canChat || chat.sending || !draft.trim()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
            aria-label="Send message"
          >
            {chat.sending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </form>
    </aside>
  );

  if (variant === "sheet") {
    return (
      <div
        className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50 md:hidden"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="max-h-[75vh] min-h-[45vh]">{panel}</div>
      </div>
    );
  }

  return panel;
}
