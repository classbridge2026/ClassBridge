"use server";

import { createHash, randomBytes } from "crypto";
import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { hashPassword } from "@/lib/auth/password";
import { createInstitutionSchema, updateInstitutionSchema, permanentDeleteSchema } from "./schemas";
import { InstitutionStatus, RoleKey } from "@prisma/client";
import { ensureTrialSubscription } from "@/services/subscriptions";
import { writeAuditLog } from "@/services/audit";
import { serverEnv } from "@/config/env";
import { isEmailConfigured } from "@/lib/email/client";
import { sendInstitutionInviteEmail } from "@/lib/email/send-institution-invite";

export type InstitutionFormState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type AdminEmailCheckResult = {
  ok: boolean;
  registered: boolean;
  fullName?: string;
  status?: string;
  message?: string;
  error?: string;
};

const INVITE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function appBaseUrl(): string {
  return serverEnv.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

async function sendAdminSetupEmail(input: {
  userId: string;
  email: string;
  fullName: string;
  institutionName: string;
  isExistingUser: boolean;
}): Promise<"sent" | "logged"> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: input.userId,
      tokenHash,
      expiresAt,
    },
  });

  const setupUrl = `${appBaseUrl()}/reset-password?token=${rawToken}`;
  const loginUrl = `${appBaseUrl()}/login`;

  return sendInstitutionInviteEmail({
    to: input.email,
    fullName: input.fullName,
    institutionName: input.institutionName,
    isExistingUser: input.isExistingUser,
    setupUrl,
    loginUrl,
    expiresMinutes: INVITE_TOKEN_TTL_MS / 60000,
  });
}

export async function checkAdminEmailAction(email: string): Promise<AdminEmailCheckResult> {
  await requireSuperAdminUser();

  const emailLower = email.trim().toLowerCase();
  if (!emailLower || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return { ok: false, registered: false, error: "Enter a valid email address." };
  }

  const user = await prisma.user.findUnique({
    where: { email: emailLower },
    select: { fullName: true, status: true },
  });

  if (!user) {
    return {
      ok: true,
      registered: false,
      message: "New account — a password setup email will be sent after creating the institution.",
    };
  }

  return {
    ok: true,
    registered: true,
    fullName: user.fullName,
    status: user.status,
    message: `Registered as ${user.fullName} (${user.status}). They will be linked as admin and receive a password/login email.`,
  };
}

export async function submitCreateInstitution(
  _previous: InstitutionFormState | null,
  formData: FormData,
): Promise<InstitutionFormState> {
  const actor = await requireSuperAdminUser();

  const parsed = createInstitutionSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    timezone: formData.get("timezone") || "UTC",
    adminEmail: formData.get("adminEmail"),
    adminFullName: formData.get("adminFullName"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const slugLower = parsed.data.slug.trim().toLowerCase();
  const emailLower = parsed.data.adminEmail.trim().toLowerCase();

  try {
    const existingInst = await prisma.institution.findUnique({
      where: { slug: slugLower },
    });

    if (existingInst) {
      return {
        ok: false,
        error: "An institution with this slug already exists.",
        fieldErrors: { slug: "Slug already in use." },
      };
    }

    const adminRole = await prisma.role.findUnique({
      where: { key: RoleKey.INSTITUTION_ADMIN },
    });

    if (!adminRole) {
      return { ok: false, error: "System role INSTITUTION_ADMIN not found." };
    }

    const temporaryPassword = randomBytes(24).toString("base64url");
    const defaultHash = await hashPassword(temporaryPassword);

    const created = await prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: {
          name: parsed.data.name,
          slug: slugLower,
          timezone: parsed.data.timezone,
          status: InstitutionStatus.ACTIVE,
        },
      });

      const existingUser = await tx.user.findUnique({
        where: { email: emailLower },
      });

      let adminUser = existingUser;
      const isExistingUser = Boolean(existingUser);

      if (!adminUser) {
        adminUser = await tx.user.create({
          data: {
            email: emailLower,
            fullName: parsed.data.adminFullName,
            passwordHash: defaultHash,
            status: "ACTIVE",
          },
        });
      }

      await tx.institutionUser.create({
        data: {
          institutionId: institution.id,
          userId: adminUser.id,
          roleId: adminRole.id,
          status: "ACTIVE",
        },
      });

      return {
        institutionId: institution.id,
        institutionName: institution.name,
        adminUserId: adminUser.id,
        adminFullName: adminUser.fullName,
        isExistingUser,
      };
    });

    await ensureTrialSubscription(created.institutionId);

    let emailDelivery: "sent" | "logged" | "failed" = "failed";
    try {
      emailDelivery = await sendAdminSetupEmail({
        userId: created.adminUserId,
        email: emailLower,
        fullName: created.adminFullName,
        institutionName: created.institutionName,
        isExistingUser: created.isExistingUser,
      });
    } catch (emailError) {
      console.error("Institution invite email failed:", emailError);
    }

    await writeAuditLog({
      actorUserId: actor.id,
      institutionId: created.institutionId,
      action: "institution.created",
      resourceType: "Institution",
      resourceId: created.institutionId,
      metadata: {
        name: parsed.data.name,
        slug: slugLower,
        adminEmail: emailLower,
        emailDelivery,
      },
    });

    revalidatePath("/super-admin/institutions");
    revalidatePath("/super-admin/subscriptions");
    revalidatePath("/super-admin");
    revalidatePath("/super-admin/activity");

    if (emailDelivery === "sent") {
      return {
        ok: true,
        message: "Institution created. A password setup email was sent to the administrator.",
      };
    }

    if (emailDelivery === "logged") {
      return {
        ok: true,
        message:
          "Institution created. SMTP is not configured — the password setup link was logged to the server console.",
      };
    }

    return {
      ok: true,
      message:
        isEmailConfigured()
          ? "Institution created, but the invite email could not be sent. Ask the admin to use Forgot password."
          : "Institution created, but invite email could not be delivered. Configure SMTP or check server logs.",
    };
  } catch (error) {
    console.error("Create institution error:", error);
    return { ok: false, error: "Failed to create institution tenant." };
  }
}

