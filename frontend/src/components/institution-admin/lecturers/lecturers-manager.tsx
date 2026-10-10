"use client";

import { useActionState } from "react";
import { MembershipStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useActionAlerts } from "@/hooks/use-action-alerts";
import {
  Field,
  FormDialog,
  SelectField,
  TextAreaField,
} from "@/components/institution-admin/shared/form-dialog";
import {
  SoftDeleteAction,
  TableActions,
  IconActionLink,
} from "@/components/institution-admin/shared/table-actions";
import {
  createLecturerAction,
  resetUserPasswordAction,
  setLecturerStatusAction,
  updateLecturerAction,
} from "@/features/institution-admin/people-actions";
import type { ActionFormState } from "@/features/institution-admin/form-state";

type Option = { value: string; label: string };

export type LecturerEditData = {
  id: string;
  fullName: string;
  title: string | null;
  bio: string | null;
  departmentId: string | null;
  status: MembershipStatus;
  userId: string;
};

const STATUS_OPTIONS = [
  { value: MembershipStatus.ACTIVE, label: "Active" },
  { value: MembershipStatus.INACTIVE, label: "Inactive" },
];

export function LecturersManager({
  departments,
  defaultCreateOpen = false,
}: {
  departments: Option[];
  defaultCreateOpen?: boolean;
}) {
  return (
    <FormDialog
      title="Add lecturer"
      description="Provision a lecturer account for this institution."
      triggerLabel="Add lecturer"
      action={createLecturerAction}
      submitLabel="Create lecturer"
      defaultOpen={defaultCreateOpen}
    >
      <Field label="Full name" name="fullName" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Title" name="title" placeholder="e.g. Senior Lecturer" />
      <SelectField label="Department" name="departmentId" options={departments} />
      <TextAreaField label="Bio" name="bio" />
      <Field
        label="Temporary password"
        name="temporaryPassword"
        type="password"
        placeholder="Leave blank for default"
      />
    </FormDialog>
  );
}

export function LecturerEditDialog({
  lecturer,
  departments,
  triggerVariant = "icon-edit",
}: {
  lecturer: LecturerEditData;
  departments: Option[];
  triggerVariant?: "button" | "icon-edit";
}) {
  return (
    <FormDialog
      title="Edit lecturer"
      description="Update faculty profile and department."
      triggerLabel="Edit"
      triggerVariant={triggerVariant}
      action={updateLecturerAction}
      submitLabel="Save changes"
    >
      <input type="hidden" name="id" value={lecturer.id} />
      <Field label="Full name" name="fullName" required defaultValue={lecturer.fullName} />
      <Field label="Title" name="title" defaultValue={lecturer.title} />
      <SelectField
        label="Department"
        name="departmentId"
        options={departments}
        defaultValue={lecturer.departmentId}
      />
      <TextAreaField label="Bio" name="bio" defaultValue={lecturer.bio} />
      <SelectField
        label="Status"
        name="status"
        options={STATUS_OPTIONS}
        defaultValue={lecturer.status}
        allowEmptyLabel={null}
        required
      />
    </FormDialog>
  );
}

export function LecturerStatusActions({
  lecturerId,
  status,
  lecturerName = "lecturer",
  mode = "icon",
}: {
  lecturerId: string;
  status: MembershipStatus;
  lecturerName?: string;
  mode?: "icon" | "button";
}) {
  const nextStatus = status === MembershipStatus.ACTIVE ? MembershipStatus.INACTIVE : MembershipStatus.ACTIVE;

  return (
    <SoftDeleteAction
      entityLabel={lecturerName}
      active={status === MembershipStatus.ACTIVE}
      activeLabel="Suspend"
      inactiveLabel="Activate"
      mode={mode}
      confirmActiveTitle={`Suspend ${lecturerName}?`}
      confirmActiveDescription="This action deactivates the lecturer account. Course history is retained and can be restored later."
      onToggle={() => setLecturerStatusAction(lecturerId, nextStatus)}
    />
  );
}

/** View action for the lecturers table (edit/suspend live on the detail page). */
export function LecturerRowActions({ lecturerId }: { lecturerId: string }) {
  return (
    <TableActions>
      <IconActionLink
        href={`/institution-admin/lecturers/${lecturerId}`}
        title="View"
      />
    </TableActions>
  );
}

export function LecturerResetPasswordForm({ userId }: { userId: string }) {
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
        Set a temporary password the lecturer can use to sign in.
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
