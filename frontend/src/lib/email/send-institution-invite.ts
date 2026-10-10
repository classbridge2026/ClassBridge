import "server-only";
import { serverEnv } from "@/config/env";
import { sendEmail, isEmailConfigured } from "@/lib/email/client";
import { buildInstitutionInviteEmail } from "@/lib/email/templates/institution-invite";

type SendInstitutionInviteEmailInput = {
  to: string;
  fullName: string;
  institutionName: string;
  isExistingUser: boolean;
  setupUrl: string;
  loginUrl: string;
  expiresMinutes: number;
};

export async function sendInstitutionInviteEmail(
  input: SendInstitutionInviteEmailInput,
): Promise<"sent" | "logged"> {
  const { subject, html, text } = buildInstitutionInviteEmail(input);

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
      `[institution-invite] Email not configured. Setup link for ${input.to}: ${input.setupUrl}`,
    );
    return "logged";
  }

  throw new Error("SMTP is not configured for institution invite email delivery.");
}
