"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SessionStatus } from "@prisma/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faCheck } from "@fortawesome/free-solid-svg-icons";
import {
  createClassAction,
  setClassStatusAction,
  updateClassAction,
} from "@/features/institution-admin/academic-actions";
import { FormDialog, Field, TextAreaField, SelectField } from "@/components/institution-admin/shared/form-dialog";
import { Button } from "@/components/ui/button";
import {
  IconActionButton,
  IconActionLink,
  TableActions,
} from "@/components/institution-admin/shared/table-actions";
import { toDatetimeLocal } from "@/lib/utils/datetime-local";
import { showConfirm, showError, showSuccess, toUserMessage } from "@/lib/ui/swal";

export { toDatetimeLocal };

export type ClassFormItem = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  status: SessionStatus;
};

type Option = { value: string; label: string };

export function CreateClassDialog({
  defaultOpen = false,
  courses,
}: {
  defaultOpen?: boolean;
  courses: Option[];
}) {
  return (
    <FormDialog
      title="Schedule class"
      description="Create a class session for a course."
      triggerLabel="Schedule class"
      action={createClassAction}
      submitLabel="Create"
      defaultOpen={defaultOpen}
    >
      <SelectField
        label="Course"
        name="courseId"
        options={courses}
        required
        allowEmptyLabel="— Select course —"
      />
      <Field label="Title" name="title" required placeholder="e.g. Week 1 Lecture" />
      <TextAreaField label="Description" name="description" />
      <Field label="Start" name="scheduledStart" type="datetime-local" />
      <Field label="End" name="scheduledEnd" type="datetime-local" />
      <SelectField
        label="Status"
        name="status"
        defaultValue="SCHEDULED"
        allowEmptyLabel={null}
        options={[
          { value: "DRAFT", label: "Draft" },
          { value: "SCHEDULED", label: "Scheduled" },
        ]}
      />
    </FormDialog>
  );
}

export function EditClassDialog({
  session,
  courses,
  triggerVariant = "icon-edit",
}: {
  session: ClassFormItem;
  courses: Option[];
  triggerVariant?: "button" | "icon-edit";
}) {
  return (
    <FormDialog
      title="Edit class"
      description="Update schedule and session details."
      triggerLabel="Edit"
      triggerVariant={triggerVariant}
      action={updateClassAction}
      submitLabel="Save changes"
    >
      <input type="hidden" name="id" value={session.id} />
      <SelectField
        label="Course"
        name="courseId"
        options={courses}
        required
        defaultValue={session.courseId}
        allowEmptyLabel={null}
      />
      <Field label="Title" name="title" required defaultValue={session.title} />
      <TextAreaField label="Description" name="description" defaultValue={session.description} />
      <Field
        label="Start"
        name="scheduledStart"
        type="datetime-local"
        defaultValue={session.scheduledStart ?? ""}
      />
      <Field
        label="End"
        name="scheduledEnd"
        type="datetime-local"
        defaultValue={session.scheduledEnd ?? ""}
      />
      <SelectField
        label="Status"
        name="status"
        defaultValue={session.status === "LIVE" ? "LIVE" : session.status}
        allowEmptyLabel={null}
        options={[
          { value: "DRAFT", label: "Draft" },
          { value: "SCHEDULED", label: "Scheduled" },
          { value: "CANCELLED", label: "Cancelled" },
          ...(session.status === "LIVE" ? [{ value: "LIVE", label: "Live" }] : []),
          ...(session.status === "COMPLETED" ? [{ value: "COMPLETED", label: "Completed" }] : []),
        ]}
      />
    </FormDialog>
  );
}

export function ClassStatusButton({
  id,
  nextStatus,
  label,
  variant = "outline",
  mode = "button",
}: {
  id: string;
  nextStatus: SessionStatus;
  label: string;
  variant?: "outline" | "secondary" | "danger";
  mode?: "button" | "icon";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const danger = nextStatus === "CANCELLED";

  const run = () => {
    startTransition(async () => {
      const confirmed = await showConfirm({
        title: `${label} class?`,
        text: danger
          ? "This cancels the class session. Attendance and history are retained."
          : "Confirm this status change for the class session.",
        confirmText: label,
        danger,
      });
      if (!confirmed) return;

      try {
        const result = await setClassStatusAction(id, nextStatus);
        if (!result.ok) {
          void showError(toUserMessage(result.error), "Could not update class");
          return;
        }
        void showSuccess(result.message ?? `Class marked as ${label.toLowerCase()}.`);
        router.refresh();
      } catch (error) {
        void showError(error, "Could not update class");
      }
    });
  };

  return mode === "icon" ? (
    <IconActionButton
      title={label}
      tone={danger ? "rose" : "amber"}
      icon={danger ? faBan : faCheck}
      disabled={pending}
      onClick={run}
    />
  ) : (
    <Button type="button" size="sm" variant={variant} disabled={pending} onClick={run}>
      <FontAwesomeIcon icon={danger ? faBan : faCheck} className="mr-1.5 h-3 w-3" aria-hidden />
      {label}
    </Button>
  );
}

export function ClassRowActions({
  session,
  courses,
}: {
  session: ClassFormItem;
  courses: Option[];
}) {
  return (
    <TableActions>
      <IconActionLink href={`/institution-admin/classes/${session.id}`} title="View" />
      <EditClassDialog session={session} courses={courses} />
      {session.status === "DRAFT" ? (
        <ClassStatusButton id={session.id} nextStatus="SCHEDULED" label="Publish" mode="icon" />
      ) : null}
      {session.status === "SCHEDULED" || session.status === "DRAFT" ? (
        <ClassStatusButton
          id={session.id}
          nextStatus="CANCELLED"
          label="Cancel"
          variant="danger"
          mode="icon"
        />
      ) : null}
    </TableActions>
  );
}

export function ClassesManager({
  defaultOpen = false,
  courses,
}: {
  defaultOpen?: boolean;
  courses: Option[];
}) {
  return <CreateClassDialog defaultOpen={defaultOpen} courses={courses} />;
}
