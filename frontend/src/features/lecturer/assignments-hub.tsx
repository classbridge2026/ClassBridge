"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  submitCreateAssignment,
  submitPublishAssignment,
  type AssignmentFormState,
} from "@/features/assignments/actions";

export type HubAssignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  published: boolean;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  submissionCount: number;
  ungradedCount: number;
};

const initial: AssignmentFormState = { ok: false };

export function AssignmentsHub({
  courses,
  assignments,
}: {
  courses: { id: string; code: string; title: string }[];
  assignments: HubAssignment[];
}) {
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "ungraded">("all");
  const [createState, createAction, createPending] = useActionState(
    submitCreateAssignment,
    initial,
  );

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (filter === "draft") return !a.published;
      if (filter === "published") return a.published;
      if (filter === "ungraded") return a.ungradedCount > 0;
      return true;
    });
  }, [assignments, filter]);

  return (
    <div className="space-y-6">
      <form
        action={createAction}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h3 className="text-sm font-bold text-slate-900">Create assignment</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">
            Course
            <select
              name="courseId"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              defaultValue={courses[0]?.id}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Title
            <input
              name="title"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Week 3 problem set"
            />
          </label>
        </div>
        <label className="block text-xs font-semibold text-slate-700">
          Instructions
          <textarea
            name="description"
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Describe the assignment expectations…"
          />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-xs font-semibold text-slate-700">
            Due date
            <input
              type="datetime-local"
              name="dueAt"
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" name="published" value="true" />
            Publish immediately
          </label>
          <button
            type="submit"
            disabled={createPending}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {createPending ? "Creating…" : "Create assignment"}
          </button>
        </div>
        {createState.error ? <p className="text-xs text-red-600">{createState.error}</p> : null}
        {createState.ok && createState.message ? (
          <p className="text-xs text-emerald-600">{createState.message}</p>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["draft", "Draft"],
            ["published", "Published"],
            ["ungraded", "Needs grading"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              filter === key
                ? "bg-[#2563EB] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No assignments in this view.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#2563EB]">
                    {a.courseCode}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      a.published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {a.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-500">
                  {a.submissionCount} submission{a.submissionCount === 1 ? "" : "s"}
                  {a.ungradedCount > 0 ? ` · ${a.ungradedCount} to grade` : ""}
                  {a.dueAt
                    ? ` · Due ${new Date(a.dueAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!a.published ? (
                  <button
                    type="button"
                    onClick={() => void submitPublishAssignment(a.id, a.courseId)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Publish
                  </button>
                ) : null}
                <Link
                  href={`/lecturer/assignments/${a.id}`}
                  className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  View &amp; grade
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
