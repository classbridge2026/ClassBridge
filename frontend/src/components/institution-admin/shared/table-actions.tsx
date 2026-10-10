"use client";

import { useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCircleCheck,
  faEdit,
  faEye,
  faPlus,
  faTrash,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { showConfirm, showError, showSuccess, toUserMessage } from "@/lib/ui/swal";

type Tone = "sky" | "teal" | "amber" | "rose" | "slate";

const TONES: Record<Tone, string> = {
  sky: "text-sky-700 hover:bg-sky-50 hover:text-sky-800",
  teal: "text-teal-700 hover:bg-teal-50 hover:text-teal-800",
  amber: "text-amber-700 hover:bg-amber-50 hover:text-amber-800",
  rose: "text-rose-700 hover:bg-rose-50 hover:text-rose-800",
  slate: "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
};

export function iconActionClass(tone: Tone = "slate") {
  return cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:opacity-50",
    TONES[tone],
  );
}

export function IconActionButton({
  title,
  tone = "slate",
  icon,
  onClick,
  disabled,
  type = "button",
}: {
  title: string;
  tone?: Tone;
  icon: IconDefinition;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={iconActionClass(tone)}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
    >
      <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
    </button>
  );
}

export function IconActionLink({
  href,
  title,
  tone = "sky",
  icon = faEye,
}: {
  href: string;
  title: string;
  tone?: Tone;
  icon?: IconDefinition;
}) {
  return (
    <Link href={href} className={iconActionClass(tone)} title={title} aria-label={title}>
      <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
    </Link>
  );
}

export function TableActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex flex-nowrap items-center justify-end gap-0.5 sm:gap-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Confirmation dialog for soft-delete / suspend / deactivate / cancel. */
export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
  pending = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
      >
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={danger ? "danger" : "primary"}
            size="sm"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Soft-delete / status toggle with confirmation.
 * Prefer this over hard-delete for academic records.
 */
export function SoftDeleteAction({
  entityLabel,
  active,
  activeLabel = "Suspend",
  inactiveLabel = "Activate",
  confirmActiveTitle,
  confirmActiveDescription,
  confirmInactiveTitle,
  confirmInactiveDescription,
  onToggle,
  disabled = false,
  mode = "icon",
}: {
  entityLabel: string;
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  confirmActiveTitle?: string;
  confirmActiveDescription?: string;
  confirmInactiveTitle?: string;
  confirmInactiveDescription?: string;
  onToggle: () => Promise<unknown>;
  disabled?: boolean;
  mode?: "icon" | "button";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const title = active
    ? (confirmActiveTitle ?? `${activeLabel} ${entityLabel}?`)
    : (confirmInactiveTitle ?? `${inactiveLabel} ${entityLabel}?`);
  const description = active
    ? (confirmActiveDescription ??
      `This will deactivate the record. Historical data is retained. You can reactivate later.`)
    : (confirmInactiveDescription ?? `This will restore the record to active status.`);
  const label = active ? activeLabel : inactiveLabel;

  const runToggle = () => {
    startTransition(async () => {
      const confirmed = await showConfirm({
        title,
        text: description,
        confirmText: label,
        danger: active,
      });
      if (!confirmed) return;

      try {
        const result = (await onToggle()) as { ok?: boolean; error?: string; message?: string } | void;
        if (result && typeof result === "object" && result.ok === false) {
          void showError(toUserMessage(result.error), `Could not ${label.toLowerCase()}`);
          return;
        }
        void showSuccess(
          result && typeof result === "object" && result.message
            ? result.message
            : `${entityLabel} ${active ? "deactivated" : "activated"} successfully.`,
        );
        router.refresh();
      } catch (error) {
        void showError(error, `Could not ${label.toLowerCase()}`);
      }
    });
  };

  return (
    <span className="inline-flex shrink-0 items-center">
      {mode === "button" ? (
        <Button
          type="button"
          size="sm"
          variant={active ? "danger" : "primary"}
          disabled={disabled || pending}
          onClick={runToggle}
        >
          <FontAwesomeIcon
            icon={active ? faBan : faCircleCheck}
            className="mr-1.5 h-3 w-3"
            aria-hidden
          />
          {label}
        </Button>
      ) : (
        <IconActionButton
          title={label}
          tone={active ? "rose" : "amber"}
          icon={active ? faBan : faCircleCheck}
          disabled={disabled || pending}
          onClick={runToggle}
        />
      )}
    </span>
  );
}

export function EditIconTrigger({ onClick, title = "Edit" }: { onClick: () => void; title?: string }) {
  return <IconActionButton title={title} tone="teal" icon={faEdit} onClick={onClick} />;
}

export function PlusIconTrigger({ onClick, title = "Add" }: { onClick: () => void; title?: string }) {
  return <IconActionButton title={title} tone="teal" icon={faPlus} onClick={onClick} />;
}

export { faEdit, faEye, faTrash, faBan, faCircleCheck, faPlus };
