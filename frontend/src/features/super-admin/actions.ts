"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";
import { writeAuditLog } from "@/services/audit";
import { issueEmailVerification } from "@/lib/auth/email-verification";
import bcrypt from "bcryptjs";
import { z } from "zod";

export type SuperAdminUserFormState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const toggleUserSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]),
});

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).default("ACTIVE"),
  isPlatformSuperAdmin: z.boolean().default(false),
});

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]),
  isPlatformSuperAdmin: z.boolean().default(false),
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 6, "Password must be at least 6 characters"),
});

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
  confirmEmail: z.string().trim().email("Confirm with the user email"),
});

function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function revalidateUserPaths(userId?: string) {
  revalidatePath("/super-admin/users");
  revalidatePath("/super-admin/platform-users");
  revalidatePath("/super-admin");
  revalidatePath("/super-admin/activity");
  if (userId) {
    revalidatePath(`/super-admin/users/${userId}`);
    revalidatePath(`/super-admin/platform-users/${userId}`);
  }
}

export async function toggleUserStatusAction(formData: FormData) {
  const actor = await requireSuperAdminUser();

  const parse = toggleUserSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
  });

  if (!parse.success) {
    return { success: false, error: "Invalid parameters" };
  }

  const { userId, status } = parse.data;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await writeAuditLog({
      actorUserId: actor.id,
      action: status === "ACTIVE" ? "user.activated" : "user.suspended",
      resourceType: "User",
      resourceId: userId,
      metadata: { status },
    });

    revalidateUserPaths(userId);
    return { success: true };
  } catch (err) {
    console.error("Failed to toggle user status:", err);
    return { success: false, error: "Failed to update user account status" };
  }
}

const createPlatformUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isSuperAdmin: z.boolean().default(true),
});

export type PlatformEmailCheckResult = {
  ok: boolean;
  registered: boolean;
  fullName?: string;
  status?: string;
  emailVerified?: boolean;
  isPlatformSuperAdmin?: boolean;
  message?: string;
  error?: string;
};

export async function checkPlatformUserEmailAction(
  email: string,
): Promise<PlatformEmailCheckResult> {
  await requireSuperAdminUser();

  const emailLower = email.trim().toLowerCase();
  if (!emailLower || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return { ok: false, registered: false, error: "Enter a valid email address." };
  }

  const user = await prisma.user.findUnique({
    where: { email: emailLower },
    select: {
      fullName: true,
      status: true,
      emailVerifiedAt: true,
      isPlatformSuperAdmin: true,
    },
  });

  if (!user) {
    return {
      ok: true,
      registered: false,
      message:
        "Email is available. After create, a verification email will be sent — they must verify before login.",
    };
  }

  if (user.isPlatformSuperAdmin) {
    return {
      ok: true,
      registered: true,
      fullName: user.fullName,
      status: user.status,
      emailVerified: Boolean(user.emailVerifiedAt),
      isPlatformSuperAdmin: true,
      message: `Already registered as platform user (${user.fullName}). Choose a different email.`,
    };
  }

  return {
    ok: true,
    registered: true,
    fullName: user.fullName,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    isPlatformSuperAdmin: false,
    message: `Already registered as ${user.fullName} (${user.status}). Use a different email, or manage them under Users.`,
  };
}

export async function createPlatformUserAction(prevState: unknown, formData: FormData) {
  const actor = await requireSuperAdminUser();

  const parse = createPlatformUserSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    isSuperAdmin: formData.get("isSuperAdmin") === "true" || formData.get("isSuperAdmin") === "on",
  });

  if (!parse.success) {
    return { success: false, error: parse.error.issues[0]?.message ?? "Invalid input" };
  }

  const { fullName, email, password, isSuperAdmin } = parse.data;
  const emailLower = email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      return {
        success: false,
        error: "This email is already registered. Choose a different address.",
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        fullName,
        email: emailLower,
        passwordHash,
        status: "ACTIVE",
        isPlatformSuperAdmin: isSuperAdmin,
        emailVerifiedAt: null,
      },
    });

    let emailDelivery: "sent" | "logged" | "failed" = "failed";
    try {
      emailDelivery = await issueEmailVerification({
        userId: created.id,
        email: emailLower,
        fullName: created.fullName,
      });
    } catch (emailError) {
      console.error("Platform user verification email failed:", emailError);
      emailDelivery = "failed";
    }

    await writeAuditLog({
      actorUserId: actor.id,
      action: "platform_user.created",
      resourceType: "User",
      resourceId: created.id,
      metadata: {
        email: created.email,
        isPlatformSuperAdmin: isSuperAdmin,
        emailDelivery,
      },
    });

    revalidateUserPaths(created.id);

    if (emailDelivery === "sent") {
      return {
        success: true,
        error: null,
        message:
          "Platform user created. A verification email was sent — they must verify before login.",
      };
    }

    if (emailDelivery === "logged") {
      return {
        success: true,
        error: null,
        message:
          "Platform user created. SMTP is not configured — the verification link was logged to the server console.",
      };
    }

    return {
      success: true,
      error: null,
      message:
        "Platform user created, but the verification email could not be sent. Configure SMTP or check server logs.",
    };
  } catch (err) {
    console.error("Failed to create platform user:", err);
    return { success: false, error: "Failed to create platform user account" };
  }
}

