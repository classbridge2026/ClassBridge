import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar } from "lucide-react";
import { requireInstitutionAdmin, assertSameInstitution } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import {
  EditClassDialog,
  ClassStatusButton,
} from "@/components/institution-admin/classes/classes-manager";
import { toDatetimeLocal } from "@/lib/utils/datetime-local";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Class details — Institution Admin",
};

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { institutionId } = await requireInstitutionAdmin();
  const { id } = await params;

  const [session, courses] = await Promise.all([
    prisma.classSession.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            lecturerProfile: {
              include: {
                institutionUser: { include: { user: { select: { fullName: true, email: true } } } },
              },
            },
          },
        },
        attendance: {
          take: 20,
          orderBy: { joinedAt: "desc" },
          include: {
            studentProfile: {
              include: {
                institutionUser: { include: { user: { select: { fullName: true } } } },
              },
            },
          },
        },
        _count: { select: { attendance: true, recordings: true } },
      },
    }),
    prisma.course.findMany({
      where: { institutionId, status: "ACTIVE" },
      orderBy: { code: "asc" },
      select: { id: true, code: true, title: true },
    }),
  ]);

  if (!session || !assertSameInstitution(session.institutionId, institutionId)) {
    notFound();
  }

  const courseOptions = courses.map((c) => ({
    value: c.id,
    label: `${c.code} — ${c.title}`,
  }));

  const lecturer = session.course.lecturerProfile?.institutionUser.user;
  const durationMins =
    session.startedAt && session.endedAt
      ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000)
      : null;

  return (
    <div className="space-y-6">
      <InstPageHeader
        title={session.title}
        description={`${session.course.code} · ${session.course.title}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/institution-admin/classes"
              className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
            >
              Back
            </Link>
            <EditClassDialog
              session={{
                id: session.id,
                courseId: session.courseId,
                title: session.title,
                description: session.description,
                scheduledStart: toDatetimeLocal(session.scheduledStart),
                scheduledEnd: toDatetimeLocal(session.scheduledEnd),
                status: session.status,
              }}
              courses={courseOptions}
              triggerVariant="button"
            />
            {session.status === "DRAFT" ? (
              <ClassStatusButton id={session.id} nextStatus="SCHEDULED" label="Publish" />
            ) : null}
            {session.status === "SCHEDULED" || session.status === "DRAFT" ? (
              <ClassStatusButton
                id={session.id}
                nextStatus="CANCELLED"
                label="Cancel"
                variant="danger"
              />
            ) : null}
          </div>
        }
      />

      {session.status === "LIVE" ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <InstStatusBadge status="LIVE" />
              <p className="mt-2 text-lg font-bold text-slate-900">{session.title}</p>
              <p className="text-sm text-slate-600">
                Course: {session.course.code} — {session.course.title}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Lecturer: {lecturer?.fullName ?? "Unassigned"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Start:{" "}
                {session.startedAt?.toLocaleString() ??
                  session.scheduledStart?.toLocaleString() ??
                  "—"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Participants: {session._count.attendance}
                {durationMins != null ? ` · Duration: ${durationMins} min` : null}
              </p>
            </div>
            <p className="max-w-xs text-xs text-slate-500">
              Live teaching happens in the lecturer classroom. Institution Admin monitors status here only.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Calendar className="h-4 w-4 text-blue-600" />
            Class details
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
              <dd className="mt-1">
                <InstStatusBadge status={session.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</dt>
              <dd className="mt-1 font-medium text-slate-900">
                <Link
                  href={`/institution-admin/courses/${session.courseId}`}
                  className="text-blue-600 hover:underline"
                >
                  {session.course.code} — {session.course.title}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lecturer</dt>
              <dd className="mt-1 text-slate-800">
                {lecturer ? (
                  <>
                    {lecturer.fullName}
                    <span className="block text-xs text-slate-500">{lecturer.email}</span>
                  </>
                ) : (
                  "Unassigned"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Room</dt>
              <dd className="mt-1 font-mono text-xs text-slate-600">{session.roomName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scheduled start
              </dt>
              <dd className="mt-1 text-slate-800">
                {session.scheduledStart?.toLocaleString() ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scheduled end
              </dt>
              <dd className="mt-1 text-slate-800">
                {session.scheduledEnd?.toLocaleString() ?? "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </dt>
              <dd className="mt-1 text-slate-700">{session.description || "No description."}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Session stats</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Attendance records</span>
              <span className="font-bold text-slate-900">{session._count.attendance}</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Recordings</span>
              <span className="font-bold text-slate-900">{session._count.recordings}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-500">Started</span>
              <span className="text-xs text-slate-700">
                {session.startedAt?.toLocaleString() ?? "—"}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-500">Ended</span>
              <span className="text-xs text-slate-700">
                {session.endedAt?.toLocaleString() ?? "—"}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Recent attendance</h3>
        {session.attendance.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No attendance recorded for this class yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {session.attendance.map((row) => (
              <li key={row.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-slate-900">
                  {row.studentProfile.institutionUser.user.fullName}
                </span>
                <span className="text-xs text-slate-500">
                  {row.status} · {row.joinedAt.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
