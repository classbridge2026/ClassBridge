"use client";

import { useActionState, useEffect } from "react";
import { ClipboardList, Send } from "lucide-react";
import {
  submitCreateAssignment,
  submitPublishAssignment,
  submitAssignmentResponse,
  submitGradeSubmission,
  type AssignmentFormState,
} from "./actions";

export type AssignmentListItem = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  published: boolean;
  submissionCount: number;
  mySubmission?: {
    id: string;
    textContent: string | null;
    grade: number | null;
    feedback: string | null;
    submittedAt: string;
  } | null;
  submissions?: {
    id: string;
    userName: string;
    textContent: string | null;
    grade: number | null;
    feedback: string | null;
    submittedAt: string;
  }[];
};

const initial: AssignmentFormState = { ok: false };

export function AssignmentsPanel({
  courseId,
  assignments,
  canManage,
  canSubmit,
}: {
  courseId: string;
  assignments: AssignmentListItem[];
  canManage: boolean;
  canSubmit: boolean;
}) {
  const [createState, createAction, createPending] = useActionState(
    submitCreateAssignment,
    initial,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <ClipboardList className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Assignments</h2>
          <p className="text-xs text-slate-500">{assignments.length} total</p>
        </div>
      </div>

      {canManage && (
        <form action={createAction} className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <input type="hidden" name="courseId" value={courseId} />
          <div>
            <label className="text-xs font-semibold text-slate-700">Title</label>
            <input
              name="title"
              required
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="Week 3 problem set"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Description</label>
            <textarea
              name="description"
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Due</label>
              <input
                type="datetime-local"
                name="dueAt"
                className="mt-1 block rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <label className="mt-5 flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" name="published" value="true" />
              Publish immediately
            </label>
            <button
              type="submit"
              disabled={createPending}
              className="mt-5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {createPending ? "Creating…" : "Create assignment"}
            </button>
          </div>
          {createState.error && <p className="text-xs text-red-600">{createState.error}</p>}
          {createState.ok && createState.message && (
            <p className="text-xs text-emerald-600">{createState.message}</p>
          )}
        </form>
      )}

      {assignments.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500 italic">No assignments yet.</p>
      ) : (
        <ul className="space-y-4">
          {assignments.map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                  {a.description && (
                    <p className="mt-1 text-xs text-slate-600 whitespace-pre-wrap">{a.description}</p>
                  )}
                  <p className="mt-2 text-[11px] text-slate-500">
                    {a.published ? "Published" : "Draft"}
                    {a.dueAt ? ` · Due ${new Date(a.dueAt).toLocaleString()}` : ""}
                    {canManage ? ` · ${a.submissionCount} submissions` : ""}
                  </p>
                </div>
                {canManage && !a.published && (
                  <PublishButton assignmentId={a.id} courseId={courseId} />
                )}
              </div>

              {canSubmit && a.published && (
                <StudentSubmitForm assignmentId={a.id} existing={a.mySubmission} />
              )}

              {canManage && a.submissions && a.submissions.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-700">Submissions</p>
                  {a.submissions.map((s) => (
                    <GradeForm key={s.id} submission={s} />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PublishButton({
  assignmentId,
  courseId,
}: {
  assignmentId: string;
  courseId: string;
}) {
  return (
    <button
      type="button"
      onClick={() => void submitPublishAssignment(assignmentId, courseId)}
      className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
    >
      Publish
    </button>
  );
}

function StudentSubmitForm({
  assignmentId,
  existing,
}: {
  assignmentId: string;
  existing?: AssignmentListItem["mySubmission"];
}) {
  const [state, action, pending] = useActionState(submitAssignmentResponse, initial);

  return (
    <form action={action} className="space-y-2 rounded-md bg-slate-50 p-3">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <textarea
        name="textContent"
        rows={3}
        defaultValue={existing?.textContent ?? ""}
        placeholder="Your submission…"
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
      />
      {existing?.grade != null && (
        <p className="text-xs text-emerald-700">
          Grade: {existing.grade}
          {existing.feedback ? ` — ${existing.feedback}` : ""}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        <Send className="h-3 w-3" />
        {pending ? "Saving…" : existing ? "Update submission" : "Submit"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && state.message && <p className="text-xs text-emerald-600">{state.message}</p>}
    </form>
  );
}

function GradeForm({
  submission,
}: {
  submission: NonNullable<AssignmentListItem["submissions"]>[number];
}) {
  const [state, action, pending] = useActionState(submitGradeSubmission, initial);

  useEffect(() => {
    // no-op; keeps hooks consistent if we later toast
  }, [state.ok]);

  return (
    <form action={action} className="rounded-md border border-slate-100 p-3 space-y-2">
      <input type="hidden" name="submissionId" value={submission.id} />
      <p className="text-xs font-semibold text-slate-800">{submission.userName}</p>
      <p className="text-xs text-slate-600 whitespace-pre-wrap">
        {submission.textContent || "(empty)"}
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          name="grade"
          type="number"
          min={0}
          max={100}
          step={0.5}
          defaultValue={submission.grade ?? undefined}
          required
          placeholder="Grade"
          className="w-24 rounded-md border border-slate-200 px-2 py-1 text-xs"
        />
        <input
          name="feedback"
          defaultValue={submission.feedback ?? ""}
          placeholder="Feedback"
          className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Grade"}
        </button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
