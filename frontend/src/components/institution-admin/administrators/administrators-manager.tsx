"use client";

import { MembershipStatus } from "@prisma/client";
import {
  Field,
  FormDialog,
  SelectField,
} from "@/components/institution-admin/shared/form-dialog";
import {
  SoftDeleteAction,
  TableActions,
} from "@/components/institution-admin/shared/table-actions";
import {
  createAdministratorAction,
  setAdministratorStatusAction,
  updateAdministratorAction,
} from "@/features/institution-admin/people-actions";

export type AdministratorRow = {
  id: string;
  fullName: string;
  email: string;
  status: MembershipStatus;
};

const STATUS_OPTIONS = [
  { value: MembershipStatus.ACTIVE, label: "Active" },
  { value: MembershipStatus.INACTIVE, label: "Inactive" },
];

export function AdministratorsManager({
  defaultCreateOpen = false,
}: {
  defaultCreateOpen?: boolean;
}) {
  return (
    <FormDialog
      title="Invite administrator"
      description="Add an institution administrator. Platform Super Admins cannot be created here."
      triggerLabel="Invite administrator"
      action={createAdministratorAction}
      submitLabel="Invite"
      defaultOpen={defaultCreateOpen}
    >
      <Field label="Full name" name="fullName" required />
      <Field label="Email" name="email" type="email" required />
      <Field
        label="Temporary password"
        name="temporaryPassword"
        type="password"
        placeholder="Leave blank for default"
      />
    </FormDialog>
  );
}

export function AdministratorEditDialog({
  admin,
  triggerVariant = "icon-edit",
}: {
  admin: AdministratorRow;
  triggerVariant?: "button" | "icon-edit";
}) {
  return (
    <FormDialog
      title="Edit administrator"
      description="Update name and membership status."
      triggerLabel="Edit"
      triggerVariant={triggerVariant}
      action={updateAdministratorAction}
      submitLabel="Save changes"
    >
      <input type="hidden" name="id" value={admin.id} />
      <Field label="Full name" name="fullName" required defaultValue={admin.fullName} />
      <SelectField
        label="Status"
        name="status"
        options={STATUS_OPTIONS}
        defaultValue={admin.status}
        allowEmptyLabel={null}
        required
      />
    </FormDialog>
  );
}

export function AdministratorStatusActions({
  adminId,
  status,
  isSelf,
  adminName = "administrator",
  mode = "icon",
}: {
  adminId: string;
  status: MembershipStatus;
  isSelf: boolean;
  adminName?: string;
  mode?: "icon" | "button";
}) {
  const nextStatus = status === MembershipStatus.ACTIVE ? MembershipStatus.INACTIVE : MembershipStatus.ACTIVE;

  if (isSelf && status === MembershipStatus.ACTIVE) {
    return (
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300"
        title="You cannot suspend yourself"
        aria-label="You cannot suspend yourself"
      >
        —
      </span>
    );
  }

  return (
    <SoftDeleteAction
      entityLabel={adminName}
      active={status === MembershipStatus.ACTIVE}
      activeLabel="Suspend"
      inactiveLabel="Activate"
      mode={mode}
      confirmActiveTitle={`Suspend ${adminName}?`}
      confirmActiveDescription="This deactivates the administrator membership. You can reactivate later."
      onToggle={() => setAdministratorStatusAction(adminId, nextStatus)}
    />
  );
}

export function AdministratorRowActions({
  admin,
  isSelf,
}: {
  admin: AdministratorRow;
  isSelf: boolean;
}) {
  return (
    <TableActions>
      <AdministratorEditDialog admin={admin} />
      <AdministratorStatusActions
        adminId={admin.id}
        status={admin.status}
        isSelf={isSelf}
        adminName={admin.fullName}
      />
    </TableActions>
  );
}
