"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitCreateCourse, type CourseFormState } from "@/features/courses/actions";
import { BookOpen, Plus, X, CheckCircle2, AlertTriangle } from "lucide-react";

const initialState: CourseFormState | null = null;

interface LecturerOption {
  id: string;
  name: string;
  title?: string | null;
}

export function CreateCourseDialog({ lecturers }: { lecturers: LecturerOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitCreateCourse, initialState);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9"
      >
        <Plus className="h-4 w-4" />
        <span>Create Course</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Create New Course</h2>
                  <p className="text-xs text-slate-500">Add course code, title, and assigned lecturer</p>
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

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-slate-700 font-semibold text-xs">
                    Course Code
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="e.g. CS101"
                    required
                    className="h-10 border-slate-300 font-mono text-slate-900 uppercase focus:border-blue-600"
                  />
                  {state?.fieldErrors?.code ? (
                    <p className="text-red-600 font-semibold">{state.fieldErrors.code}</p>
                  ) : null}
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="title" className="text-slate-700 font-semibold text-xs">
                    Course Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Web Systems Development"
                    required
                    className="h-10 border-slate-300 text-slate-900 focus:border-blue-600"
                  />
                  {state?.fieldErrors?.title ? (
                    <p className="text-red-600 font-semibold">{state.fieldErrors.title}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lecturerProfileId" className="text-slate-700 font-semibold text-xs">
                  Assigned Primary Lecturer
                </Label>
                <select
                  id="lecturerProfileId"
                  name="lecturerProfileId"
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">-- Unassigned --</option>
                  {lecturers.map((lec) => (
                    <option key={lec.id} value={lec.id}>
                      {lec.name} ({lec.title || "Lecturer"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-slate-700 font-semibold text-xs">
                  Course Description (Optional)
                </Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Overview of syllabus, prerequisites, and learning outcomes..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={handleClose} className="border-slate-300 text-slate-700">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={pending}>
                  {pending ? "Creating…" : "Create Course"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
