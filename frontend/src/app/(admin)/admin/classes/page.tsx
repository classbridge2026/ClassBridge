import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/db/prisma";
import { RoleKey, SessionStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Classes — Campus Admin",
};

export default async function AdminClassesPage() {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;

  const sessions = institutionId
    ? await prisma.classSession.findMany({
        where: { institutionId },
        include: {
          course: { select: { code: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor scheduled and live sessions for {user.activeMembership?.institutionName}.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Class</th>
              <th className="px-4 py-3 font-semibold">Course</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  No class sessions for this campus yet.
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const open =
                  session.status === SessionStatus.SCHEDULED ||
                  session.status === SessionStatus.LIVE;
                return (
                  <tr key={session.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{session.title}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {session.course.code} — {session.course.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-700">
                        {session.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {open ? (
                        <Link
                          href={`/class/${session.id}/live`}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Open Pre-Join
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">Ended</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
