import type { Metadata } from "next";
import { Suspense } from "react";
import { Calendar } from "lucide-react";
import { Prisma, SessionStatus } from "@prisma/client";
import { requireInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { parsePage } from "@/lib/utils/pagination";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstEmptyState } from "@/components/institution-admin/shared/empty-state";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import { SearchFilters, Pagination } from "@/components/institution-admin/shared/search-filters";
import {
  ClassesManager,
  ClassRowActions,
} from "@/components/institution-admin/classes/classes-manager";
import { toDatetimeLocal } from "@/lib/utils/datetime-local";

export const metadata: Metadata = {
  title: "Classes — Institution Admin",
};

const STATUS_VALUES = ["DRAFT", "SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"] as const;

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; create?: string }>;
}) {
  const { institutionId } = await requireInstitutionAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = STATUS_VALUES.includes(params.status as (typeof STATUS_VALUES)[number])
    ? (params.status as SessionStatus)
    : undefined;

  const where: Prisma.ClassSessionWhereInput = {
    institutionId,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { course: { title: { contains: q, mode: "insensitive" } } },
            { course: { code: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const total = await prisma.classSession.count({ where });
  const { page, pageSize, skip, totalPages } = parsePage(params.page, total);

  const [sessions, courses] = await Promise.all([
    prisma.classSession.findMany({
      where,
      orderBy: [{ scheduledStart: "asc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
      include: {
        course: {
          include: {
            lecturerProfile: {
              include: {
                institutionUser: { include: { user: { select: { fullName: true } } } },
              },
            },
          },
        },
        _count: { select: { attendance: true } },
      },
    }),
    prisma.course.findMany({
      where: { institutionId, status: "ACTIVE" },
      orderBy: { code: "asc" },
      select: { id: true, code: true, title: true },
    }),
  ]);

  const courseOptions = courses.map((c) => ({
    value: c.id,
    label: `${c.code} — ${c.title}`,
  }));

  return (
    <div className="space-y-6">
      <InstPageHeader
        title="Classes"
        description="Schedule and monitor institution class sessions."
        actions={<ClassesManager defaultOpen={params.create === "1"} courses={courseOptions} />}
      />

      <Suspense fallback={null}>
        <SearchFilters
          placeholder="Search class or course…"
          statusOptions={STATUS_VALUES.map((s) => ({ value: s, label: s }))}
        />
      </Suspense>

      {sessions.length === 0 ? (
        <InstEmptyState
          icon={Calendar}
          title="No classes scheduled"
          description="No classes have been scheduled for this institution yet."
          actionHref="/institution-admin/classes?create=1"
          actionLabel="Schedule Class"
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Lecturer</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{session.title}</p>
                      {session.status === "LIVE" ? (
                        <p className="mt-0.5 text-xs text-rose-600">
                          {session._count.attendance} participant{session._count.attendance === 1 ? "" : "s"}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-mono text-xs">{session.course.code}</span>
                      <span className="block text-xs">{session.course.title}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {session.course.lecturerProfile?.institutionUser.user.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {session.scheduledStart
                        ? session.scheduledStart.toLocaleString()
                        : "Not scheduled"}
                      {session.scheduledEnd ? (
                        <span className="block">→ {session.scheduledEnd.toLocaleString()}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <InstStatusBadge status={session.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ClassRowActions
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
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Suspense fallback={null}>
            <Pagination page={page} totalPages={totalPages} total={total} />
          </Suspense>
        </>
      )}
    </div>
  );
}
