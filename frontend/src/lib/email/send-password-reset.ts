import "server-only";
import { serverEnv } from "@/config/env";
import { sendEmail, isEmailConfigured } from "@/lib/email/client";
import { buildPasswordResetEmail } from "@/lib/email/templates/password-reset";

type SendPasswordResetEmailInput = {
  to: string;
  fullName: string;
  resetUrl: string;
  expiresMinutes: number;
};

export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput,
): Promise<"sent" | "logged"> {
  const { subject, html, text } = buildPasswordResetEmail(input);

  if (isEmailConfigured()) {
    await sendEmail({
      to: input.to,
      subject,
      html,
      text,
    });
    return "sent";
  }

  if (serverEnv.NODE_ENV === "development") {
    console.info(`[password-reset] Email not configured. Reset link for ${input.to}: ${input.resetUrl}`);
    return "logged";
  }

  throw new Error("SMTP is not configured for password reset email delivery.");
}
