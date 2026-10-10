import "server-only";
import { serverEnv } from "@/config/env";
import { sendEmail, isEmailConfigured } from "@/lib/email/client";
import { buildEmailVerificationEmail } from "@/lib/email/templates/email-verification";

type SendEmailVerificationInput = {
  to: string;
  fullName: string;
  verifyUrl: string;
  loginUrl: string;
  expiresMinutes: number;
};

export async function sendEmailVerification(
  input: SendEmailVerificationInput,
): Promise<"sent" | "logged"> {
  const { subject, html, text } = buildEmailVerificationEmail(input);

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
    console.info(
      `[email-verification] Email not configured. Verify link for ${input.to}: ${input.verifyUrl}`,
    );
    return "logged";
  }

  throw new Error("SMTP is not configured for email verification delivery.");
}
