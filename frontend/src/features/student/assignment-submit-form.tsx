"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import {
  submitAssignmentResponse,
  type AssignmentFormState,
} from "@/features/assignments/actions";

const initial: AssignmentFormState = { ok: false };

export function StudentAssignmentSubmitForm({ assignmentId }: { assignmentId: string }) {
  const [state, action, pending] = useActionState(submitAssignmentResponse, initial);

  return (
    <form action={action} className="space-y-3" encType="multipart/form-data">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <div>
        <label htmlFor="textContent" className="text-xs font-semibold text-slate-700">
          Written response
        </label>
        <textarea
          id="textContent"
          name="textContent"
          rows={5}
          placeholder="Type your answer or notes…"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="file" className="text-xs font-semibold text-slate-700">
          Attachment (optional)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#2563EB] hover:file:bg-blue-100"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Send className="h-3.5 w-3.5" />
        {pending ? "Submitting…" : "Submit assignment"}
      </button>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state.ok && state.message ? (
        <p className="text-xs text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}
