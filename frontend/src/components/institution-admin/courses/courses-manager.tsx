"use client";

import { useTransition } from "react";
import { CourseStatus } from "@prisma/client";
import {
  createCourseAction,
  setCourseStatusAction,
  updateCourseAction,
} from "@/features/institution-admin/academic-actions";
import { FormDialog, Field, TextAreaField, SelectField } from "@/components/institution-admin/shared/form-dialog";
import { Button } from "@/components/ui/button";
import {
  SoftDeleteAction,
  TableActions,
  IconActionLink,
} from "@/components/institution-admin/shared/table-actions";

export type CourseFormItem = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  lecturerProfileId: string | null;
  departmentId: string | null;
  programId: string | null;
  status: CourseStatus;
};

type Option = { value: string; label: string };

export function CreateCourseDialog({
  defaultOpen = false,
  lecturers,
  departments,
  programs,
}: {
  defaultOpen?: boolean;
  lecturers: Option[];
  departments: Option[];
  programs: Option[];
}) {
  return (
    <FormDialog
      title="Create course"
      description="Add a course and optionally assign a lecturer."
      triggerLabel="Create course"
      action={createCourseAction}
      submitLabel="Create"
      defaultOpen={defaultOpen}
    >
      <Field label="Code" name="code" required placeholder="e.g. CS101" />
      <Field label="Title" name="title" required placeholder="e.g. Introduction to Programming" />
      <SelectField label="Lecturer" name="lecturerProfileId" options={lecturers} />
      <SelectField label="Department" name="departmentId" options={departments} />
      <SelectField label="Program" name="programId" options={programs} />
      <TextAreaField label="Description" name="description" />
    </FormDialog>
  );
}

export function EditCourseDialog({
  course,
  lecturers,
  departments,
  programs,
  triggerVariant = "icon-edit",
}: {
  course: CourseFormItem;
  lecturers: Option[];
  departments: Option[];
  programs: Option[];
  triggerVariant?: "button" | "icon-edit";
}) {
  return (
    <FormDialog
      title="Edit course"
      description="Update course details and assignments."
      triggerLabel="Edit"
      triggerVariant={triggerVariant}
      action={updateCourseAction}
      submitLabel="Save changes"
    >
      <input type="hidden" name="id" value={course.id} />
      <Field label="Code" name="code" required defaultValue={course.code} />
      <Field label="Title" name="title" required defaultValue={course.title} />
      <SelectField
        label="Lecturer"
        name="lecturerProfileId"
        options={lecturers}
        defaultValue={course.lecturerProfileId}
      />
      <SelectField
        label="Department"
        name="departmentId"
        options={departments}
        defaultValue={course.departmentId}
      />
      <SelectField
        label="Program"
        name="programId"
        options={programs}
        defaultValue={course.programId}
      />
      <TextAreaField label="Description" name="description" defaultValue={course.description} />
      <SelectField
        label="Status"
        name="status"
        defaultValue={course.status}
        allowEmptyLabel={null}
        options={[
          { value: "DRAFT", label: "Draft" },
          { value: "ACTIVE", label: "Active" },
          { value: "ARCHIVED", label: "Archived" },
        ]}
      />
    </FormDialog>
  );
}

export function CourseStatusButton({
  id,
  status,
  nextStatus,
  label,
}: {
  id: string;
  status: CourseStatus;
  nextStatus: CourseStatus;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant={nextStatus === "ARCHIVED" ? "secondary" : "outline"}
      disabled={pending || status === nextStatus}
      onClick={() => startTransition(async () => {
        await setCourseStatusAction(id, nextStatus);
      })}
    >
      {pending ? "Updating…" : label}
    </Button>
  );
}

export function CourseArchiveAction({
  id,
  status,
  title = "course",
}: {
  id: string;
  status: CourseStatus;
  title?: string;
}) {
  const archived = status === "ARCHIVED";
  return (
    <SoftDeleteAction
      entityLabel={title}
      active={!archived}
      activeLabel="Archive"
      inactiveLabel="Restore"
      confirmActiveTitle={`Archive ${title}?`}
      confirmActiveDescription="Archiving keeps historical enrollments and results. The course can be restored later."
      confirmInactiveTitle={`Restore ${title}?`}
      confirmInactiveDescription="This will set the course back to Active."
      onToggle={() =>
        setCourseStatusAction(id, archived ? CourseStatus.ACTIVE : CourseStatus.ARCHIVED)
      }
    />
  );
}

export function CourseRowActions({
  course,
  lecturers,
  departments,
  programs,
}: {
  course: CourseFormItem;
  lecturers: Option[];
  departments: Option[];
  programs: Option[];
}) {
  return (
    <TableActions>
      <IconActionLink href={`/institution-admin/courses/${course.id}`} title="View" />
      <EditCourseDialog
        course={course}
        lecturers={lecturers}
        departments={departments}
        programs={programs}
      />
      <CourseArchiveAction id={course.id} status={course.status} title={course.title} />
    </TableActions>
  );
}

export function CoursesManager({
  defaultOpen = false,
  lecturers,
  departments,
  programs,
}: {
  defaultOpen?: boolean;
  lecturers: Option[];
  departments: Option[];
  programs: Option[];
}) {
  return (
    <CreateCourseDialog
      defaultOpen={defaultOpen}
      lecturers={lecturers}
      departments={departments}
      programs={programs}
    />
  );
}
