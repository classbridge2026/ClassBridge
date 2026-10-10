"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCircleCheck,
  faEye,
  faPenToSquare,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/super-admin/shared/status-badge";
import { EmptyState } from "@/components/super-admin/shared/empty-state";
import { UserAvatar } from "@/components/super-admin/shared/user-avatar";
import {
  createUserAction,
  deleteUserAction,
  toggleUserStatusAction,
  updateUserAction,
  type SuperAdminUserFormState,
} from "@/features/super-admin/actions";
import { cn, formatDate } from "@/lib/utils";

export type PlatformWideUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  isPlatformSuperAdmin: boolean;
  avatarUrl: string | null;
  roleLabels: string[];
  institutionNames: string[];
};

const initialFormState: SuperAdminUserFormState = { ok: false };

type ConfirmKind = "suspend" | "delete";

type ConfirmState = {
  kind: ConfirmKind;
  id: string;
};

function roleLabel(key: string): string {
  switch (key) {
    case "STUDENT":
      return "Student";
    case "LECTURER":
      return "Lecturer";
    case "INSTITUTION_ADMIN":
      return "Institution Admin";
    case "PLATFORM":
      return "Platform";
    case "SUPER_ADMIN":
      return "Super Admin";
    default:
      return key;
  }
}

export function UsersManager({
  users,
  stats,
}: {
  users: PlatformWideUser[];
  stats: {
    total: number;
    students: number;
    lecturers: number;
    institutionAdmins: number;
    suspended: number;
  };
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PlatformWideUser | null>(null);
  const [formState, setFormState] = useState<SuperAdminUserFormState>(initialFormState);
  const [editFormState, setEditFormState] = useState<SuperAdminUserFormState>(initialFormState);
  const [deleteFormState, setDeleteFormState] = useState<SuperAdminUserFormState>(initialFormState);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (status !== "ALL" && user.status !== status) return false;
      if (role !== "ALL" && !user.roleLabels.includes(role)) return false;
      if (!q) return true;
      return (
        user.fullName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q) ||
        (user.phone ?? "").toLowerCase().includes(q) ||
        user.institutionNames.some((name) => name.toLowerCase().includes(q)) ||
        user.roleLabels.some((label) => label.toLowerCase().includes(q))
      );
    });
  }, [users, query, role, status]);

  const confirmTarget = confirm ? users.find((user) => user.id === confirm.id) : null;

  function closeCreate() {
    setShowCreate(false);
    setFormState(initialFormState);
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createUserAction(formState, formData);
      setFormState(result);
      if (result.ok) {
        setFlash(result.message ?? "User created.");
        closeCreate();
        event.currentTarget.reset();
      }
    });
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateUserAction(editFormState, formData);
      setEditFormState(result);
      if (result.ok) {
        setFlash(result.message ?? "User updated.");
        setEditing(null);
      }
    });
  }

  function submitDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await deleteUserAction(deleteFormState, formData);
      setDeleteFormState(result);
      if (result.ok) {
        setFlash(result.message ?? "User deleted.");
        setConfirm(null);
        setDeleteFormState(initialFormState);
      }
    });
  }

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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total Users",
            value: stats.total,
            icon: Users,
            accent: "bg-sky-50 text-sky-700 ring-sky-100",
          },
          {
            label: "Students",
            value: stats.students,
            icon: GraduationCap,
            accent: "bg-teal-50 text-teal-700 ring-teal-100",
          },
          {
            label: "Lecturers",
            value: stats.lecturers,
            icon: UserRound,
            accent: "bg-indigo-50 text-indigo-700 ring-indigo-100",
          },
          {
            label: "Institution Admins",
            value: stats.institutionAdmins,
            icon: Shield,
            accent: "bg-violet-50 text-violet-700 ring-violet-100",
          },
          {
            label: "Suspended Users",
            value: stats.suspended,
            icon: ShieldAlert,
            accent: "bg-amber-50 text-amber-700 ring-amber-100",
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
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, user ID, institution, role…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
              aria-label="Filter by role"
            >
              <option value="ALL">All roles</option>
              <option value="STUDENT">Student</option>
              <option value="LECTURER">Lecturer</option>
              <option value="INSTITUTION_ADMIN">Institution Admin</option>
              <option value="PLATFORM">Platform User</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Suspended</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <Button
            type="button"
            onClick={() => {
              setShowCreate((v) => !v);
              setFormState(initialFormState);
            }}
            className="shrink-0 border-teal-700 bg-teal-700 hover:bg-teal-800"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {showCreate ? (
          <form
            className="mt-5 space-y-4 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/70 via-white to-slate-50 p-4 sm:p-5"
            onSubmit={submitCreate}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">Add User</h3>
              <p className="mt-1 text-sm text-slate-500">
                Create a platform account. Institution roles can be assigned from institution workflows.
              </p>
            </div>

            {formState.error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formState.error}</p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required placeholder="Ada Lovelace" />
                {formState.fieldErrors?.fullName ? (
                  <p className="text-xs text-red-600">{formState.fieldErrors.fullName}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="ada@example.com" />
                {formState.fieldErrors?.email ? (
                  <p className="text-xs text-red-600">{formState.fieldErrors.email}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Temporary password</Label>
                <Input id="password" name="password" type="password" required minLength={6} />
                {formState.fieldErrors?.password ? (
                  <p className="text-xs text-red-600">{formState.fieldErrors.password}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+1 555 0100" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="ACTIVE"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-600/20"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Suspended</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="isPlatformSuperAdmin"
                    value="true"
                    className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  Platform Super Admin
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={isPending}
                className="border-teal-700 bg-teal-700 hover:bg-teal-800"
              >
                {isPending ? "Creating…" : "Create User"}
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
          icon={<Users className="h-8 w-8" />}
          title="No users found"
          description="Try changing your search or filters, or add a new user."
          action={
            <Button
              type="button"
              onClick={() => setShowCreate(true)}
              className="border-teal-700 bg-teal-700 hover:bg-teal-800"
            >
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-3 xl:px-4">User</th>
                    <th className="whitespace-nowrap px-3 py-3 xl:px-4">Email</th>
                    <th className="hidden whitespace-nowrap px-3 py-3 lg:table-cell xl:px-4">Role</th>
                    <th className="hidden whitespace-nowrap px-3 py-3 xl:table-cell xl:px-4">
                      Institution
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 xl:px-4">Status</th>
                    <th className="hidden whitespace-nowrap px-3 py-3 lg:table-cell xl:px-4">
                      Created
                    </th>
                    <th className="sticky right-0 z-10 whitespace-nowrap bg-slate-50/95 px-2 py-3 text-center shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)] xl:px-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((user) => (
                    <tr key={user.id} className="group transition hover:bg-slate-50/80">
                      <td className="max-w-[12rem] px-3 py-2.5 xl:max-w-[16rem] xl:px-4">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <UserAvatar name={user.fullName} src={user.avatarUrl} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">{user.fullName}</div>
                            {user.phone ? (
                              <div className="truncate text-xs text-slate-400">{user.phone}</div>
                            ) : (
                              <div className="truncate text-xs text-slate-400 lg:hidden">
                                {user.roleLabels.map(roleLabel).join(", ") || "No role"}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[11rem] px-3 py-2.5 xl:max-w-[14rem] xl:px-4">
                        <span className="block truncate text-slate-600" title={user.email}>
                          {user.email}
                        </span>
                      </td>
                      <td className="hidden max-w-[9rem] px-3 py-2.5 lg:table-cell xl:px-4">
                        <span
                          className="block truncate text-slate-600"
                          title={user.roleLabels.map(roleLabel).join(", ") || undefined}
                        >
                          {user.roleLabels.map(roleLabel).join(", ") || "—"}
                        </span>
                      </td>
                      <td className="hidden max-w-[10rem] px-3 py-2.5 xl:table-cell xl:px-4">
                        <span
                          className="block truncate text-slate-600"
                          title={user.institutionNames.join(", ") || undefined}
                        >
                          {user.institutionNames.join(", ") || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 xl:px-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2.5 text-slate-500 lg:table-cell xl:px-4">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="sticky right-0 z-10 whitespace-nowrap bg-white px-2 py-2.5 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)] group-hover:bg-slate-50/80 xl:px-3">
                        <RowActions
                          user={user}
                          onEdit={() => {
                            setEditing(user);
                            setEditFormState(initialFormState);
                          }}
                          onSuspend={() => setConfirm({ kind: "suspend", id: user.id })}
                          onDelete={() => {
                            setDeleteFormState(initialFormState);
                            setConfirm({ kind: "delete", id: user.id });
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((user) => (
              <article
                key={user.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar name={user.fullName} src={user.avatarUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">{user.fullName}</h3>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <StatusBadge status={user.status} />
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      {user.roleLabels.map(roleLabel).join(", ") || "No role"} ·{" "}
                      {user.institutionNames.join(", ") || "No institution"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Joined {formatDate(user.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3">
                  <RowActions
                    user={user}
                    onEdit={() => {
                      setEditing(user);
                      setEditFormState(initialFormState);
                    }}
                    onSuspend={() => setConfirm({ kind: "suspend", id: user.id })}
                    onDelete={() => {
                      setDeleteFormState(initialFormState);
                      setConfirm({ kind: "delete", id: user.id });
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
            aria-labelledby="edit-user-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onSubmit={submitEdit}
          >
            <div className="flex items-center gap-3">
              <UserAvatar name={editing.fullName} src={editing.avatarUrl} size="lg" />
              <div>
                <h3 id="edit-user-title" className="text-lg font-bold text-slate-900">
                  Update User
                </h3>
                <p className="text-sm text-slate-500">{editing.email}</p>
              </div>
            </div>

            {editFormState.error ? (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {editFormState.error}
              </p>
            ) : null}

            <input type="hidden" name="userId" value={editing.id} />
            <div className="mt-4 grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-fullName">Full name</Label>
                <Input id="edit-fullName" name="fullName" required defaultValue={editing.fullName} />
                {editFormState.fieldErrors?.fullName ? (
                  <p className="text-xs text-red-600">{editFormState.fieldErrors.fullName}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={editing.email}
                />
                {editFormState.fieldErrors?.email ? (
                  <p className="text-xs text-red-600">{editFormState.fieldErrors.email}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" name="phone" type="tel" defaultValue={editing.phone ?? ""} />
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
                  <option value="PENDING">Pending</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-password">New password (optional)</Label>
                <Input id="edit-password" name="password" type="password" minLength={6} />
                {editFormState.fieldErrors?.password ? (
                  <p className="text-xs text-red-600">{editFormState.fieldErrors.password}</p>
                ) : null}
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isPlatformSuperAdmin"
                  value="true"
                  defaultChecked={editing.isPlatformSuperAdmin}
                  className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                Platform Super Admin
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="border-teal-700 bg-teal-700 hover:bg-teal-800"
              >
                {isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {confirm?.kind === "suspend" && confirmTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center gap-3">
              <UserAvatar name={confirmTarget.fullName} src={confirmTarget.avatarUrl} />
              <h3 className="text-lg font-bold text-slate-900">
                {confirmTarget.status === "ACTIVE" ? "Suspend User?" : "Activate User?"}
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {confirmTarget.status === "ACTIVE"
                ? `${confirmTarget.fullName} will be prevented from signing in.`
                : `${confirmTarget.fullName} will be able to sign in again.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={confirmTarget.status === "ACTIVE" ? "danger" : "primary"}
                disabled={isPending}
                onClick={() => {
                  const formData = new FormData();
                  formData.set("userId", confirmTarget.id);
                  formData.set("status", confirmTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
                  startTransition(async () => {
                    await toggleUserStatusAction(formData);
                    setFlash(
                      confirmTarget.status === "ACTIVE"
                        ? "User suspended."
                        : "User activated.",
                    );
                    setConfirm(null);
                  });
                }}
              >
                {confirmTarget.status === "ACTIVE" ? "Suspend User" : "Activate User"}
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
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onSubmit={submitDelete}
          >
            <div className="flex items-center gap-3">
              <UserAvatar name={confirmTarget.fullName} src={confirmTarget.avatarUrl} />
              <h3 className="text-lg font-bold text-slate-900">Permanently Delete?</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              This cannot be undone. Type{" "}
              <span className="font-semibold">{confirmTarget.email}</span> to confirm deleting{" "}
              {confirmTarget.fullName}.
            </p>

            {deleteFormState.error ? (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {deleteFormState.error}
              </p>
            ) : null}

            <input type="hidden" name="userId" value={confirmTarget.id} />
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="confirmEmail">Confirm email</Label>
              <Input
                id="confirmEmail"
                name="confirmEmail"
                type="email"
                required
                placeholder={confirmTarget.email}
              />
              {deleteFormState.fieldErrors?.confirmEmail ? (
                <p className="text-xs text-red-600">{deleteFormState.fieldErrors.confirmEmail}</p>
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

function actionBtnClass(tone: "sky" | "teal" | "amber" | "rose") {
  const tones = {
    sky: "text-sky-700 hover:bg-sky-50 hover:text-sky-800",
    teal: "text-teal-700 hover:bg-teal-50 hover:text-teal-800",
    amber: "text-amber-700 hover:bg-amber-50 hover:text-amber-800",
    rose: "text-rose-700 hover:bg-rose-50 hover:text-rose-800",
  };
  return cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40",
    tones[tone],
  );
}

function RowActions({
  user,
  onEdit,
  onSuspend,
  onDelete,
}: {
  user: PlatformWideUser;
  onEdit: () => void;
  onSuspend: () => void;
  onDelete: () => void;
}) {
  const suspending = user.status === "ACTIVE";

  return (
    <div className="flex items-center justify-center gap-0.5 sm:gap-1">
      <Link
        href={`/super-admin/users/${user.id}`}
        className={actionBtnClass("sky")}
        title="View"
        aria-label={`View ${user.fullName}`}
      >
        <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
      </Link>
      <button
        type="button"
        className={actionBtnClass("teal")}
        title="Update"
        aria-label={`Update ${user.fullName}`}
        onClick={onEdit}
      >
        <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={actionBtnClass("amber")}
        title={suspending ? "Suspend" : "Activate"}
        aria-label={suspending ? `Suspend ${user.fullName}` : `Activate ${user.fullName}`}
        onClick={onSuspend}
      >
        <FontAwesomeIcon
          icon={suspending ? faBan : faCircleCheck}
          className="h-3.5 w-3.5"
        />
      </button>
      <button
        type="button"
        className={actionBtnClass("rose")}
        title="Delete"
        aria-label={`Delete ${user.fullName}`}
        onClick={onDelete}
      >
        <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
