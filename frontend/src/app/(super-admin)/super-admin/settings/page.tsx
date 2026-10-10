import type { Metadata } from "next";
import { Suspense } from "react";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/db/prisma";
import { serverEnv } from "@/config/env";
import { isEmailConfigured } from "@/lib/email/client";
import { SettingsCenter } from "@/components/super-admin/settings/settings-center";

export const metadata: Metadata = {
  title: "Settings — Super Admin",
};

export default async function SuperAdminSettingsPage() {
  const session = await requireSuperAdminUser();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { fullName: true, email: true, phone: true },
  });

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading settings…
        </div>
      }
    >
      <SettingsCenter
        profile={{
          fullName: user?.fullName ?? session.fullName,
          email: user?.email ?? session.email,
          phone: user?.phone ?? null,
        }}
        platformInfo={{
          appName: "ClassBridge",
          environment: serverEnv.NODE_ENV ?? "development",
          authConfigured: Boolean(serverEnv.AUTH_SECRET),
          emailConfigured: isEmailConfigured(),
          storageMode: serverEnv.STORAGE_ENDPOINT ? "Object storage" : "Local uploads",
        }}
      />
    </Suspense>
  );
}
