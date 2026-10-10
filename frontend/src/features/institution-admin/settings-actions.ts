"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireFullInstitutionAdmin } from "@/lib/permissions/institution-admin";
import { writeAuditLog } from "@/services/audit";
import { storageAdapter } from "@/lib/storage/adapter";
import { institutionSettingsSchema } from "./schemas";
import { ActionFormState, fieldErrorsFromZod } from "./form-state";

const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]);
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export async function updateInstitutionSettingsAction(
  _prev: ActionFormState | null,
  formData: FormData,
): Promise<ActionFormState> {
  const { user, institutionId } = await requireFullInstitutionAdmin();

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

  const logoEntry = formData.get("logo");
  const removeLogo = formData.get("removeLogo") === "1";
  let nextLogoKey: string | null | undefined;

  if (removeLogo) {
    nextLogoKey = null;
  } else if (logoEntry instanceof File && logoEntry.size > 0) {
    if (!LOGO_TYPES.has(logoEntry.type)) {
      return { ok: false, error: "Logo must be PNG, JPG, WebP, or SVG." };
    }
    if (logoEntry.size > LOGO_MAX_BYTES) {
      return { ok: false, error: "Logo must be 2 MB or smaller." };
    }
    const buffer = Buffer.from(await logoEntry.arrayBuffer());
    nextLogoKey = await storageAdapter.uploadFile(buffer, logoEntry.name || "logo.png");
  }

  const current = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { logoStorageKey: true },
  });

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
      ...(nextLogoKey !== undefined ? { logoStorageKey: nextLogoKey } : {}),
    },
  });

  if (
    nextLogoKey !== undefined &&
    current?.logoStorageKey &&
    current.logoStorageKey !== nextLogoKey
  ) {
    await storageAdapter.deleteFile(current.logoStorageKey);
  }

  await writeAuditLog({
    actorUserId: user.id,
    institutionId,
    action: "settings.updated",
    resourceType: "Institution",
    resourceId: institutionId,
    metadata: nextLogoKey !== undefined ? { logoUpdated: true } : undefined,
  });

  revalidatePath("/institution-admin");
  revalidatePath("/institution-admin/settings");
  revalidatePath("/lecturer");
  revalidatePath("/student");
  return { ok: true, message: "Institution settings saved." };
}
