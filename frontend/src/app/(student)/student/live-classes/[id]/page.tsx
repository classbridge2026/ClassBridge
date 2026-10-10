import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionStatus } from "@prisma/client";
import { ArrowLeft, Calendar, Clock, UserCheck, Video } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireStudentContext } from "@/lib/student/access";

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

export default async function StudentLiveClassDetailPage({ params }: PageProps) {
  const { studentProfile, institutionId, courseIds } = await requireStudentContext();
  const { id } = await params;

  const session = await prisma.classSession.findFirst({
    where: {
      id,
      institutionId,
      courseId: { in: courseIds },
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          title: true,
          lecturerProfile: {
            include: {
              institutionUser: {
                include: { user: { select: { fullName: true, email: true } } },
              },
            },
          },
        },
      },
      attendance: {
        where: { studentProfileId: studentProfile.id },
        take: 1,
      },
      recordings: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!session) notFound();

  const lecturer = session.course.lecturerProfile?.institutionUser.user;
  const canJoin =
    session.status === SessionStatus.LIVE || session.status === SessionStatus.SCHEDULED;
  const myAttendance = session.attendance[0];

  return (
    <div className="space-y-6">
      <Link
        href="/student/live-classes"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2563EB]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Live Classes
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="font-mono text-xs font-bold text-[#2563EB]">{session.course.code}</span>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{session.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{session.course.title}</p>
            {session.description ? (
              <p className="mt-3 text-sm text-slate-600">{session.description}</p>
            ) : null}
          </div>
          <span
            className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-bold uppercase ${
              session.status === SessionStatus.LIVE
                ? "bg-red-50 text-red-700"
                : session.status === SessionStatus.SCHEDULED
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {session.status}
          </span>
        </div>

        <dl className="mt-5 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            {session.scheduledStart
              ? session.scheduledStart.toLocaleString()
              : session.startedAt
                ? session.startedAt.toLocaleString()
                : "Not scheduled"}
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-slate-400" />
            {lecturer?.fullName ?? "Unassigned lecturer"}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            {myAttendance
              ? `Attended · ${myAttendance.durationMinutes} min`
              : "Attendance not logged yet"}
          </div>
        </dl>

        {canJoin ? (
          <Link
            href={`/class/${session.id}/live`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Video className="h-4 w-4" />
            {session.status === SessionStatus.LIVE ? "Join Class" : "Enter Waiting Room"}
          </Link>
        ) : null}
      </div>

      {session.recordings.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Recordings</h3>
          <ul className="mt-3 space-y-2">
            {session.recordings.map((rec) => (
              <li key={rec.id}>
                <Link
                  href={`/student/recordings/${rec.id}`}
                  className="text-sm font-semibold text-[#2563EB] hover:underline"
                >
                  {rec.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link
        href={`/student/courses/${session.course.id}`}
        className="inline-flex text-xs font-semibold text-[#2563EB] hover:underline"
      >
        Open course
      </Link>
    </div>
  );
}
