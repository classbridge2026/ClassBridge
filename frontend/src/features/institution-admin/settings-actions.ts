"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { writeAuditLog } from "@/services/audit";
import { institutionSettingsSchema } from "./schemas";
import { ActionFormState, fieldErrorsFromZod } from "./form-state";

export async function updateInstitutionSettingsAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireInstitutionAdmin();

  const parsed = institutionSettingsSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    website: formData.get("website") || undefined,
    address: formData.get("address") || undefined,
    country: formData.get("country") || undefined,
    city: formData.get("city") || undefined,
    description: formData.get("description") || undefined,
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  await prisma.institution.update({
    where: { id: institutionId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone ?? null,
      website: parsed.data.website ?? null,
      address: parsed.data.address ?? null,
      country: parsed.data.country ?? null,
      city: parsed.data.city ?? null,
      description: parsed.data.description ?? null,
      timezone: parsed.data.timezone,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: "settings.updated",
    resourceType: "Institution",
    resourceId: institutionId,
  });

  revalidatePath("/institution-admin");
  revalidatePath("/institution-admin/settings");
  return { ok: true, message: "Institution settings saved." };
}
