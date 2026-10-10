import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireInstitutionAdmin, assertSameInstitution } from "@/lib/permissions/institution-admin";
import { prisma } from "@/lib/db/prisma";
import { InstPageHeader } from "@/components/institution-admin/shared/page-header";
import { InstStatusBadge } from "@/components/institution-admin/shared/status-badge";
import {
  EditDepartmentDialog,
  DepartmentStatusButton,
} from "@/components/institution-admin/departments/departments-manager";

export const metadata: Metadata = {
  title: "Department — Institution Admin",
};

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { institutionId } = await requireInstitutionAdmin();
  const { id } = await params;

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      programs: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true, status: true },
      },
      courses: {
        orderBy: { code: "asc" },
        select: { id: true, code: true, title: true, status: true },
      },
      lecturers: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          institutionUser: {
            include: { user: { select: { fullName: true, email: true } } },
          },
        },
      },
      students: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          institutionUser: {
            include: { user: { select: { fullName: true, email: true } } },
          },
        },
      },
      _count: {
        select: {
          programs: true,
          courses: true,
          lecturers: true,
          students: true,
        },
      },
    },
  });

  if (!department || !assertSameInstitution(department.institutionId, institutionId)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <InstPageHeader
        title={department.name}
        description={`Department code ${department.code}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <EditDepartmentDialog
              department={{
                id: department.id,
                name: department.name,
                code: department.code,
                description: department.description,
                status: department.status,
              }}
              triggerVariant="button"
            />
            <DepartmentStatusButton
              id={department.id}
              status={department.status}
              name={department.name}
              mode="button"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Programs", value: department._count.programs, href: "/institution-admin/programs" },
          { label: "Courses", value: department._count.courses, href: "/institution-admin/courses" },
          { label: "Lecturers", value: department._count.lecturers, href: "/institution-admin/lecturers" },
          { label: "Students", value: department._count.students, href: "/institution-admin/students" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-bold text-slate-900">Details</h3>
          <InstStatusBadge status={department.status} />
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{department.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Code</dt>
            <dd className="mt-1 font-mono text-sm text-slate-900">{department.code}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {department.description || "No description provided."}
            </dd>
          </div>
        </dl>
      </section>

      <SectionList
        title="Programs"
        empty="No programs in this department."
        items={department.programs.map((p) => ({
          href: `/institution-admin/programs/${p.id}`,
          primary: p.name,
          secondary: p.code,
          status: p.status,
        }))}
      />

      <SectionList
        title="Courses"
        empty="No courses in this department."
        items={department.courses.map((c) => ({
          href: `/institution-admin/courses/${c.id}`,
          primary: c.title,
          secondary: c.code,
          status: c.status,
        }))}
      />

      <SectionList
        title="Lecturers"
        empty="No lecturers assigned to this department."
        items={department.lecturers.map((l) => ({
          href: `/institution-admin/lecturers/${l.id}`,
          primary: l.institutionUser.user.fullName,
          secondary: l.institutionUser.user.email,
        }))}
      />

      <SectionList
        title="Students"
        empty="No students in this department."
        items={department.students.map((s) => ({
          href: `/institution-admin/students/${s.id}`,
          primary: s.institutionUser.user.fullName,
          secondary: s.institutionUser.user.email,
        }))}
      />
    </div>
  );
}

function SectionList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { href: string; primary: string; secondary?: string | null; status?: string }[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-slate-900">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.href} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <Link href={item.href} className="text-sm font-semibold text-slate-900 hover:text-blue-600">
                  {item.primary}
                </Link>
                {item.secondary ? (
                  <p className="truncate text-xs text-slate-500">{item.secondary}</p>
                ) : null}
              </div>
              {item.status ? <InstStatusBadge status={item.status} /> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
