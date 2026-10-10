import type { Metadata } from "next";
import { requireRole } from "@/lib/permissions/rbac";
import { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { Video, Film, HardDrive, Clock, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Recordings — Campus Admin",
};

export default async function AdminRecordingsPage() {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;

  if (!institutionId) {
    return null;
  }

  // Fetch recordings in active institution
  const recordings = await prisma.classRecording.findMany({
    where: {
      session: {
        institutionId,
      },
    },
    include: {
      session: {
        include: {
          course: {
            select: {
              code: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalBytes = recordings.reduce((acc, r) => acc + Number(r.fileSizeBytes), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Film className="h-6 w-6 text-indigo-600" />
          <span>Classroom Video Recordings</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage archived WebRTC video lectures and storage metrics for {user.activeMembership?.institutionName}.
        </p>
      </div>

      {/* Storage Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recorded Sessions</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{recordings.length}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Storage Used</span>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{totalMB} MB</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Storage Adapter</span>
          <p className="mt-2 text-base font-mono font-bold text-slate-700 flex items-center gap-1.5">
            <HardDrive className="h-4 w-4 text-slate-400" />
            <span>S3 Compatible</span>
          </p>
        </div>
      </div>

      {/* Recordings Grid */}
      {recordings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-3 shadow-xs max-w-lg mx-auto">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Video className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Recorded Archives Found</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            As instructors record live WebRTC lectures, video archives will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recordings.map((rec) => {
            const sizeMB = (Number(rec.fileSizeBytes) / (1024 * 1024)).toFixed(1);
            const durationMins = Math.round(rec.durationSeconds / 60);

            return (
              <div
                key={rec.id}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-md space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 font-mono text-xs font-bold text-indigo-700">
                      {rec.session.course.code}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {rec.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{rec.session.course.title}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {durationMins} mins
                  </span>
                  <span className="font-mono text-slate-500">{sizeMB} MB</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
