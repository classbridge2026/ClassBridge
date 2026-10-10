"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import {
  Archive,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/super-admin/shared/status-badge";
import { EmptyState } from "@/components/super-admin/shared/empty-state";
import {
  checkAdminEmailAction,
  submitCreateInstitution,
  submitPermanentDeleteInstitution,
  submitRestoreInstitution,
  submitToggleInstitutionStatus,
  submitTrashInstitution,
  submitUpdateInstitution,
  type AdminEmailCheckResult,
  type InstitutionFormState,
} from "@/features/institutions/actions";
import { cn, formatDate } from "@/lib/utils";

export type InstitutionListItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  timezone: string;
  createdAt: string;
  students: number;
  lecturers: number;
  planKey: string | null;
};

const initialFormState: InstitutionFormState = { ok: false };

type ConfirmKind = "suspend" | "trash" | "restore" | "delete";

type ConfirmState = {
  kind: ConfirmKind;
  id: string;
};

export function InstitutionsManager({
  institutions,
  openCreateByDefault = false,
}: {
  institutions: InstitutionListItem[];
  openCreateByDefault?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [showCreate, setShowCreate] = useState(openCreateByDefault);
  const [editing, setEditing] = useState<InstitutionListItem | null>(null);
  const [formState, setFormState] = useState<InstitutionFormState>(initialFormState);
  const [editFormState, setEditFormState] = useState<InstitutionFormState>(initialFormState);
  const [deleteFormState, setDeleteFormState] = useState<InstitutionFormState>(initialFormState);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [emailCheck, setEmailCheck] = useState<AdminEmailCheckResult | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return institutions.filter((item) => {
      if (status !== "ALL" && item.status !== status) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.timezone.toLowerCase().includes(q)
      );
    });
  }, [institutions, query, status]);

  const stats = useMemo(
    () => ({
      total: institutions.filter((i) => i.status !== "TRASHED").length,
      active: institutions.filter((i) => i.status === "ACTIVE").length,
      inactive: institutions.filter((i) => i.status === "INACTIVE").length,
      trashed: institutions.filter((i) => i.status === "TRASHED").length,
    }),
    [institutions],
  );

  useEffect(() => {
    const email = adminEmail.trim();
    if (!email || !email.includes("@")) {
      setEmailCheck(null);
      setEmailChecking(false);
      return;
    }

    let cancelled = false;
    setEmailChecking(true);
    const timer = window.setTimeout(() => {
      void checkAdminEmailAction(email).then((result) => {
        if (!cancelled) {
          setEmailCheck(result);
          setEmailChecking(false);
          if (result.ok && result.registered && result.fullName) {
            setAdminFullName((current) => current.trim() || result.fullName || "");
          }
        }
      });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [adminEmail]);

  function closeCreate() {
    setShowCreate(false);
    setFormState(initialFormState);
    setAdminEmail("");
    setAdminFullName("");
    setEmailCheck(null);
  }

  function openEdit(item: InstitutionListItem) {
    setEditing(item);
    setEditFormState(initialFormState);
  }

  function runConfirmAction() {
    if (!confirm) return;
    const { kind, id } = confirm;

    startTransition(async () => {
      if (kind === "suspend") {
        await submitToggleInstitutionStatus(id);
        setFlash("Institution status updated.");
      } else if (kind === "trash") {
        const result = await submitTrashInstitution(id);
        setFlash(result.message ?? (result.ok ? "Moved to trash." : result.error ?? "Action failed."));
      } else if (kind === "restore") {
        const result = await submitRestoreInstitution(id);
        setFlash(result.message ?? (result.ok ? "Restored." : result.error ?? "Action failed."));
      }
      setConfirm(null);
    });
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await submitCreateInstitution(formState, formData);
      setFormState(result);
      if (result.ok) {
        setFlash(result.message ?? "Institution created.");
        closeCreate();
        event.currentTarget.reset();
      }
    });
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await submitUpdateInstitution(editFormState, formData);
      setEditFormState(result);
      if (result.ok) {
        setFlash(result.message ?? "Institution updated.");
        setEditing(null);
      }
    });
  }

  function submitPermanentDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await submitPermanentDeleteInstitution(deleteFormState, formData);
      setDeleteFormState(result);
      if (result.ok) {
        setFlash(result.message ?? "Institution permanently deleted.");
        setConfirm(null);
        setDeleteFormState(initialFormState);
      }
    });
  }

  const confirmTarget = confirm ? institutions.find((item) => item.id === confirm.id) : null;

  return (
    <div className="space-y-6">
      {flash ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>{flash}</p>
          <button
            type="button"
            className="font-semibold text-emerald-700 hover:underline"
            onClick={() => setFlash(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Institutions",
            value: stats.total,
            icon: Building2,
            accent: "bg-sky-50 text-sky-700 ring-sky-100",
          },
          {
            label: "Active",
            value: stats.active,
            icon: CheckCircle2,
            accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
          },
          {
            label: "Suspended",
            value: stats.inactive,
            icon: ShieldAlert,
            accent: "bg-amber-50 text-amber-700 ring-amber-100",
          },
          {
            label: "Trashed",
            value: stats.trashed,
            icon: Archive,
            accent: "bg-rose-50 text-rose-700 ring-rose-100",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-50" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
              </div>
              <span
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-xl ring-4",
                  card.accent,
                )}
              >
                <card.icon className="h-5 w-5" aria-hidden />
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, code, or timezone…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Suspended</option>
              <option value="TRASHED">Trashed</option>
            </select>
          </div>
          <Button
            type="button"
            onClick={() => {
              setShowCreate((v) => !v);
              setFormState(initialFormState);
            }}
            className="shrink-0 bg-teal-700 hover:bg-teal-800 border-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Institution
          </Button>
        </div>

        {showCreate ? (
          <form
            className="mt-5 space-y-4 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/70 via-white to-slate-50 p-4 sm:p-5"
            onSubmit={submitCreate}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Institution</h3>
              <p className="mt-1 text-sm text-slate-500">
                Provisions the campus tenant, primary administrator, trial subscription, and sends a
                password setup email.
              </p>
            </div>

            {formState.error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formState.error}</p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Institution Name</Label>
                <Input id="name" name="name" required placeholder="Northview University" />
                {formState.fieldErrors?.name ? (
                  <p className="text-xs text-red-600">{formState.fieldErrors.name}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Institution Code (slug)</Label>
                <Input id="slug" name="slug" required placeholder="northview" />
                {formState.fieldErrors?.slug ? (
                  <p className="text-xs text-red-600">{formState.fieldErrors.slug}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" name="timezone" defaultValue="UTC" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adminFullName">Primary Administrator</Label>
                <Input
                  id="adminFullName"
                  name="adminFullName"
                  required
                  placeholder="Ada Admin"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                />
                {formState.fieldErrors?.adminFullName ? (
                  <p className="text-xs text-red-600">{formState.fieldErrors.adminFullName}</p>
                ) : null}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="adminEmail">Administrator Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@northview.edu"
                    className="pl-10"
                  />
                </div>
                {formState.fieldErrors?.adminEmail ? (
                  <p className="text-xs text-red-600">{formState.fieldErrors.adminEmail}</p>
                ) : null}
                <div className="min-h-[1.5rem]">
                  {emailChecking ? (
                    <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Checking registration…
                    </p>
                  ) : null}
                  {!emailChecking && emailCheck?.ok && emailCheck.registered ? (
                    <p className="inline-flex items-start gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs text-sky-800">
                      <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {emailCheck.message}
                    </p>
                  ) : null}
                  {!emailChecking && emailCheck?.ok && !emailCheck.registered ? (
                    <p className="inline-flex items-start gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs text-teal-800">
                      <UserPlus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {emailCheck.message}
                    </p>
                  ) : null}
                  {!emailChecking && emailCheck && !emailCheck.ok && emailCheck.error ? (
                    <p className="text-xs text-amber-700">{emailCheck.error}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-teal-700 hover:bg-teal-800 border-teal-700"
              >
                {isPending ? "Creating…" : "Create Institution"}
              </Button>
              <Button type="button" variant="secondary" onClick={closeCreate}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title={institutions.length === 0 ? "No institutions yet" : "No institutions found"}
          description={
            institutions.length === 0
              ? "Create your first institution to get started."
              : "Try changing your search or filters."
          }
          action={
            institutions.length === 0 ? (
              <Button
                type="button"
                onClick={() => setShowCreate(true)}
                className="bg-teal-700 hover:bg-teal-800 border-teal-700"
              >
                <Plus className="h-4 w-4" />
                Add Institution
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Institution</th>
                    <th className="px-4 py-3.5">Code</th>
                    <th className="px-4 py-3.5">Students</th>
                    <th className="px-4 py-3.5">Lecturers</th>
                    <th className="px-4 py-3.5">Subscription</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Created</th>
                    <th className="px-4 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/80">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.timezone}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{item.slug}</td>
                      <td className="px-4 py-3.5">{item.students}</td>
                      <td className="px-4 py-3.5">{item.lecturers}</td>
                      <td className="px-4 py-3.5 text-slate-600">{item.planKey ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <RowActions
                          item={item}
                          onEdit={() => openEdit(item)}
                          onSuspend={() => setConfirm({ kind: "suspend", id: item.id })}
                          onTrash={() => setConfirm({ kind: "trash", id: item.id })}
                          onRestore={() => setConfirm({ kind: "restore", id: item.id })}
                          onDelete={() => {
                            setDeleteFormState(initialFormState);
                            setConfirm({ kind: "delete", id: item.id });
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 lg:hidden">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{item.name}</h3>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{item.slug}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-slate-400">Students</dt>
                    <dd className="font-semibold text-slate-800">{item.students}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-slate-400">Lecturers</dt>
                    <dd className="font-semibold text-slate-800">{item.lecturers}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-slate-400">Plan</dt>
                    <dd className="font-semibold text-slate-800">{item.planKey ?? "—"}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-slate-400">Created</dt>
                    <dd className="font-semibold text-slate-800">{formatDate(item.createdAt)}</dd>
                  </div>
                </dl>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <RowActions
                    item={item}
                    onEdit={() => openEdit(item)}
                    onSuspend={() => setConfirm({ kind: "suspend", id: item.id })}
                    onTrash={() => setConfirm({ kind: "trash", id: item.id })}
                    onRestore={() => setConfirm({ kind: "restore", id: item.id })}
                    onDelete={() => {
                      setDeleteFormState(initialFormState);
                      setConfirm({ kind: "delete", id: item.id });
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-institution-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onSubmit={submitEdit}
          >
            <h3 id="edit-institution-title" className="text-lg font-bold text-slate-900">
              Update Institution
            </h3>
            <p className="mt-1 text-sm text-slate-500">Edit details for {editing.name}.</p>

            {editFormState.error ? (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {editFormState.error}
              </p>
            ) : null}

            <input type="hidden" name="id" value={editing.id} />
            <div className="mt-4 grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Institution Name</Label>
                <Input id="edit-name" name="name" required defaultValue={editing.name} />
                {editFormState.fieldErrors?.name ? (
                  <p className="text-xs text-red-600">{editFormState.fieldErrors.name}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-slug">Institution Code (slug)</Label>
                <Input id="edit-slug" name="slug" required defaultValue={editing.slug} />
                {editFormState.fieldErrors?.slug ? (
                  <p className="text-xs text-red-600">{editFormState.fieldErrors.slug}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-timezone">Timezone</Label>
                <Input id="edit-timezone" name="timezone" required defaultValue={editing.timezone} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  name="status"
                  defaultValue={editing.status}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-600/20"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Suspended</option>
                  <option value="TRASHED">Trashed</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-teal-700 hover:bg-teal-800 border-teal-700"
              >
                {isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {confirm && confirm.kind !== "delete" && confirmTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
          >
            <h3 id="confirm-title" className="text-lg font-bold text-slate-900">
              {confirm.kind === "suspend"
                ? confirmTarget.status === "ACTIVE"
                  ? "Suspend Institution?"
                  : "Activate Institution?"
                : confirm.kind === "trash"
                  ? "Move to Trash?"
                  : "Restore Institution?"}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {confirm.kind === "suspend"
                ? confirmTarget.status === "ACTIVE"
                  ? `${confirmTarget.name} will lose access to ClassBridge until reactivated.`
                  : `${confirmTarget.name} will regain platform access.`
                : confirm.kind === "trash"
                  ? `${confirmTarget.name} will be moved to Trash. You can restore it later.`
                  : `${confirmTarget.name} will be restored to Active status.`}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={confirm.kind === "restore" ? "primary" : "danger"}
                disabled={isPending}
                onClick={runConfirmAction}
              >
                {isPending
                  ? "Working…"
                  : confirm.kind === "suspend"
                    ? confirmTarget.status === "ACTIVE"
                      ? "Suspend"
                      : "Activate"
                    : confirm.kind === "trash"
                      ? "Move to Trash"
                      : "Restore"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {confirm?.kind === "delete" && confirmTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onSubmit={submitPermanentDelete}
          >
            <h3 id="delete-title" className="text-lg font-bold text-slate-900">
              Permanently Delete?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This cannot be undone. Type <span className="font-mono font-semibold">{confirmTarget.slug}</span>{" "}
              to confirm deletion of {confirmTarget.name}.
            </p>

            {deleteFormState.error ? (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {deleteFormState.error}
              </p>
            ) : null}

            <input type="hidden" name="id" value={confirmTarget.id} />
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="confirmSlug">Confirm slug</Label>
              <Input id="confirmSlug" name="confirmSlug" required placeholder={confirmTarget.slug} />
              {deleteFormState.fieldErrors?.confirmSlug ? (
                <p className="text-xs text-red-600">{deleteFormState.fieldErrors.confirmSlug}</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setConfirm(null);
                  setDeleteFormState(initialFormState);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={isPending}>
                {isPending ? "Deleting…" : "Delete Forever"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function RowActions({
  item,
  onEdit,
  onSuspend,
  onTrash,
  onRestore,
  onDelete,
}: {
  item: InstitutionListItem;
  onEdit: () => void;
  onSuspend: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <Link
        href={`/super-admin/institutions/${item.id}`}
        className="text-xs font-semibold text-sky-700 hover:underline"
      >
        View
      </Link>
      {item.status !== "TRASHED" ? (
        <>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
            Update
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-amber-700 hover:underline"
            onClick={onSuspend}
          >
            {item.status === "ACTIVE" ? "Suspend" : "Activate"}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"
            onClick={onTrash}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
            onClick={onRestore}
          >
            <RotateCcw className="h-3 w-3" />
            Restore
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
            Delete forever
          </button>
        </>
      )}
    </div>
  );
}
