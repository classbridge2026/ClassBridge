"use client";

import { useActionState, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import type { ActionFormState } from "@/features/institution-admin/form-state";
import { iconActionClass } from "@/components/institution-admin/shared/table-actions";

export function FormDialog({
  title,
  description,
  triggerLabel,
  triggerVariant = "button",
  action,
  children,
  submitLabel = "Save",
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  triggerLabel: string;
  /** `icon` renders a compact Font Awesome edit/plus trigger for table action columns. */
  triggerVariant?: "button" | "icon-edit" | "icon-plus";
  action: (prev: ActionFormState | null, formData: FormData) => Promise<ActionFormState>;
  children: ReactNode;
  submitLabel?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionFormState | null, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    null,
  );

  const trigger =
    triggerVariant === "icon-edit" ? (
      <button
        type="button"
        className={iconActionClass("teal")}
        title={triggerLabel}
        aria-label={triggerLabel}
        onClick={() => setOpen(true)}
      >
        <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" />
      </button>
    ) : triggerVariant === "icon-plus" ? (
      <button
        type="button"
        className={iconActionClass("teal")}
        title={triggerLabel}
        aria-label={triggerLabel}
        onClick={() => setOpen(true)}
      >
        <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
      </button>
    ) : (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        {/^(add|create|invite|schedule)/i.test(triggerLabel) ? (
          <FontAwesomeIcon icon={faPlus} className="mr-1.5 h-3 w-3" aria-hidden />
        ) : null}
        {triggerLabel}
      </Button>
    );

  return (
    <>
      {trigger}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
            </div>

            <form action={formAction} className="space-y-4 px-5 py-4">
              {children}

              {state?.error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{state.error}</p>
              ) : null}
              {state?.ok && state.message ? (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  {state.message}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Saving…" : submitLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  error,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  error?: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5 text-xs">
      <span className="font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      {error ? <span className="text-red-600">{error}</span> : null}
    </label>
  );
}

export function TextAreaField({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="block space-y-1.5 text-xs">
      <span className="font-semibold text-slate-700">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  required,
  allowEmptyLabel = "— None —",
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  required?: boolean;
  allowEmptyLabel?: string | null;
}) {
  return (
    <label className="block space-y-1.5 text-xs">
      <span className="font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {allowEmptyLabel !== null ? <option value="">{allowEmptyLabel}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
