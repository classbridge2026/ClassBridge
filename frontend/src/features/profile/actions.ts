"use server";

import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/permissions/rbac";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { updateProfileSchema, changePasswordSchema } from "./schemas";

export type ProfileFormState = {
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

export async function submitUpdateProfile(
  _previous: ProfileFormState | null,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireAuthUser();

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
      },
    });

    revalidatePath("/lecturer/profile");
    revalidatePath("/lecturer/settings");
    revalidatePath("/profile");
    return { ok: true, message: "Profile information updated successfully!" };
  } catch (error) {
    console.error("Update profile error:", error);
    return { ok: false, error: "Failed to update profile. Please try again." };
  }
}

export async function submitChangePassword(
  _previous: ProfileFormState | null,
  formData: FormData,
): Promise<ProfileFormState> {
  const sessionUser = await requireAuthUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!dbUser) {
      return { ok: false, error: "User not found." };
    }

    const matches = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
    if (!matches) {
      return {
        ok: false,
        error: "Incorrect current password.",
        fieldErrors: { currentPassword: "Incorrect password." },
      };
    }

    const newHash = await hashPassword(parsed.data.newPassword);

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { passwordHash: newHash },
    });

    return { ok: true, message: "Password changed successfully!" };
  } catch (error) {
    console.error("Change password error:", error);
    return { ok: false, error: "Failed to change password. Please try again." };
  }
}
