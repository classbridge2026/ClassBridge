"use client";

import type { ClassChatMessage } from "@/features/live-class/hooks/use-class-chat";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

type ChatMessageProps = {
  message: ClassChatMessage;
  isOwn: boolean;
};

export function ChatMessageItem({ message, isOwn }: ChatMessageProps) {
  const isAnnouncement = message.type === "ANNOUNCEMENT";

  return (
    <article
      className={cn(
        "rounded-xl px-3 py-2",
        isAnnouncement
          ? "border border-amber-700/40 bg-amber-950/40"
          : isOwn
            ? "bg-blue-600/20"
            : "bg-slate-800/70",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-xs font-semibold text-slate-100">
          {isAnnouncement ? "Announcement · " : ""}
          {message.sender.fullName}
          {isOwn ? " (You)" : ""}
        </p>
        <time className="shrink-0 text-[10px] text-slate-500" dateTime={message.createdAt}>
          {formatTime(message.createdAt)}
        </time>
      </div>
      <p
        className={cn(
          "mt-1 whitespace-pre-wrap break-words text-sm",
          isAnnouncement ? "text-amber-100" : "text-slate-200",
        )}
      >
        {message.body}
      </p>
    </article>
  );
}
