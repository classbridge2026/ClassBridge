import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Film, Clock, Calendar } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";
import { storageAdapter } from "@/lib/storage/adapter";
import { DeleteRecordingButton } from "@/features/lecturer/delete-recording-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const rec = await prisma.classRecording.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: rec ? `${rec.title} — Recording` : "Recording" };
}

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default async function LecturerRecordingDetailPage({ params }: PageProps) {
  const { courseIds, institutionId } = await requireLecturerContext();
  const { id } = await params;

  const recording = await prisma.classRecording.findFirst({
    where: {
      id,
      session: {
        institutionId,
        courseId: { in: courseIds },
      },
    },
    include: {
      session: {
        include: {
          course: { select: { id: true, code: true, title: true } },
        },
      },
    },
  });

  if (!recording) notFound();

  const playUrl = recording.storageKey
    ? storageAdapter.getFileUrl(recording.storageKey)
    : null;

  return (
    <div className="space-y-6">
      <Link
        href="/lecturer/recordings"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to recordings
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="font-mono text-xs font-bold text-[#2563EB]">
              {recording.session.course.code}
            </span>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{recording.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {recording.session.title} · {recording.session.course.title}
            </p>
          </div>
          <DeleteRecordingButton recordingId={recording.id} />
        </div>

        <dl className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
          <div className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {recording.createdAt.toLocaleString()}
          </div>
          <div className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {formatDuration(recording.durationSeconds)}
          </div>
          <div>{(Number(recording.fileSizeBytes) / (1024 * 1024)).toFixed(1)} MB</div>
        </dl>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm">
        {playUrl ? (
          <video
            controls
            className="aspect-video w-full bg-black"
            src={playUrl}
            preload="metadata"
          >
            Your browser does not support video playback.
          </video>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center">
            <Film className="h-10 w-10 text-slate-500" />
            <p className="text-sm font-semibold text-white">Recording is still processing</p>
            <p className="max-w-sm text-xs text-slate-400">
              The file is not available yet. Check back shortly after the live session ends.
            </p>
          </div>
        )}
      </section>

      <Link
        href={`/lecturer/classes/${recording.sessionId}`}
        className="inline-flex text-xs font-semibold text-[#2563EB] hover:underline"
      >
        View class details
      </Link>
    </div>
  );
}