export async function createUserAction(
  _previous: SuperAdminUserFormState | null,
  formData: FormData,
): Promise<SuperAdminUserFormState> {
  const actor = await requireSuperAdminUser();

  const parsed = createUserSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    status: formData.get("status") || "ACTIVE",
    isPlatformSuperAdmin:
      formData.get("isPlatformSuperAdmin") === "true" ||
      formData.get("isPlatformSuperAdmin") === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const emailLower = parsed.data.email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      return {
        ok: false,
        error: "A user with this email address already exists.",
        fieldErrors: { email: "Email already in use." },
      };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const created = await prisma.user.create({
      data: {
        fullName: parsed.data.fullName,
        email: emailLower,
        passwordHash,
        phone: parsed.data.phone || null,
        status: parsed.data.status,
        isPlatformSuperAdmin: parsed.data.isPlatformSuperAdmin,
      },
    });

    await writeAuditLog({
      actorUserId: actor.id,
      action: "user.created",
      resourceType: "User",
      resourceId: created.id,
      metadata: {
        email: created.email,
        status: created.status,
        isPlatformSuperAdmin: created.isPlatformSuperAdmin,
      },
    });

    revalidateUserPaths(created.id);
    return { ok: true, message: "User created successfully." };
  } catch (err) {
    console.error("Failed to create user:", err);
    return { ok: false, error: "Failed to create user account." };
  }
}

export async function updateUserAction(
  _previous: SuperAdminUserFormState | null,
  formData: FormData,
): Promise<SuperAdminUserFormState> {
  const actor = await requireSuperAdminUser();

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    status: formData.get("status"),
    isPlatformSuperAdmin:
      formData.get("isPlatformSuperAdmin") === "true" ||
      formData.get("isPlatformSuperAdmin") === "on",
    password: formData.get("password") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const emailLower = parsed.data.email.toLowerCase();

  try {
    const existingWithEmail = await prisma.user.findFirst({
      where: {
        email: emailLower,
        NOT: { id: parsed.data.userId },
      },
    });

    if (existingWithEmail) {
      return {
        ok: false,
        error: "Another user already uses this email.",
        fieldErrors: { email: "Email already in use." },
      };
    }

    const data: {
      fullName: string;
      email: string;
      phone: string | null;
      status: "ACTIVE" | "INACTIVE" | "PENDING";
      isPlatformSuperAdmin: boolean;
      passwordHash?: string;
    } = {
      fullName: parsed.data.fullName,
      email: emailLower,
      phone: parsed.data.phone || null,
      status: parsed.data.status,
      isPlatformSuperAdmin: parsed.data.isPlatformSuperAdmin,
    };

    if (parsed.data.password) {
      data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    }

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data,
    });

    await writeAuditLog({
      actorUserId: actor.id,
      action: "user.updated",
      resourceType: "User",
      resourceId: parsed.data.userId,
      metadata: {
        email: emailLower,
        status: parsed.data.status,
        passwordChanged: Boolean(parsed.data.password),
      },
    });

    revalidateUserPaths(parsed.data.userId);
    return { ok: true, message: "User updated successfully." };
  } catch (err) {
    console.error("Failed to update user:", err);
    return { ok: false, error: "Failed to update user account." };
  }
}

export async function deleteUserAction(
  _previous: SuperAdminUserFormState | null,
  formData: FormData,
): Promise<SuperAdminUserFormState> {
  const actor = await requireSuperAdminUser();

  const parsed = deleteUserSchema.safeParse({
    userId: formData.get("userId"),
    confirmEmail: formData.get("confirmEmail"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the confirmation input.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  if (parsed.data.userId === actor.id) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      include: {
        memberships: { select: { id: true } },
        _count: {
          select: {
            materialsCreated: true,
            assignmentsCreated: true,
            assessmentsCreated: true,
          },
        },
      },
    });

    if (!user) {
      return { ok: false, error: "User not found." };
    }

    if (user.email.toLowerCase() !== parsed.data.confirmEmail.trim().toLowerCase()) {
      return {
        ok: false,
        error: "Confirmation email does not match.",
        fieldErrors: { confirmEmail: "Email confirmation mismatch." },
      };
    }

    if (
      user._count.materialsCreated > 0 ||
      user._count.assignmentsCreated > 0 ||
      user._count.assessmentsCreated > 0
    ) {
      return {
        ok: false,
        error:
          "This user created learning content. Suspend the account instead, or remove their materials/assignments first.",
      };
    }

    await prisma.$transaction(async (tx) => {
      const membershipIds = user.memberships.map((m) => m.id);

      if (membershipIds.length > 0) {
        await tx.studentProfile.deleteMany({
          where: { institutionUserId: { in: membershipIds } },
        });
        await tx.lecturerProfile.deleteMany({
          where: { institutionUserId: { in: membershipIds } },
        });
        await tx.institutionUser.deleteMany({
          where: { userId: user.id },
        });
      }

      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await tx.notification.deleteMany({ where: { userId: user.id } });
      await tx.notificationPreference.deleteMany({ where: { userId: user.id } });
      await tx.assignmentSubmission.deleteMany({ where: { userId: user.id } });
      await tx.assessmentAttempt.deleteMany({ where: { userId: user.id } });
      await tx.classChatMessage.deleteMany({ where: { senderId: user.id } });
      await tx.message.deleteMany({ where: { senderId: user.id } });
      await tx.conversationParticipant.deleteMany({ where: { userId: user.id } });

      await tx.user.delete({ where: { id: user.id } });
    });

    await writeAuditLog({
      actorUserId: actor.id,
      action: "user.deleted",
      resourceType: "User",
      resourceId: user.id,
      metadata: { email: user.email, fullName: user.fullName },
    });

    revalidateUserPaths();
    return { ok: true, message: "User permanently deleted." };
  } catch (err) {
    console.error("Failed to delete user:", err);
    return {
      ok: false,
      error: "Failed to delete user. Suspend the account if related records still exist.",
    };
  }
}
