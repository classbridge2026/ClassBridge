type EmailVerificationInput = {
  fullName: string;
  verifyUrl: string;
  loginUrl: string;
  expiresMinutes: number;
};

export function buildEmailVerificationEmail({
  fullName,
  verifyUrl,
  loginUrl,
  expiresMinutes,
}: EmailVerificationInput) {
  const greeting = fullName.trim() ? `Hi ${fullName},` : "Hi,";
  const subject = "Verify your ClassBridge email";

  const text = [
    greeting,
    "",
    "A ClassBridge platform account was created for you. Please verify your email before signing in.",
    `Verify link (expires in ${expiresMinutes} minutes):`,
    verifyUrl,
    "",
    `After verifying, sign in at: ${loginUrl}`,
    "",
    "If you did not expect this email, you can ignore it.",
    "",
    "— ClassBridge",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 560px;">
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">
        A ClassBridge platform account was created for you. Please verify your email before signing in.
      </p>
      <p style="margin: 0 0 24px;">
        <a href="${verifyUrl}" style="display: inline-block; background: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
          Verify email
        </a>
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
        This link expires in ${expiresMinutes} minutes. If the button does not work, copy and paste this URL:
      </p>
      <p style="margin: 0 0 16px; font-size: 13px; word-break: break-all; color: #334155;">${verifyUrl}</p>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        After verifying, sign in at <a href="${loginUrl}" style="color: #0f766e;">${loginUrl}</a>
      </p>
    </div>
  `.trim();

  return { subject, html, text };
}
