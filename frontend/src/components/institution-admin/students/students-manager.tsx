"use client";

import { useActionState } from "react";
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
      <Field label="Email" name="email" type="email" required />
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

/** Compact View / Edit / Suspend actions for the students table. */
export function StudentRowActions({
  student,
  departments,
  programs,
}: {
  student: StudentEditData & { fullName: string };
  departments: Option[];
  programs: Option[];
}) {
  return (
    <TableActions>
      <IconActionLink
        href={`/institution-admin/students/${student.id}`}
        title="View"
      />
      <StudentEditDialog student={student} departments={departments} programs={programs} />
      <StudentStatusActions
        studentId={student.id}
        status={student.status}
        studentName={student.fullName}
      />
    </TableActions>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(
    resetUserPasswordAction,
    null as ActionFormState | null,
  );

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
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{state.error}</p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}