export async function submitToggleInstitutionStatus(institutionId: string): Promise<void> {
  const actor = await requireSuperAdminUser();

  const inst = await prisma.institution.findUnique({
    where: { id: institutionId },
  });

  if (!inst || inst.status === InstitutionStatus.TRASHED) return;

  const nextStatus =
    inst.status === InstitutionStatus.ACTIVE ? InstitutionStatus.INACTIVE : InstitutionStatus.ACTIVE;

  await prisma.institution.update({
    where: { id: institutionId },
    data: { status: nextStatus },
  });

  await writeAuditLog({
    actorUserId: actor.id,
    institutionId,
    action: nextStatus === InstitutionStatus.ACTIVE ? "institution.activated" : "institution.suspended",
    resourceType: "Institution",
    resourceId: institutionId,
    metadata: { previousStatus: inst.status, nextStatus },
  });

  revalidatePath("/super-admin/institutions");
  revalidatePath(`/super-admin/institutions/${institutionId}`);
  revalidatePath("/super-admin");
  revalidatePath("/super-admin/activity");
}

export async function submitUpdateInstitution(
  _previous: InstitutionFormState | null,
  formData: FormData,
): Promise<InstitutionFormState> {
  const actor = await requireSuperAdminUser();

  const parsed = updateInstitutionSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    timezone: formData.get("timezone"),
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const slugLower = parsed.data.slug.trim().toLowerCase();

  try {
    const existingWithSlug = await prisma.institution.findFirst({
      where: {
        slug: slugLower,
        NOT: { id: parsed.data.id },
      },
    });

    if (existingWithSlug) {
      return {
        ok: false,
        error: "Another institution with this slug already exists.",
        fieldErrors: { slug: "Slug already in use." },
      };
    }

    await prisma.institution.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        slug: slugLower,
        timezone: parsed.data.timezone,
        ...(parsed.data.status ? { status: parsed.data.status as InstitutionStatus } : {}),
      },
    });

    await writeAuditLog({
      actorUserId: actor.id,
      institutionId: parsed.data.id,
      action: "institution.updated",
      resourceType: "Institution",
      resourceId: parsed.data.id,
      metadata: { name: parsed.data.name, slug: slugLower },
    });

    revalidatePath("/super-admin/institutions");
    revalidatePath(`/super-admin/institutions/${parsed.data.id}`);
    revalidatePath("/super-admin/activity");
    return { ok: true, message: "Institution updated successfully!" };
  } catch (error) {
    console.error("Update institution error:", error);
    return { ok: false, error: "Failed to update institution settings." };
  }
}

