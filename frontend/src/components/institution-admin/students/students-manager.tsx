"use client";

import { useActionState, useState } from "react";
import { MembershipStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Field,
  FormDialog,
  SelectField,
} from "@/components/institution-admin/shared/form-dialog";
import {
  SoftDeleteAction,
  TableActions,
  IconActionLink,
} from "@/components/institution-admin/shared/table-actions";
import {
  createStudentAction,
  resetUserPasswordAction,
  setStudentStatusAction,
  updateStudentAction,
} from "@/features/institution-admin/people-actions";
import type { ActionFormState } from "@/features/institution-admin/form-state";
import { isLikelyGoogleEmail } from "@/lib/email/google-email-shared";
import { cn } from "@/lib/utils";
import { useActionAlerts } from "@/hooks/use-action-alerts";

export type Option = { value: string; label: string };

export type StudentEditData = {
  id: string;
  fullName: string;
  studentNumber: string | null;
  departmentId: string | null;
  programId: string | null;
  status: MembershipStatus;
  userId: string;
};

const STATUS_OPTIONS = [
  { value: MembershipStatus.ACTIVE, label: "Active" },
  { value: MembershipStatus.INACTIVE, label: "Inactive" },
];

export function StudentsManager({
  departments,
  programs,
  defaultCreateOpen = false,
}: {
  departments: Option[];
  programs: Option[];
  defaultCreateOpen?: boolean;
}) {
  return (
    <FormDialog
      title="Add student"
      description="Provision a student account for this institution."
      triggerLabel="Add student"
      action={createStudentAction}
      submitLabel="Create student"
      defaultOpen={defaultCreateOpen}
    >
      <Field label="Full name" name="fullName" required />
      <GoogleEmailField />
      <Field label="Student ID" name="studentNumber" placeholder="Optional" />
      <SelectField label="Department" name="departmentId" options={departments} />
      <SelectField label="Program" name="programId" options={programs} />
      <Field
        label="Temporary password"
        name="temporaryPassword"
        type="password"
        placeholder="Leave blank for default"
      />
    </FormDialog>
  );
}

export function StudentEditDialog({
  student,
  departments,
  programs,
  triggerVariant = "icon-edit",
}: {
  student: StudentEditData;
  departments: Option[];
  programs: Option[];
  triggerVariant?: "button" | "icon-edit";
}) {
  return (
    <FormDialog
      title="Edit student"
      description="Update profile and academic placement."
      triggerLabel="Edit"
      triggerVariant={triggerVariant}
      action={updateStudentAction}
      submitLabel="Save changes"
    >
      <input type="hidden" name="id" value={student.id} />
      <Field label="Full name" name="fullName" required defaultValue={student.fullName} />
      <Field label="Student ID" name="studentNumber" defaultValue={student.studentNumber} />
      <SelectField
        label="Department"
        name="departmentId"
        options={departments}
        defaultValue={student.departmentId}
      />
      <SelectField
        label="Program"
        name="programId"
        options={programs}
        defaultValue={student.programId}
      />
      <SelectField
        label="Status"
        name="status"
        options={STATUS_OPTIONS}
        defaultValue={student.status}
        allowEmptyLabel={null}
        required
      />
    </FormDialog>
  );
}

export function StudentStatusActions({
  studentId,
  status,
  studentName = "student",
  mode = "icon",
}: {
  studentId: string;
  status: MembershipStatus;
  studentName?: string;
  mode?: "icon" | "button";
}) {
  const nextStatus = status === MembershipStatus.ACTIVE ? MembershipStatus.INACTIVE : MembershipStatus.ACTIVE;

  return (
    <SoftDeleteAction
      entityLabel={studentName}
      active={status === MembershipStatus.ACTIVE}
      activeLabel="Suspend"
      inactiveLabel="Activate"
      mode={mode}
      confirmActiveTitle={`Suspend ${studentName}?`}
      confirmActiveDescription="This action deactivates the student account. Academic history is retained and can be restored later."
      onToggle={() => setStudentStatusAction(studentId, nextStatus)}
    />
  );
}

/** View action for the students table (edit/suspend live on the detail page). */
export function StudentRowActions({ studentId }: { studentId: string }) {
  return (
    <TableActions>
      <IconActionLink
        href={`/institution-admin/students/${studentId}`}
        title="View"
      />
    </TableActions>
  );
}

function GoogleEmailField() {
  const [email, setEmail] = useState("");
  const touched = email.includes("@");
  const looksGoogle = isLikelyGoogleEmail(email);
  const hint =
    !touched
      ? "Must be a Google-connected email (Gmail or Google Workspace)."
      : looksGoogle
        ? "Looks like Gmail — invite can be delivered."
        : "We’ll verify Google Workspace MX on submit. Prefer Gmail if unsure.";

  return (
    <div className="space-y-1.5">
      <label htmlFor="student-email" className="block text-xs font-semibold text-slate-700">
        Email <span className="text-red-500">*</span>
      </label>
      <input
        id="student-email"
        name="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@gmail.com"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500/30 focus:border-blue-400 focus:ring-2"
      />
      <p
        className={cn(
          "text-[11px]",
          touched && looksGoogle ? "font-medium text-emerald-600" : "text-slate-500",
        )}
      >
        {hint}
      </p>
    </div>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(
    resetUserPasswordAction,
    null as ActionFormState | null,
  );
  useActionAlerts(state, { successTitle: "Password reset", errorTitle: "Could not reset password" });

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <input type="hidden" name="userId" value={userId} />
      <h3 className="text-sm font-bold text-slate-900">Reset password</h3>
      <p className="text-xs text-slate-500">
        Set a temporary password the student can use to sign in.
      </p>
      <Field
        label="Temporary password"
        name="temporaryPassword"
        type="password"
        placeholder="Min. 8 characters (optional)"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}
