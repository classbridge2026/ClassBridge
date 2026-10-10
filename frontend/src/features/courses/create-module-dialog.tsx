"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitCreateModule, type CourseFormState } from "@/features/courses/actions";
import { Layers, Plus, X, CheckCircle2, AlertTriangle } from "lucide-react";

const initialState: CourseFormState | null = null;

export function CreateModuleDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitCreateModule, initialState);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-9"
      >
        <Plus className="h-4 w-4" />
        <span>Add Module</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add Course Module</h2>
                  <p className="text-xs text-slate-500">Create structured curriculum modules for this course</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={action} className="space-y-4 text-xs" noValidate>
              <input type="hidden" name="courseId" value={courseId} />

              {state?.ok && state.message ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{state.message}</span>
                </div>
              ) : null}

              {state?.error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-900 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{state.error}</span>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-slate-700 font-semibold text-xs">
                  Module Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Module 1: Introduction to DOM & Events"
                  required
                  className="h-10 border-slate-300 text-slate-900 focus:border-indigo-600"
                />
                {state?.fieldErrors?.title ? (
                  <p className="text-red-600 font-semibold">{state.fieldErrors.title}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-slate-700 font-semibold text-xs">
                  Module Summary / Objectives (Optional)
                </Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Summary of topics covered, resources, and live lab objectives..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={handleClose} className="border-slate-300 text-slate-700">
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={pending}>
                  {pending ? "Adding…" : "Add Module"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
