import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LiveClassShell } from "@/features/live-class/live-class-shell";
import { loadLiveClassSession } from "@/features/live-class/lib/load-live-class-session";

type LiveClassPageProps = {
  params: Promise<{ sessionId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Live Class" };
}

export default async function LiveClassPage({ params }: LiveClassPageProps) {
  const { sessionId } = await params;
  const result = await loadLiveClassSession(sessionId);

  if (!result.ok) {
    if (result.status === 404) notFound();
    redirect(`/login?error=unauthorized&callbackUrl=/class/${sessionId}/live`);
  }

  return <LiveClassShell session={result.data} />;
}
