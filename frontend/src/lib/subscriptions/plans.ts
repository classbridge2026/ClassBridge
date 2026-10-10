import { SubscriptionPlan } from "@prisma/client";

export const DEFAULT_SEAT_LIMITS: Record<SubscriptionPlan, number> = {
  TRIAL: 50,
  STARTER: 100,
  PROFESSIONAL: 500,
  ENTERPRISE: 5000,
};

export function defaultSeatLimit(plan: SubscriptionPlan) {
  return DEFAULT_SEAT_LIMITS[plan];
}