export async function submitTrashInstitution(institutionId: string): Promise<InstitutionFormState> {
  const actor = await requireSuperAdminUser();

  try {
    const inst = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!inst) {
      return { ok: false, error: "Institution not found." };
    }

    await prisma.institution.update({
      where: { id: institutionId },
      data: { status: InstitutionStatus.TRASHED },
    });

    await writeAuditLog({
      actorUserId: actor.id,
      institutionId,
      action: "institution.trashed",
      resourceType: "Institution",
      resourceId: institutionId,
      metadata: { previousStatus: inst.status },
    });

    revalidatePath("/super-admin/institutions");
    revalidatePath(`/super-admin/institutions/${institutionId}`);
    revalidatePath("/super-admin");
    revalidatePath("/super-admin/activity");
    return { ok: true, message: "Institution moved to Trash." };
  } catch (error) {
    console.error("Trash institution error:", error);
    return { ok: false, error: "Failed to move institution to Trash." };
  }
}

export async function submitRestoreInstitution(institutionId: string): Promise<InstitutionFormState> {
  const actor = await requireSuperAdminUser();

  try {
    const inst = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!inst) {
      return { ok: false, error: "Institution not found." };
    }

    await prisma.institution.update({
      where: { id: institutionId },
      data: { status: InstitutionStatus.ACTIVE },
    });

    await writeAuditLog({
      actorUserId: actor.id,
      institutionId,
      action: "institution.restored",
      resourceType: "Institution",
      resourceId: institutionId,
    });

    revalidatePath("/super-admin/institutions");
    revalidatePath(`/super-admin/institutions/${institutionId}`);
    revalidatePath("/super-admin");
    revalidatePath("/super-admin/activity");
    return { ok: true, message: "Institution restored to Active status." };
  } catch (error) {
    console.error("Restore institution error:", error);
    return { ok: false, error: "Failed to restore institution." };
  }
}

export async function submitPermanentDeleteInstitution(
  _previous: InstitutionFormState | null,
  formData: FormData,
): Promise<InstitutionFormState> {
  const actor = await requireSuperAdminUser();

  const parsed = permanentDeleteSchema.safeParse({
    id: formData.get("id"),
    confirmSlug: formData.get("confirmSlug"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the confirmation input.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const inst = await prisma.institution.findUnique({
      where: { id: parsed.data.id },
    });

    if (!inst) {
      return { ok: false, error: "Institution not found." };
    }

    if (inst.slug.toLowerCase() !== parsed.data.confirmSlug.trim().toLowerCase()) {
      return {
        ok: false,
        error: "Confirmation slug does not match the institution slug.",
        fieldErrors: { confirmSlug: "Slug confirmation mismatch." },
      };
    }

    await prisma.$transaction(async (tx) => {
      const courses = await tx.course.findMany({
        where: { institutionId: inst.id },
        select: { id: true },
      });
      const courseIds = courses.map((c) => c.id);

      if (courseIds.length > 0) {
        await tx.courseEnrollment.deleteMany({
          where: { courseId: { in: courseIds } },
        });
        await tx.courseModule.deleteMany({
          where: { courseId: { in: courseIds } },
        });
        await tx.course.deleteMany({
          where: { institutionId: inst.id },
        });
      }

      await tx.studentProfile.deleteMany({
        where: { institutionId: inst.id },
      });
      await tx.lecturerProfile.deleteMany({
        where: { institutionId: inst.id },
      });

      await tx.institutionUser.deleteMany({
        where: { institutionId: inst.id },
      });

      await tx.institution.delete({
        where: { id: inst.id },
      });
    });

    await writeAuditLog({
      actorUserId: actor.id,
      action: "institution.deleted",
      resourceType: "Institution",
      resourceId: inst.id,
      metadata: { name: inst.name, slug: inst.slug },
    });

    revalidatePath("/super-admin/institutions");
    revalidatePath("/super-admin");
    revalidatePath("/super-admin/activity");
    return { ok: true, message: "Institution permanently deleted." };
  } catch (error) {
    console.error("Permanent delete institution error:", error);
    return { ok: false, error: "Failed to permanently delete institution." };
  }
}
