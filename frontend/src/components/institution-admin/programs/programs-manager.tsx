"use client";

import { AcademicStatus } from "@prisma/client";
import {
  createProgramAction,
  setProgramStatusAction,
  updateProgramAction,
} from "@/features/institution-admin/academic-actions";
import { FormDialog, Field, TextAreaField, SelectField } from "@/components/institution-admin/shared/form-dialog";
import {
  SoftDeleteAction,
  TableActions,
  IconActionLink,
} from "@/components/institution-admin/shared/table-actions";

export type ProgramFormItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  departmentId: string | null;
  durationMonths: number | null;
  status: AcademicStatus;
};

export function CreateProgramDialog({
  defaultOpen = false,
  departments,
}: {
  defaultOpen?: boolean;
  departments: { value: string; label: string }[];
}) {
  return (
    <FormDialog
      title="Create program"
      description="Add a new academic program."
      triggerLabel="Create program"
      action={createProgramAction}
      submitLabel="Create"
      defaultOpen={defaultOpen}
    >
      <Field label="Name" name="name" required placeholder="e.g. BSc Computer Science" />
      <Field label="Code" name="code" required placeholder="e.g. BSCS" />
      <SelectField label="Department" name="departmentId" options={departments} />
      <Field label="Duration (months)" name="durationMonths" type="number" placeholder="e.g. 48" />
      <TextAreaField label="Description" name="description" />
    </FormDialog>
  );
}

export function EditProgramDialog({
  program,
  departments,
  triggerVariant = "icon-edit",
}: {
  program: ProgramFormItem;
  departments: { value: string; label: string }[];
  triggerVariant?: "button" | "icon-edit";
}) {
  return (
    <FormDialog
      title="Edit program"
      description="Update program details."
      triggerLabel="Edit"
      triggerVariant={triggerVariant}
      action={updateProgramAction}
      submitLabel="Save changes"
    >
      <input type="hidden" name="id" value={program.id} />
      <Field label="Name" name="name" required defaultValue={program.name} />
      <Field label="Code" name="code" required defaultValue={program.code} />
      <SelectField
        label="Department"
        name="departmentId"
        options={departments}
        defaultValue={program.departmentId}
      />
      <Field
        label="Duration (months)"
        name="durationMonths"
        type="number"
        defaultValue={program.durationMonths}
      />
      <TextAreaField label="Description" name="description" defaultValue={program.description} />
      <SelectField
        label="Status"
        name="status"
        defaultValue={program.status}
        allowEmptyLabel={null}
        options={[
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ]}
      />
    </FormDialog>
  );
}

export function ProgramStatusButton({
  id,
  status,
  name = "program",
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
      confirmActiveDescription="This deactivates the program. Related records are retained and can be restored later."
      onToggle={() => setProgramStatusAction(id, next)}
    />
  );
}

export function ProgramRowActions({
  program,
  departments,
}: {
  program: ProgramFormItem;
  departments: { value: string; label: string }[];
}) {
  return (
    <TableActions>
      <IconActionLink href={`/institution-admin/programs/${program.id}`} title="View" />
      <EditProgramDialog program={program} departments={departments} />
      <ProgramStatusButton id={program.id} status={program.status} name={program.name} />
    </TableActions>
  );
}

export function ProgramsManager({
  defaultOpen = false,
  departments,
}: {
  defaultOpen?: boolean;
  departments: { value: string; label: string }[];
}) {
  return <CreateProgramDialog defaultOpen={defaultOpen} departments={departments} />;
}
