"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

export type LecturerStudentRow = {
  id: string;
  fullName: string;
  email: string;
  studentNumber: string | null;
  courses: { id: string; code: string; title: string }[];
  attendanceCount: number;
  submissionCount: number;
  gradedAvg: number | null;
};

export function StudentsDirectory({ students }: { students: LecturerStudentRow[] }) {
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) {
      for (const c of s.courses) map.set(c.id, `${c.code} — ${c.title}`);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [students]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (courseFilter !== "all" && !s.courses.some((c) => c.id === courseFilter)) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.studentNumber?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [students, query, courseFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search students</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or student ID"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="sm:w-64">
          <span className="sr-only">Filter by course</span>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All courses</option>
            {courseOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-900">No students found</p>
          <p className="mt-1 text-xs text-slate-500">
            {students.length === 0
              ? "Students enrolled in your courses will appear here."
              : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">ID</th>
                <th className="px-4 py-3 font-semibold">Courses</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">Attendance</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">Assignments</th>
                <th className="px-4 py-3 font-semibold">View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{s.fullName}</p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-slate-600 md:table-cell">
                    {s.studentNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {s.courses.map((c) => c.code).join(", ")}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-slate-600 lg:table-cell">
                    {s.attendanceCount} sessions
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-slate-600 lg:table-cell">
                    {s.submissionCount} submitted
                    {s.gradedAvg != null ? ` · avg ${s.gradedAvg.toFixed(0)}%` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/lecturer/students/${s.id}`}
                      className="text-xs font-bold text-[#2563EB] hover:underline"
                    >
                      Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
