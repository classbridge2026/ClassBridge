import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/permissions/rbac";
import { RoleKey } from "@prisma/client";
import { AccountStatusBadge } from "@/components/shared/account-status-badge";
import { CreateStudentDialog } from "@/features/students/create-student-dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faGraduationCap } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  title: "Students — Campus Admin",
};

export default async function AdminStudentsPage() {
  const user = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = user.activeMembership?.institutionId;

  const students = await prisma.studentProfile.findMany({
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
            <FontAwesomeIcon icon={faGraduationCap} className="h-5 w-5 text-blue-600" />
            <span>Campus Student Directory</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Enrolled student profiles for {user.activeMembership?.institutionName}.{" "}
            <Link href="/institution-admin/students" className="font-semibold text-blue-600 hover:underline">
              Open full management
            </Link>
          </p>
        </div>
        <CreateStudentDialog />
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <FontAwesomeIcon icon={faGraduationCap} className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-800">No students found</p>
          <p className="mt-1 text-sm text-slate-500">Add your first student to get started.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {students.map((sp) => (
              <div key={sp.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{sp.institutionUser.user.fullName}</p>
                    <p className="truncate text-[11px] text-slate-500">{sp.institutionUser.user.email}</p>
                  </div>
                  <AccountStatusBadge
                    status={sp.institutionUser.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-mono text-xs text-slate-600">{sp.studentNumber || "N/A"}</span>
                  <Link
                    href={`/institution-admin/students/${sp.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sky-700 hover:bg-sky-50"
                    title="View"
                    aria-label={`View ${sp.institutionUser.user.fullName}`}
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
                    <th className="px-4 py-3">Student Name &amp; Email</th>
                    <th className="px-4 py-3">Student Identifier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Enrolled Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {students.map((sp) => (
                    <tr key={sp.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{sp.institutionUser.user.fullName}</p>
                        <p className="font-mono text-[11px] text-slate-500">{sp.institutionUser.user.email}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">
                        {sp.studentNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3.5">
                        <AccountStatusBadge
                          status={sp.institutionUser.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                        />
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                        {new Date(sp.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/institution-admin/students/${sp.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sky-700 hover:bg-sky-50"
                          title="View / Manage"
                          aria-label={`View ${sp.institutionUser.user.fullName}`}
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
