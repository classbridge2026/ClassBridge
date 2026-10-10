import "server-only";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { serverEnv } from "@/config/env";
import { sendEmailVerification } from "@/lib/email/send-email-verification";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function appBaseUrl(): string {
  return serverEnv.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export async function issueEmailVerification(input: {
  userId: string;
  email: string;
  fullName: string;
}): Promise<"sent" | "logged"> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: input.userId,
      tokenHash,
      expiresAt,
    },
  });

  const verifyUrl = `${appBaseUrl()}/verify-email?token=${rawToken}`;
  const loginUrl = `${appBaseUrl()}/login`;

  return sendEmailVerification({
    to: input.email,
    fullName: input.fullName,
    verifyUrl,
    loginUrl,
    expiresMinutes: VERIFY_TOKEN_TTL_MS / 60000,
  });
}

export async function verifyEmailWithToken(token: string): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
}> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, emailVerifiedAt: true } } },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return {
      ok: false,
      error: "This verification link is invalid or has expired. Ask an admin to create/resend an invite.",
    };
  }

  if (record.user.emailVerifiedAt) {
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return {
      ok: true,
      message: "Your email is already verified. You can sign in.",
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return {
    ok: true,
    message: "Email verified successfully. You can now sign in with your password.",
  };
}
