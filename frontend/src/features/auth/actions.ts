"use server";

import { createHash, randomBytes } from "crypto";
import type { ZodError } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSessionCookie,
  destroySessionCookie,
  type SessionMembership,
  type SessionUser,
} from "@/lib/auth/session";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "./schemas";
import { serverEnv } from "@/config/env";
import { isEmailConfigured } from "@/lib/email/client";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";
import { RoleKey } from "@prisma/client";

export type AuthFormState = {
  ok: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  redirectUrl?: string;
};

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

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

function forgotPasswordSuccessMessage(): string {
  if (isEmailConfigured()) {
    return "If an active account matches that email, you will receive a password reset link shortly.";
  }

  if (serverEnv.NODE_ENV === "development") {
    return "If an active account matches that email, a reset link was logged to the server console because SMTP is not configured.";
  }

  return "If an active account matches that email, you will receive a password reset link shortly.";
}

export async function submitLogin(
  _previous: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const emailLower = parsed.data.email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      include: {
        memberships: {
          include: {
            institution: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      return { ok: false, error: "Invalid email or password." };
    }

    if (user.status !== "ACTIVE") {
      return { ok: false, error: "Your account is deactivated or pending approval." };
    }

    if (user.isPlatformSuperAdmin && !user.emailVerifiedAt) {
      return {
        ok: false,
        error:
          "Please verify your email before signing in. Check your inbox for the ClassBridge verification link.",
      };
    }

    const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!passwordMatches) {
      return { ok: false, error: "Invalid email or password." };
    }

    const activeMemberships: SessionMembership[] = user.memberships
      .filter((m) => m.status === "ACTIVE" && m.institution.status === "ACTIVE")
      .map((m) => ({
        institutionId: m.institutionId,
        institutionSlug: m.institution.slug,
        institutionName: m.institution.name,
        roleKey: m.role.key,
        institutionUserId: m.id,
      }));

    if (!user.isPlatformSuperAdmin && activeMemberships.length === 0) {
      return { ok: false, error: "No active institution membership found." };
    }

    const primaryMembership = activeMemberships[0];

    const sessionPayload: Omit<SessionUser, "createdAtTimestamp"> = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isPlatformSuperAdmin: user.isPlatformSuperAdmin,
      activeMembership: primaryMembership,
      memberships: activeMemberships,
    };

    await createSessionCookie(sessionPayload);

    let redirectUrl = "/student";
    if (user.isPlatformSuperAdmin) {
      redirectUrl = "/super-admin";
    } else if (primaryMembership?.roleKey === RoleKey.SUPER_ADMIN) {
      redirectUrl = "/super-admin";
    } else if (primaryMembership?.roleKey === RoleKey.INSTITUTION_ADMIN) {
      redirectUrl = "/institution-admin";
    } else if (primaryMembership?.roleKey === RoleKey.LECTURER) {
      redirectUrl = "/lecturer";
    } else if (primaryMembership?.roleKey === RoleKey.STUDENT) {
      redirectUrl = "/student";
    }

    return { ok: true, redirectUrl };
  } catch (error) {
    console.error("Login server action error:", error);
    return { ok: false, error: "An unexpected error occurred during authentication. Please try again." };
  }
}

export async function submitLogout(): Promise<void> {
  await destroySessionCookie();
}

export async function submitForgotPassword(
  _previous: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const emailLower = parsed.data.email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (user && user.status === "ACTIVE") {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const resetUrl = `${appBaseUrl()}/reset-password?token=${rawToken}`;

      try {
        await sendPasswordResetEmail({
          to: emailLower,
          fullName: user.fullName,
          resetUrl,
          expiresMinutes: RESET_TOKEN_TTL_MS / 60000,
        });
      } catch (emailError) {
        console.error("Password reset email delivery failed:", emailError);
      }
    }

    return { ok: true, message: forgotPasswordSuccessMessage() };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { ok: false, error: "Unable to process password reset right now. Please try again." };
  }
}

export async function submitResetPassword(
  _previous: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token") || undefined,
    password: formData.get("password"),
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
    const tokenHash = hashResetToken(parsed.data.token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          emailVerifiedAt: new Date(),
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      ok: true,
      message: "Password updated successfully. You can sign in with your new password.",
      redirectUrl: "/login",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return { ok: false, error: "Unable to reset password right now. Please try again." };
  }
}
