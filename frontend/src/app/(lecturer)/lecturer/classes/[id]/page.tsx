import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionStatus } from "@prisma/client";
import { ArrowLeft, Video, Users, Film, Clock } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { assertLecturerOwnsSession, requireLecturerContext } from "@/lib/lecturer/access";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await prisma.classSession.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: session ? `${session.title} — Class` : "Class" };
}

export default async function LecturerClassDetailPage({ params }: PageProps) {
  const { lecturerProfile, institutionId } = await requireLecturerContext();
  const { id } = await params;
  const session = await assertLecturerOwnsSession(lecturerProfile.id, id, institutionId);

  const full = await prisma.classSession.findUnique({
    where: { id: session.id },
    include: {
      course: { select: { id: true, code: true, title: true } },
      attendance: {
        include: {
          studentProfile: {
            include: {
              institutionUser: { include: { user: { select: { fullName: true, email: true } } } },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      recordings: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!full) notFound();

  const joinable =
    full.status === SessionStatus.SCHEDULED || full.status === SessionStatus.LIVE;

  return (
    <div className="space-y-6">
      <Link
        href="/lecturer/classes"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to classes
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#2563EB]">{full.course.code}</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
              {full.status}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{full.title}</h2>
          {full.description ? (
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{full.description}</p>
          ) : null}
          <dl className="mt-4 grid grid-cols-1 gap-3 text-xs text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Course</dt>
              <dd>
                <Link
                  href={`/lecturer/courses/${full.course.id}`}
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  {full.course.title}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Schedule</dt>
              <dd>
                {full.scheduledStart
                  ? full.scheduledStart.toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Not scheduled"}
                {full.scheduledEnd
                  ? ` – ${full.scheduledEnd.toLocaleTimeString([], { timeStyle: "short" })}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Started</dt>
              <dd>{full.startedAt?.toLocaleString() ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Ended</dt>
              <dd>{full.endedAt?.toLocaleString() ?? "—"}</dd>
            </div>
          </dl>
        </div>
        {joinable ? (
          <Link
            href={`/class/${full.id}/live`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Video className="h-4 w-4" />
            {full.status === SessionStatus.LIVE ? "Enter Class" : "Start Class"}
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Users className="h-4 w-4 text-[#2563EB]" /> Attendance
          </h3>
          {full.attendance.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No attendance recorded yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {full.attendance.map((row) => (
                <li key={row.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {row.studentProfile.institutionUser.user.fullName}
                    </p>
                    <p className="text-slate-500">
                      {row.status} · {row.durationMinutes} min
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Clock className="h-3 w-3" />
                    {row.joinedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Film className="h-4 w-4 text-[#2563EB]" /> Recordings
          </h3>
          {full.recordings.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No recordings for this class yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {full.recordings.map((rec) => (
                <li key={rec.id}>
                  <Link
                    href={`/lecturer/recordings?highlight=${rec.id}`}
                    className="block rounded-lg border border-slate-100 px-3 py-2 text-xs hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">{rec.title}</p>
                    <p className="text-slate-500">
                      {Math.round(rec.durationSeconds / 60)} min ·{" "}
                      {rec.createdAt.toLocaleString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
