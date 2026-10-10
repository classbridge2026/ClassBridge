"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitCreateStudent, type StudentFormState } from "@/features/students/actions";
import { GraduationCap, Plus, X, CheckCircle2, AlertTriangle } from "lucide-react";

const initialState: StudentFormState | null = null;

export function CreateStudentDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitCreateStudent, initialState);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9"
      >
        <Plus className="h-4 w-4" />
        <span>Add Student</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add Campus Student</h2>
                  <p className="text-xs text-slate-500">Create login identity and student profile</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
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

              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-slate-700 font-semibold text-xs">
                  Full Name
                </Label>
                <Input id="fullName" name="fullName" required placeholder="e.g. Aminata Kamara" />
                {state?.fieldErrors?.fullName ? (
                  <p className="text-red-600">{state.fieldErrors.fullName}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700 font-semibold text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. student@campus.edu"
                />
                {state?.fieldErrors?.email ? (
                  <p className="text-red-600">{state.fieldErrors.email}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="studentNumber" className="text-slate-700 font-semibold text-xs">
                    Student Number (optional)
                  </Label>
                  <Input id="studentNumber" name="studentNumber" placeholder="e.g. STU-1001" />
                  {state?.fieldErrors?.studentNumber ? (
                    <p className="text-red-600">{state.fieldErrors.studentNumber}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="temporaryPassword" className="text-slate-700 font-semibold text-xs">
                    Temp Password (optional)
                  </Label>
                  <Input
                    id="temporaryPassword"
                    name="temporaryPassword"
                    type="password"
                    placeholder="Defaults if blank"
                  />
                  {state?.fieldErrors?.temporaryPassword ? (
                    <p className="text-red-600">{state.fieldErrors.temporaryPassword}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs">
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={pending}
                  className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {pending ? "Creating…" : "Create Student"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
