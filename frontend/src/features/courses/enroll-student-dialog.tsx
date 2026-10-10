"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { submitEnrollStudent, type CourseFormState } from "@/features/courses/actions";
import { UserPlus, X, CheckCircle2, AlertTriangle, GraduationCap } from "lucide-react";

const initialState: CourseFormState | null = null;

interface StudentOption {
  id: string;
  name: string;
  studentId?: string | null;
  email: string;
}

export function EnrollStudentDialog({
  courseId,
  availableStudents,
}: {
  courseId: string;
  availableStudents: StudentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitEnrollStudent, initialState);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9"
      >
        <UserPlus className="h-4 w-4" />
        <span>Enroll Student</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Enroll Campus Student</h2>
                  <p className="text-xs text-slate-500">Select a student from your institution roster to enroll in this course</p>
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
                <Label htmlFor="studentProfileId" className="text-slate-700 font-semibold text-xs">
                  Select Student
                </Label>
                {availableStudents.length === 0 ? (
                  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-xs">
                    All students in this institution are currently enrolled in this course or no student profiles exist.
                  </div>
                ) : (
                  <select
                    id="studentProfileId"
                    name="studentProfileId"
                    required
                    className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">-- Choose Student --</option>
                    {availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.studentId || "No Matrix ID"}) — {s.email}
                      </option>
                    ))}
                  </select>
                )}
                {state?.fieldErrors?.studentProfileId ? (
                  <p className="text-red-600 font-semibold">{state.fieldErrors.studentProfileId}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={handleClose} className="border-slate-300 text-slate-700">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={pending || availableStudents.length === 0}
                >
                  {pending ? "Enrolling…" : "Enroll Student"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
