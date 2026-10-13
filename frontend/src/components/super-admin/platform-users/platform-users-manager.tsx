"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Mail, Plus, Search, Shield, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/super-admin/shared/status-badge";
import { EmptyState } from "@/components/super-admin/shared/empty-state";
import {
  checkPlatformUserEmailAction,
  createPlatformUserAction,
  toggleUserStatusAction,
  type PlatformEmailCheckResult,
} from "@/features/super-admin/actions";
import { formatDate } from "@/lib/utils";

export type PlatformUserRow = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
};

export function PlatformUsersManager({
  users,
  openCreateByDefault = false,
}: {
  users: PlatformUserRow[];
  openCreateByDefault?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [showCreate, setShowCreate] = useState(openCreateByDefault);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailLookup, setEmailLookup] = useState<{
    email: string;
    result: PlatformEmailCheckResult;
  } | null>(null);
  const trimmedEmail = email.trim();
  const emailValid = trimmedEmail.includes("@");
  const emailCheck = emailValid && emailLookup?.email === trimmedEmail ? emailLookup.result : null;
  const emailChecking = emailValid && emailLookup?.email !== trimmedEmail;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (status !== "ALL" && user.status !== status) return false;
      if (!q) return true;
      return (
        user.fullName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q)
      );
    });
  }, [users, query, status]);

  useEffect(() => {
    const value = email.trim();
    if (!value.includes("@")) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void checkPlatformUserEmailAction(value).then((result) => {
        if (cancelled) return;
        setEmailLookup({ email: value, result });
        if (result.ok && result.registered && result.fullName) {
          setFullName((current) => current.trim() || result.fullName || "");
        }
      });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [email]);

  const emailBlocked = Boolean(emailCheck?.ok && emailCheck.registered);

  function closeCreate() {
    setShowCreate(false);
    setError(null);
    setEmail("");
    setFullName("");
    setEmailLookup(null);
  }

  return (
    <div className="space-y-6">
      {success ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>{success}</p>
          <button
            type="button"
            className="font-semibold text-emerald-700 hover:underline"
            onClick={() => setSuccess(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search platform users…"
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
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <Button
            type="button"
            onClick={() => {
              setShowCreate((v) => !v);
              setError(null);
            }}
            className="shrink-0 border-teal-700 bg-teal-700 hover:bg-teal-800"
          >
            <Plus className="h-4 w-4" />
            Add Platform User
          </Button>
        </div>

        {showCreate ? (
          <form
            className="mt-5 space-y-4 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/70 via-white to-slate-50 p-4 sm:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (emailBlocked) {
                setError("This email is already registered. Use a different address.");
                return;
              }
              const formData = new FormData(event.currentTarget);
              formData.set("isSuperAdmin", "true");
              setError(null);
              startTransition(async () => {
                const result = await createPlatformUserAction(null, formData);
                if (!result.success) {
                  setError(result.error ?? "Unable to create platform user.");
                  return;
                }
                setSuccess(
                  ("message" in result && result.message) ||
                    "Platform user created. Ask them to verify their email before login.",
                );
                closeCreate();
                event.currentTarget.reset();
              });
            }}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Platform User</h3>
              <p className="mt-1 text-sm text-slate-500">
                Creates a ClassBridge staff account with Super Admin access. A verification email is
                sent — they must verify before they can log in.
              </p>
            </div>
            {error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="staff@classbridge.com"
                  />
                </div>
                <div className="min-h-[1.5rem]">
                  {emailChecking ? (
                    <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Checking if email is registered…
                    </p>
                  ) : null}
                  {!emailChecking && emailCheck?.ok && emailCheck.registered ? (
                    <p className="inline-flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
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
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="password">Temporary password</Label>
                <Input id="password" name="password" type="password" required minLength={6} />
                <p className="text-xs text-slate-500">
                  Share this password securely after they verify their email. They cannot log in until
                  verification is complete.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={isPending || emailBlocked || emailChecking}
                className="border-teal-700 bg-teal-700 hover:bg-teal-800"
              >
                {isPending ? "Creating…" : "Create Platform User"}
              </Button>
              <Button type="button" variant="secondary" onClick={closeCreate}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title={users.length === 0 ? "No platform users yet" : "No platform users found"}
          description={
            users.length === 0
              ? "Create your first platform staff account."
              : "Try changing your search or filters."
          }
          action={
            users.length === 0 ? (
              <Button
                type="button"
                onClick={() => setShowCreate(true)}
                className="border-teal-700 bg-teal-700 hover:bg-teal-800"
              >
                <Plus className="h-4 w-4" />
                Add Platform User
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {filtered.map((user) => (
              <li
                key={user.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{user.fullName}</p>
                    <StatusBadge status={user.status} />
                  </div>
                  <p className="truncate text-sm text-slate-500">{user.email}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Super Admin · Created {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/super-admin/platform-users/${user.id}`}
                    className="text-xs font-semibold text-sky-700 hover:underline"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    className="text-xs font-semibold text-amber-700 hover:underline"
                    onClick={() => setConfirmId(user.id)}
                  >
                    {user.status === "ACTIVE" ? "Suspend" : "Activate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            {(() => {
              const target = users.find((user) => user.id === confirmId);
              const suspending = target?.status === "ACTIVE";
              return (
                <>
                  <h3 className="text-lg font-bold text-slate-900">
                    {suspending ? "Suspend Platform User?" : "Activate Platform User?"}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {suspending
                      ? "This staff account will lose platform access until reactivated."
                      : "This staff account will regain platform access."}
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => setConfirmId(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant={suspending ? "danger" : "primary"}
                      disabled={isPending}
                      onClick={() => {
                        const formData = new FormData();
                        formData.set("userId", confirmId);
                        formData.set("status", suspending ? "INACTIVE" : "ACTIVE");
                        startTransition(async () => {
                          await toggleUserStatusAction(formData);
                          setConfirmId(null);
                        });
                      }}
                    >
                      {suspending ? "Suspend" : "Activate"}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
