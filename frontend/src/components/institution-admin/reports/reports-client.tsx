"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportsExportButton({ csv, filename }: { csv: string; filename: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename.replace(/[^\w.-]+/g, "-");
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}

export function ReportsFilters({
  departments,
  programs,
  courses,
  lecturers,
  values,
}: {
  departments: { id: string; name: string }[];
  programs: { id: string; name: string }[];
  courses: { id: string; label: string }[];
  lecturers: { id: string; label: string }[];
  values: {
    from: string;
    to: string;
    departmentId: string;
    programId: string;
    courseId: string;
    lecturerId: string;
    status: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const next = new URLSearchParams();
    for (const key of [
      "from",
      "to",
      "departmentId",
      "programId",
      "courseId",
      "lecturerId",
      "status",
    ]) {
      const value = String(formData.get(key) ?? "").trim();
      if (value) next.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  return (
    <form
      action={onSubmit}
      className={`grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 ${pending ? "opacity-70" : ""}`}
    >
      <label className="space-y-1 text-xs">
        <span className="font-semibold text-slate-600">From</span>
        <input
          type="date"
          name="from"
          defaultValue={values.from}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        />
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-semibold text-slate-600">To</span>
        <input
          type="date"
          name="to"
          defaultValue={values.to}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        />
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-semibold text-slate-600">Department</span>
        <select
          name="departmentId"
          defaultValue={values.departmentId}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        >
          <option value="">All</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-semibold text-slate-600">Program</span>
        <select
          name="programId"
          defaultValue={values.programId}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        >
          <option value="">All</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-semibold text-slate-600">Course</span>
        <select
          name="courseId"
          defaultValue={values.courseId}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        >
          <option value="">All</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-semibold text-slate-600">Lecturer</span>
        <select
          name="lecturerId"
          defaultValue={values.lecturerId}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        >
          <option value="">All</option>
          {lecturers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-semibold text-slate-600">Status</span>
        <select
          name="status"
          defaultValue={values.status}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        >
          <option value="">All</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ARCHIVED">ARCHIVED</option>
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="LIVE">LIVE</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </label>
      <div className="flex items-end gap-2">
        <Button type="submit" size="sm" className="w-full" disabled={pending}>
          {pending ? "Applying…" : "Apply filters"}
        </Button>
      </div>
    </form>
  );
}
