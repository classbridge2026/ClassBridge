import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RoleKey } from "@prisma/client";
import { requireRole } from "@/lib/permissions/rbac";
import { loadMessagingThread } from "@/features/messaging/load-inbox";
import { ConversationThread } from "@/features/messaging/messages-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Conversation — Student",
};

export default async function StudentMessageThreadPage({ params }: PageProps) {
  const user = await requireRole([RoleKey.STUDENT]);
  const { id } = await params;
  const thread = await loadMessagingThread(user, id);
  if (!thread) notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/student/messages"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to messages
      </Link>
      <ConversationThread
        conversationId={thread.id}
        subject={thread.subject}
        participants={thread.participants}
        messages={thread.messages}
      />
    </div>
  );
}
