"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/services/audit";

export type SettingsFormState = {
  ok: boolean;
  error?: string;
  message?: string;
};

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required."),
  phone: z.string().trim().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function updateSuperAdminProfileAction(
  _prev: SettingsFormState | null,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await requireSuperAdminUser();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid profile data." };
  }

  try {
    await prisma.user.update({
      where: { id: session.id },
      data: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
      },
    });

    await writeAuditLog({
      actorUserId: session.id,
      action: "settings.profile_updated",
      resourceType: "User",
      resourceId: session.id,
    });

    revalidatePath("/super-admin/settings");
    revalidatePath("/super-admin");
    return { ok: true, message: "Profile updated successfully." };
  } catch (error) {
    console.error("Update profile error:", error);
    return { ok: false, error: "Unable to update profile." };
  }
}

export async function updateSuperAdminPasswordAction(
  _prev: SettingsFormState | null,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await requireSuperAdminUser();

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid password data." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return { ok: false, error: "User not found." };

    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return { ok: false, error: "Current password is incorrect." };

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: session.id },
      data: { passwordHash },
    });

    await writeAuditLog({
      actorUserId: session.id,
      action: "settings.password_changed",
      resourceType: "User",
      resourceId: session.id,
    });

    revalidatePath("/super-admin/settings");
    revalidatePath("/super-admin/activity");
    return { ok: true, message: "Password updated successfully." };
  } catch (error) {
    console.error("Update password error:", error);
    return { ok: false, error: "Unable to update password." };
  }
}
