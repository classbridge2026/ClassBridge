import "server-only";
import { prisma } from "@/lib/db/prisma";
import {
  MembershipStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import { defaultSeatLimit } from "@/lib/subscriptions/plans";

export { defaultSeatLimit };

export async function listSubscriptions() {
  return prisma.subscription.findMany({
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          _count: {
            select: {
              memberships: true,
              studentProfiles: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function upsertSubscription(input: {
  institutionId: string;
  planKey: SubscriptionPlan;
  status: SubscriptionStatus;
  seatLimit?: number;
  currentPeriodEnd: Date;
  notes?: string | null;
}) {
  return prisma.subscription.upsert({
    where: { institutionId: input.institutionId },
    create: {
      institutionId: input.institutionId,
      planKey: input.planKey,
      status: input.status,
      seatLimit: input.seatLimit ?? defaultSeatLimit(input.planKey),
      currentPeriodStart: new Date(),
      currentPeriodEnd: input.currentPeriodEnd,
      notes: input.notes ?? null,
    },
    update: {
      planKey: input.planKey,
      status: input.status,
      seatLimit: input.seatLimit ?? defaultSeatLimit(input.planKey),
      currentPeriodEnd: input.currentPeriodEnd,
      notes: input.notes ?? null,
    },
  });
}

export async function getSubscriptionForInstitution(institutionId: string) {
  return prisma.subscription.findUnique({
    where: { institutionId },
  });
}

/** Returns null if under limit; otherwise an error message. */
export async function assertSeatAvailable(institutionId: string): Promise<string | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { institutionId },
  });

  if (!subscription) return null;

  if (
    subscription.status === SubscriptionStatus.CANCELLED ||
    subscription.status === SubscriptionStatus.EXPIRED
  ) {
    return "Institution subscription is not active.";
  }

  if (subscription.currentPeriodEnd < new Date()) {
    return "Institution subscription period has ended.";
  }

  const activeMembers = await prisma.institutionUser.count({
    where: { institutionId, status: MembershipStatus.ACTIVE },
  });

  if (activeMembers >= subscription.seatLimit) {
    return `Seat limit reached (${subscription.seatLimit}). Upgrade the plan to add more users.`;
  }

  return null;
}

export async function ensureTrialSubscription(institutionId: string) {
  const existing = await prisma.subscription.findUnique({
    where: { institutionId },
  });
  if (existing) return existing;

  const end = new Date();
  end.setDate(end.getDate() + 30);

  return prisma.subscription.create({
    data: {
      institutionId,
      planKey: SubscriptionPlan.TRIAL,
      status: SubscriptionStatus.TRIALING,
      seatLimit: defaultSeatLimit(SubscriptionPlan.TRIAL),
      currentPeriodEnd: end,
    },
  });
}
