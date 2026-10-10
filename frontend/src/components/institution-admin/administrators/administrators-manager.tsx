"use client";

import { MembershipStatus, RoleKey } from "@prisma/client";
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
  createAdministratorAction,
  setAdministratorStatusAction,
  updateAdministratorAction,
} from "@/features/institution-admin/people-actions";
import { STAFF_ROLE_LABELS } from "@/lib/permissions/institution-privileges";

export type AdministratorRow = {
  id: string;
  fullName: string;
  email: string;
  roleKey: RoleKey;
  status: MembershipStatus;
};

const STATUS_OPTIONS = [
  { value: MembershipStatus.ACTIVE, label: "Active" },
  { value: MembershipStatus.INACTIVE, label: "Inactive" },
];

/** Invite form: officers only — Institution Admin is not selectable here. */
const INVITE_ROLE_OPTIONS = [
  { value: RoleKey.ADMIN_OFFICER, label: STAFF_ROLE_LABELS.ADMIN_OFFICER },
  { value: RoleKey.EXAM_OFFICER, label: STAFF_ROLE_LABELS.EXAM_OFFICER },
  { value: RoleKey.FINANCE_OFFICER, label: STAFF_ROLE_LABELS.FINANCE_OFFICER },
];

const EDIT_ROLE_OPTIONS = [
  { value: RoleKey.INSTITUTION_ADMIN, label: STAFF_ROLE_LABELS.INSTITUTION_ADMIN },
  ...INVITE_ROLE_OPTIONS,
];

export function AdministratorsManager({
  defaultCreateOpen = false,
}: {
  defaultCreateOpen?: boolean;
}) {
  return (
    <FormDialog
      title="Invite staff"
      description="Invite a campus officer. Privileges differ by role."
      triggerLabel="Invite administrator"
      action={createAdministratorAction}
      submitLabel="Invite"
      defaultOpen={defaultCreateOpen}
    >
      <Field label="Full name" name="fullName" required />
      <Field label="Email" name="email" type="email" required />
      <SelectField
        label="Role"
        name="roleKey"
        options={INVITE_ROLE_OPTIONS}
        defaultValue={RoleKey.ADMIN_OFFICER}
        allowEmptyLabel={null}
        required
      />
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
      description="Update name, role, and membership status."
      triggerLabel="Edit"
      triggerVariant={triggerVariant}
      action={updateAdministratorAction}
      submitLabel="Save changes"
    >
      <input type="hidden" name="id" value={admin.id} />
      <Field label="Full name" name="fullName" required defaultValue={admin.fullName} />
      <SelectField
        label="Role"
        name="roleKey"
        options={EDIT_ROLE_OPTIONS}
        defaultValue={admin.roleKey}
        allowEmptyLabel={null}
        required
      />
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
  const nextStatus =
    status === MembershipStatus.ACTIVE ? MembershipStatus.INACTIVE : MembershipStatus.ACTIVE;

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

/** View-only action for the administrators table. */
export function AdministratorRowActions({ adminId }: { adminId: string }) {
  return (
    <TableActions>
      <IconActionLink
        href={`/institution-admin/administrators/${adminId}`}
        title="View"
      />
    </TableActions>
  );
}
