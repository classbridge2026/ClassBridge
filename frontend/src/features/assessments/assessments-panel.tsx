"use client";

import { useActionState } from "react";
import { GraduationCap } from "lucide-react";
import {
  submitCreateAssessment,
  submitPublishAssessment,
  submitTakeAssessment,
  type AssessmentFormState,
} from "./actions";

export type AssessmentListItem = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  questionCount: number;
  attemptCount: number;
  myAttempt?: { score: number | null; maxScore: number | null; submittedAt: string } | null;
  questions?: {
    id: string;
    prompt: string;
    type: string;
    options: string[] | null;
    points: number;
  }[];
};

const initial: AssessmentFormState = { ok: false };

export function AssessmentsPanel({
  courseId,
  assessments,
  canManage,
  canTake,
}: {
  courseId: string;
  assessments: AssessmentListItem[];
  canManage: boolean;
  canTake: boolean;
}) {
  const [createState, createAction, createPending] = useActionState(
    submitCreateAssessment,
    initial,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <GraduationCap className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Assessments</h2>
          <p className="text-xs text-slate-500">{assessments.length} total</p>
        </div>
      </div>

      {canManage && (
        <form action={createAction} className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <input type="hidden" name="courseId" value={courseId} />
          <input name="title" required placeholder="Quiz title" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <textarea name="description" rows={2} placeholder="Description" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <input name="questionPrompt" required placeholder="First question prompt" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <div className="grid gap-2 sm:grid-cols-2">
            <select name="questionType" defaultValue="MULTIPLE_CHOICE" className="rounded-md border border-slate-200 px-3 py-2 text-sm">
              <option value="MULTIPLE_CHOICE">Multiple choice</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="SHORT_ANSWER">Short answer</option>
            </select>
            <input name="correctAnswer" required placeholder="Correct answer" className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <textarea
            name="options"
            rows={3}
            placeholder="Options (one per line, for multiple choice)"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-3">
            <input name="points" type="number" min={1} defaultValue={1} className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm" />
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" name="published" value="true" />
              Publish immediately
            </label>
            <button type="submit" disabled={createPending} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
              {createPending ? "Creating…" : "Create assessment"}
            </button>
          </div>
          {createState.error && <p className="text-xs text-red-600">{createState.error}</p>}
          {createState.ok && createState.message && (
            <p className="text-xs text-emerald-600">{createState.message}</p>
          )}
        </form>
      )}

      {assessments.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500 italic">No assessments yet.</p>
      ) : (
        <ul className="space-y-4">
          {assessments.map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                  {a.description && <p className="mt-1 text-xs text-slate-600">{a.description}</p>}
                  <p className="mt-2 text-[11px] text-slate-500">
                    {a.published ? "Published" : "Draft"} · {a.questionCount} questions
                    {canManage ? ` · ${a.attemptCount} attempts` : ""}
                  </p>
                </div>
                {canManage && !a.published && (
                  <button
                    type="button"
                    onClick={() => void submitPublishAssessment(a.id, courseId)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Publish
                  </button>
                )}
              </div>

              {canTake && a.published && a.myAttempt && (
                <p className="text-xs text-emerald-700">
                  Score: {a.myAttempt.score}/{a.myAttempt.maxScore} (submitted{" "}
                  {new Date(a.myAttempt.submittedAt).toLocaleString()})
                </p>
              )}

              {canTake && a.published && !a.myAttempt && a.questions && (
                <TakeForm assessmentId={a.id} questions={a.questions} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TakeForm({
  assessmentId,
  questions,
}: {
  assessmentId: string;
  questions: NonNullable<AssessmentListItem["questions"]>;
}) {
  const [state, action, pending] = useActionState(submitTakeAssessment, initial);

  return (
    <form action={action} className="space-y-3 rounded-md bg-slate-50 p-3">
      <input type="hidden" name="assessmentId" value={assessmentId} />
      {questions.map((q) => (
        <div key={q.id} className="space-y-1">
          <p className="text-xs font-semibold text-slate-800">
            {q.prompt} <span className="font-normal text-slate-500">({q.points} pts)</span>
          </p>
          {q.options && q.options.length > 0 ? (
            <select
              name={`answer_${q.id}`}
              required
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select answer
              </option>
              {q.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={`answer_${q.id}`}
              required
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit answers"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && (
        <p className="text-xs text-emerald-600">
          {state.message}
          {state.score != null && state.maxScore != null
            ? ` Score: ${state.score}/${state.maxScore}`
            : ""}
        </p>
      )}
    </form>
  );
}
