"use client";

import { AcademicStatus } from "@prisma/client";
import {
  createDepartmentAction,
  setDepartmentStatusAction,
  updateDepartmentAction,
} from "@/features/institution-admin/academic-actions";
import { FormDialog, Field, TextAreaField, SelectField } from "@/components/institution-admin/shared/form-dialog";
import {
  SoftDeleteAction,
  TableActions,
  IconActionLink,
} from "@/components/institution-admin/shared/table-actions";

export type DepartmentFormItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: AcademicStatus;
};

export function CreateDepartmentDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <FormDialog
      title="Create department"
      description="Add a new academic department for this institution."
      triggerLabel="Create department"
      action={createDepartmentAction}
      submitLabel="Create"
      defaultOpen={defaultOpen}
    >
      <Field label="Name" name="name" required placeholder="e.g. Computer Science" />
      <Field label="Code" name="code" required placeholder="e.g. CS" />
      <TextAreaField label="Description" name="description" />
    </FormDialog>
  );
}

export function EditDepartmentDialog({
  department,
  triggerVariant = "icon-edit",
}: {
  department: DepartmentFormItem;
  triggerVariant?: "button" | "icon-edit";
}) {
  return (
    <FormDialog
      title="Edit department"
      description="Update department details."
      triggerLabel="Edit"
      triggerVariant={triggerVariant}
      action={updateDepartmentAction}
      submitLabel="Save changes"
    >
      <input type="hidden" name="id" value={department.id} />
      <Field label="Name" name="name" required defaultValue={department.name} />
      <Field label="Code" name="code" required defaultValue={department.code} />
      <TextAreaField label="Description" name="description" defaultValue={department.description} />
      <SelectField
        label="Status"
        name="status"
        defaultValue={department.status}
        allowEmptyLabel={null}
        options={[
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ]}
      />
    </FormDialog>
  );
}

export function DepartmentStatusButton({
  id,
  status,
  name = "department",
  mode = "icon",
}: {
  id: string;
  status: AcademicStatus;
  name?: string;
  mode?: "icon" | "button";
}) {
  const next = status === "ACTIVE" ? AcademicStatus.INACTIVE : AcademicStatus.ACTIVE;

  return (
    <SoftDeleteAction
      entityLabel={name}
      active={status === "ACTIVE"}
      activeLabel="Deactivate"
      inactiveLabel="Activate"
      mode={mode}
      confirmActiveTitle={`Deactivate ${name}?`}
      confirmActiveDescription="This deactivates the department. Related records are retained and can be restored later."
      onToggle={() => setDepartmentStatusAction(id, next)}
    />
  );
}

export function DepartmentRowActions({ department }: { department: DepartmentFormItem }) {
  return (
    <TableActions>
      <IconActionLink href={`/institution-admin/departments/${department.id}`} title="View" />
      <EditDepartmentDialog department={department} />
      <DepartmentStatusButton id={department.id} status={department.status} name={department.name} />
    </TableActions>
  );
}

export function DepartmentsManager({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return <CreateDepartmentDialog defaultOpen={defaultOpen} />;
}
