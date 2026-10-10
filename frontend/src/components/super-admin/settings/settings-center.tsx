"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateSuperAdminPasswordAction,
  updateSuperAdminProfileAction,
  type SettingsFormState,
} from "@/features/super-admin/settings-actions";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "general", label: "General" },
  { id: "profile", label: "My Profile" },
  { id: "account", label: "Account" },
  { id: "platform", label: "Platform" },
  { id: "authentication", label: "Authentication" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "email", label: "Email" },
  { id: "storage", label: "Storage" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "appearance", label: "Appearance" },
  { id: "audit", label: "Audit" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function SettingsCenter({
  profile,
  platformInfo,
}: {
  profile: {
    fullName: string;
    email: string;
    phone: string | null;
  };
  platformInfo: {
    appName: string;
    environment: string;
    authConfigured: boolean;
    emailConfigured: boolean;
    storageMode: string;
  };
}) {
  const searchParams = useSearchParams();
  const initial = (searchParams.get("section") as SectionId | null) ?? "general";
  const [section, setSection] = useState<SectionId>(
    SECTIONS.some((item) => item.id === initial) ? initial : "general",
  );
  const [profileState, setProfileState] = useState<SettingsFormState | null>(null);
  const [passwordState, setPasswordState] = useState<SettingsFormState | null>(null);
  const [isPending, startTransition] = useTransition();

  const title = useMemo(
    () => SECTIONS.find((item) => item.id === section)?.label ?? "Settings",
    [section],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <nav
        aria-label="Settings sections"
        className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible"
      >
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={cn(
              "whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
              section === item.id
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>

        {section === "general" || section === "platform" ? (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-slate-600">
              Platform identity and runtime configuration visible to Super Admins. Secrets are never
              exposed in the browser.
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase text-slate-400">Application</dt>
                <dd className="mt-1 font-semibold text-slate-900">{platformInfo.appName}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase text-slate-400">Environment</dt>
                <dd className="mt-1 font-semibold text-slate-900">{platformInfo.environment}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase text-slate-400">Auth secret</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {platformInfo.authConfigured ? "Configured" : "Using development default"}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase text-slate-400">Storage mode</dt>
                <dd className="mt-1 font-semibold text-slate-900">{platformInfo.storageMode}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {section === "profile" || section === "account" ? (
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              startTransition(async () => {
                setProfileState(await updateSuperAdminProfileAction(profileState, formData));
              });
            }}
          >
            {profileState?.error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{profileState.error}</p>
            ) : null}
            {profileState?.ok ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {profileState.message}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" defaultValue={profile.fullName} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled />
              <p className="text-xs text-slate-500">Email changes require a dedicated verification flow.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        ) : null}

        {section === "security" || section === "authentication" ? (
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              startTransition(async () => {
                setPasswordState(await updateSuperAdminPasswordAction(passwordState, formData));
              });
            }}
          >
            <p className="text-sm text-slate-600">
              Change your Super Admin password. Sessions use encrypted HTTP-only cookies.
            </p>
            {passwordState?.error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {passwordState.error}
              </p>
            ) : null}
            {passwordState?.ok ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {passwordState.message}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating…" : "Update password"}
            </Button>
          </form>
        ) : null}

        {section === "notifications" ? (
          <p className="mt-4 text-sm text-slate-600">
            Super Admin in-app notifications are delivered through the existing Notification model.
            Use the bell in the header to review unread items. Preferences follow the shared
            notification preference service.
          </p>
        ) : null}

        {section === "email" ? (
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>
              Transactional email (password reset) uses server-side SMTP configuration. Credentials
              are never sent to the browser.
            </p>
            <p className="rounded-xl bg-slate-50 px-3 py-2 font-semibold text-slate-900">
              SMTP status: {platformInfo.emailConfigured ? "Configured" : "Not configured"}
            </p>
          </div>
        ) : null}

        {section === "storage" ? (
          <p className="mt-4 text-sm text-slate-600">
            File storage is handled by the server-side storage adapter. Current mode:{" "}
            <strong>{platformInfo.storageMode}</strong>. Storage secrets remain on the server only.
          </p>
        ) : null}

        {section === "subscriptions" ? (
          <p className="mt-4 text-sm text-slate-600">
            Subscription plans and seats are managed under Subscriptions & Licensing. No payment
            provider is configured yet — renewals and plan changes are applied manually by Super
            Admins.
          </p>
        ) : null}

        {section === "appearance" ? (
          <p className="mt-4 text-sm text-slate-600">
            Super Admin uses the ClassBridge control-center palette: primary{" "}
            <code>#2563EB</code>, navy <code>#0F172A</code>, surface <code>#F8FAFC</code>.
          </p>
        ) : null}

        {section === "audit" ? (
          <p className="mt-4 text-sm text-slate-600">
            Privileged Super Admin actions write to the <code>AuditLog</code> table. Review them in
            Activity Monitor. Profile and password changes from this page are audited.
          </p>
        ) : null}
      </section>
    </div>
  );
}
