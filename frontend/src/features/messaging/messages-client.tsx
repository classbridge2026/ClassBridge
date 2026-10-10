"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MessageSquare, Send } from "lucide-react";
import {
  submitSendMessage,
  submitStartConversation,
  type MessagingFormState,
} from "./actions";

const initial: MessagingFormState = { ok: false };

export type DirectoryUser = {
  userId: string;
  fullName: string;
  email: string;
  roleName: string;
};

export type ConversationSummary = {
  id: string;
  subject: string | null;
  updatedAt: string;
  otherParticipants: string;
  lastMessage: string | null;
};

export type ConversationMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderName: string;
  isMine: boolean;
};

export function MessagesInbox({
  basePath,
  conversations,
  directory,
}: {
  basePath: string;
  conversations: ConversationSummary[];
  directory: DirectoryUser[];
}) {
  const [state, action, pending] = useActionState(submitStartConversation, initial);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {conversations.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No conversations yet. Start one from the directory.
          </div>
        ) : (
          conversations.map((c) => (
            <Link
              key={c.id}
              href={`${basePath}/${c.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:bg-blue-50/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {c.subject || c.otherParticipants}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{c.otherParticipants}</p>
                  {c.lastMessage && (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-600">{c.lastMessage}</p>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {new Date(c.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      <form action={action} className="h-fit space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">New message</h2>
        </div>
        <select
          name="participantUserId"
          required
          defaultValue=""
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select recipient
          </option>
          {directory.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.fullName} ({u.roleName})
            </option>
          ))}
        </select>
        <input
          name="subject"
          placeholder="Subject (optional)"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          name="body"
          required
          rows={4}
          placeholder="Write your message…"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          <Send className="h-3 w-3" />
          {pending ? "Sending…" : "Start conversation"}
        </button>
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        {state.ok && state.message && (
          <p className="text-xs text-emerald-600">{state.message}</p>
        )}
      </form>
    </div>
  );
}

export function ConversationThread({
  conversationId,
  subject,
  participants,
  messages,
}: {
  conversationId: string;
  subject: string | null;
  participants: string;
  messages: ConversationMessage[];
}) {
  const [state, action, pending] = useActionState(submitSendMessage, initial);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-900">{subject || "Conversation"}</h2>
        <p className="mt-1 text-xs text-slate-500">{participants}</p>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        {messages.length === 0 ? (
          <p className="text-xs text-slate-500">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.isMine
                  ? "ml-auto bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {!m.isMine && (
                <p className="mb-1 text-[10px] font-semibold opacity-80">{m.senderName}</p>
              )}
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={`mt-1 text-[10px] ${m.isMine ? "text-blue-100" : "text-slate-500"}`}>
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <form action={action} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <input type="hidden" name="conversationId" value={conversationId} />
        <textarea
          name="body"
          required
          rows={2}
          placeholder="Type a reply…"
          className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="self-end rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : "Send"}
        </button>
      </form>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
