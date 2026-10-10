import { z } from "zod";

export const upsertSubscriptionSchema = z.object({
  institutionId: z.string().uuid(),
  planKey: z.enum(["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]),
  status: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"]),
  seatLimit: z.coerce.number().int().positive().max(100000),
  currentPeriodEnd: z.string().min(1),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});
