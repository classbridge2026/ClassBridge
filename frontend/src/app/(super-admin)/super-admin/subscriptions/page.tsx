import type { Metadata } from "next";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/db/prisma";
import { listSubscriptions } from "@/services/subscriptions";
import { SubscriptionsManager } from "@/features/subscriptions/subscriptions-manager";

export const metadata: Metadata = {
  title: "Subscriptions — Super Admin",
};

export default async function SuperAdminSubscriptionsPage() {
  await requireSuperAdminUser();

  const [subscriptions, institutions] = await Promise.all([
    listSubscriptions(),
    prisma.institution.findMany({
      where: { status: { not: "TRASHED" } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows = subscriptions.map((s) => ({
    id: s.id,
    institutionId: s.institutionId,
    institutionName: s.institution.name,
    planKey: s.planKey,
    status: s.status,
    seatLimit: s.seatLimit,
    seatsUsed: s.institution._count.memberships,
    currentPeriodEnd: s.currentPeriodEnd.toISOString().slice(0, 10),
    notes: s.notes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Plans, seats, and renewals</h2>
        <p className="mt-1 text-sm text-slate-600">
          Manual plan and seat management. Payment provider integration is not configured.
        </p>
      </div>
      <SubscriptionsManager institutions={institutions} subscriptions={rows} />
    </div>
  );
}
