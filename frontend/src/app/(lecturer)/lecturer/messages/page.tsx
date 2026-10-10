import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { RoleKey } from "@prisma/client";
import { requireRole } from "@/lib/permissions/rbac";
import { loadMessagingInbox } from "@/features/messaging/load-inbox";
import { MessagesInbox } from "@/features/messaging/messages-client";

export const metadata: Metadata = {
  title: "Messages — Lecturer",
};

export default async function LecturerMessagesPage() {
  const user = await requireRole([RoleKey.LECTURER]);
  const { conversations, directory } = await loadMessagingInbox(user);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          Messages
        </h1>
        <p className="mt-1 text-sm text-slate-600">Private faculty messaging.</p>
      </div>
      <MessagesInbox
        basePath="/lecturer/messages"
        conversations={conversations}
        directory={directory}
      />
    </div>
  );
}
