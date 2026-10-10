"use client";

import { useActionState } from "react";
import {
  submitGradeSubmission,
  type AssignmentFormState,
} from "@/features/assignments/actions";

export type GradingSubmission = {
  id: string;
  userName: string;
  userEmail: string;
  textContent: string | null;
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
};

const initial: AssignmentFormState = { ok: false };

function GradeRow({ submission }: { submission: GradingSubmission }) {
  const [state, action, pending] = useActionState(submitGradeSubmission, initial);
  const status =
    submission.grade != null
      ? "Graded"
      : "Submitted";

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">{submission.userName}</p>
          <p className="text-xs text-slate-500">{submission.userEmail}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Submitted{" "}
            {new Date(submission.submittedAt).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {" · "}
            <span
              className={
                status === "Graded" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"
              }
            >
              {status}
            </span>
          </p>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        {submission.textContent || "(No text submitted)"}
      </p>

      <form action={action} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <input type="hidden" name="submissionId" value={submission.id} />
        <label className="block text-xs font-semibold text-slate-700">
          Score
          <input
            name="grade"
            type="number"
            min={0}
            max={100}
            step={0.5}
            required
            defaultValue={submission.grade ?? undefined}
            className="mt-1 block w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block min-w-0 flex-1 text-xs font-semibold text-slate-700">
          Feedback
          <input
            name="feedback"
            defaultValue={submission.feedback ?? ""}
            placeholder="Comments for the student"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save grade"}
        </button>
      </form>
      {state.error ? <p className="mt-2 text-xs text-red-600">{state.error}</p> : null}
      {state.ok && state.message ? (
        <p className="mt-2 text-xs text-emerald-600">{state.message}</p>
      ) : null}
    </li>
  );
}

export function AssignmentGradingPanel({
  submissions,
}: {
  submissions: GradingSubmission[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Submissions</h3>
        <p className="text-xs text-slate-500">
          {submissions.length} total · {submissions.filter((s) => s.grade == null).length} to grade
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No submissions yet. Students will appear here after they submit work.
        </div>
      ) : (
        <ul className="space-y-3">
          {submissions.map((s) => (
            <GradeRow key={s.id} submission={s} />
          ))}
        </ul>
      )}
    </section>
  );
}
