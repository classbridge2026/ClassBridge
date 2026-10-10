"use server";

import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/permissions/rbac";
import { hashPassword } from "@/lib/auth/password";
import { createLecturerSchema } from "./schemas";
import { RoleKey } from "@prisma/client";
import { assertSeatAvailable } from "@/services/subscriptions";

export type LecturerFormState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const DEFAULT_TEMP_PASSWORD = "ClassBridge!dev1";

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

export async function submitCreateLecturer(
  _previous: LecturerFormState | null,
  formData: FormData,
): Promise<LecturerFormState> {
  const admin = await requireRole([RoleKey.INSTITUTION_ADMIN]);
  const institutionId = admin.activeMembership?.institutionId;

  if (!institutionId) {
    return { ok: false, error: "No active institution membership found." };
  }

  const seatError = await assertSeatAvailable(institutionId);
  if (seatError) {
    return { ok: false, error: seatError };
  }

  const parsed = createLecturerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    title: formData.get("title") || undefined,
    temporaryPassword: formData.get("temporaryPassword") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const emailLower = parsed.data.email.trim().toLowerCase();
  const title = parsed.data.title?.trim() || null;
  const tempPassword =
    parsed.data.temporaryPassword && parsed.data.temporaryPassword.length >= 8
      ? parsed.data.temporaryPassword
      : DEFAULT_TEMP_PASSWORD;

  try {
    const lecturerRole = await prisma.role.findUnique({
      where: { key: RoleKey.LECTURER },
    });

    if (!lecturerRole) {
      return { ok: false, error: "System role LECTURER not found." };
    }

    const passwordHash = await hashPassword(tempPassword);

    await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: emailLower } });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: emailLower,
            fullName: parsed.data.fullName.trim(),
            passwordHash,
            status: "ACTIVE",
          },
        });
      }

      const existingMembership = await tx.institutionUser.findUnique({
        where: {
          institutionId_userId: {
            institutionId,
            userId: user.id,
          },
        },
        include: { lecturerProfile: true },
      });

      if (existingMembership?.lecturerProfile) {
        throw new Error("LECTURER_EXISTS");
      }

      const membership =
        existingMembership ??
        (await tx.institutionUser.create({
          data: {
            institutionId,
            userId: user.id,
            roleId: lecturerRole.id,
            status: "ACTIVE",
          },
        }));

      if (existingMembership && existingMembership.roleId !== lecturerRole.id) {
        throw new Error("ROLE_CONFLICT");
      }

      await tx.lecturerProfile.create({
        data: {
          institutionId,
          institutionUserId: membership.id,
          title,
        },
      });
    });

    revalidatePath("/admin/lecturers");
    revalidatePath("/admin");
    revalidatePath("/institution-admin/lecturers");
    revalidatePath("/institution-admin");

    return {
      ok: true,
      message: `Lecturer created. Temporary password: ${tempPassword}`,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "LECTURER_EXISTS") {
        return { ok: false, error: "This user is already a lecturer at this institution." };
      }
      if (error.message === "ROLE_CONFLICT") {
        return {
          ok: false,
          error: "This email already belongs to a different campus role.",
        };
      }
    }
    console.error("Create lecturer error:", error);
    return { ok: false, error: "Failed to create lecturer account." };
  }
}
