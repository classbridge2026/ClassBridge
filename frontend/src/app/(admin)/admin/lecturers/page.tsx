import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/permissions/rbac";
import { RoleKey } from "@prisma/client";
import { AccountStatusBadge } from "@/components/shared/account-status-badge";
import { CreateLecturerDialog } from "@/features/lecturers/create-lecturer-dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChalkboardUser, faEye } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  title: "Lecturers — Campus Admin",
};

export default async function AdminLecturersPage() {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;

  const lecturers = await prisma.lecturerProfile.findMany({
    where: { institutionId },
    include: {
      institutionUser: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <FontAwesomeIcon icon={faChalkboardUser} className="h-5 w-5 text-emerald-600" />
            <span>Campus Lecturer Directory</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Teaching faculty profiles for {user.activeMembership?.institutionName}.{" "}
            <Link href="/institution-admin/lecturers" className="font-semibold text-blue-600 hover:underline">
              Open full management
            </Link>
          </p>
        </div>
        <CreateLecturerDialog />
      </div>

      {lecturers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <FontAwesomeIcon icon={faChalkboardUser} className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-800">No lecturers found</p>
          <p className="mt-1 text-sm text-slate-500">Add your first lecturer to get started.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {lecturers.map((lp) => (
              <div key={lp.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{lp.institutionUser.user.fullName}</p>
                    <p className="truncate text-[11px] text-slate-500">{lp.institutionUser.user.email}</p>
                    <p className="mt-1 text-xs text-slate-600">{lp.title || "—"}</p>
                  </div>
                  <AccountStatusBadge
                    status={lp.institutionUser.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                  />
                </div>
                <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                  <Link
                    href={`/institution-admin/lecturers/${lp.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sky-700 hover:bg-sky-50"
                    title="View"
                    aria-label={`View ${lp.institutionUser.user.fullName}`}
                  >
                    <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Faculty Name &amp; Email</th>
                    <th className="px-4 py-3">Academic Title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Appointed Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {lecturers.map((lp) => (
                    <tr key={lp.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{lp.institutionUser.user.fullName}</p>
                        <p className="font-mono text-[11px] text-slate-500">{lp.institutionUser.user.email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{lp.title || "—"}</td>
                      <td className="px-4 py-3.5">
                        <AccountStatusBadge
                          status={lp.institutionUser.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                        />
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                        {new Date(lp.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/institution-admin/lecturers/${lp.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sky-700 hover:bg-sky-50"
                          title="View / Manage"
                          aria-label={`View ${lp.institutionUser.user.fullName}`}
                        >
                          <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
