import type { Metadata } from "next";
import Link from "next/link";
import { Film, Video, Clock, Calendar, Play } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireLecturerContext } from "@/lib/lecturer/access";
import { DeleteRecordingButton } from "@/features/lecturer/delete-recording-button";

export const metadata: Metadata = {
  title: "Recordings — Lecturer Portal",
};

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default async function LecturerRecordingsPage() {
  const { courseIds, institutionId, institutionName } = await requireLecturerContext();

  const recordings =
    courseIds.length > 0
      ? await prisma.classRecording.findMany({
          where: {
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
          orderBy: { createdAt: "desc" },
        })
      : [];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Film className="h-6 w-6 text-[#2563EB]" />
          Recordings
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Class recordings from your teaching sessions at {institutionName}.
        </p>
      </div>

      {recordings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Video className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-lg font-bold text-slate-900">No recordings yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            When you record a live class, the archive will appear here once processing completes.
          </p>
          <Link
            href="/lecturer/live-classes"
            className="mt-4 inline-flex rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            Open Live Classes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recordings.map((rec) => {
            const sizeMB = (Number(rec.fileSizeBytes) / (1024 * 1024)).toFixed(1);
            const ready = Boolean(rec.storageKey);
            return (
              <article
                key={rec.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#2563EB]">
                      {rec.session.course.code}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {ready ? "Ready" : "Processing"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{rec.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{rec.session.title}</p>
                    <p className="text-xs text-slate-500">{rec.session.course.title}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {rec.createdAt.toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {formatDuration(rec.durationSeconds)}
                    </span>
                    <span>{sizeMB} MB</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`/lecturer/recordings/${rec.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {ready ? "Play" : "View"}
                  </Link>
                  <Link
                    href={`/lecturer/classes/${rec.sessionId}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Class
                  </Link>
                  <DeleteRecordingButton recordingId={rec.id} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
