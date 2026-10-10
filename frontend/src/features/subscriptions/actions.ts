"use server";

import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { upsertSubscription } from "@/services/subscriptions";
import { upsertSubscriptionSchema } from "./schemas";

export type SubscriptionFormState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function fieldErrorsFromZod(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export async function submitUpsertSubscription(
  _prev: SubscriptionFormState | null,
  formData: FormData,
): Promise<SubscriptionFormState> {
  await requireSuperAdminUser();

  const parsed = upsertSubscriptionSchema.safeParse({
    institutionId: formData.get("institutionId"),
    planKey: formData.get("planKey"),
    status: formData.get("status"),
    seatLimit: formData.get("seatLimit"),
    currentPeriodEnd: formData.get("currentPeriodEnd"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await upsertSubscription({
      institutionId: parsed.data.institutionId,
      planKey: parsed.data.planKey as SubscriptionPlan,
      status: parsed.data.status as SubscriptionStatus,
      seatLimit: parsed.data.seatLimit,
      currentPeriodEnd: new Date(parsed.data.currentPeriodEnd),
      notes: parsed.data.notes || null,
    });
    revalidatePath("/super-admin/subscriptions");
    revalidatePath("/super-admin");
    return { ok: true, message: "Subscription saved." };
  } catch (error) {
    console.error("Upsert subscription error:", error);
    return { ok: false, error: "Failed to save subscription." };
  }
}
