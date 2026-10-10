type PasswordResetEmailInput = {
  fullName: string;
  resetUrl: string;
  expiresMinutes: number;
};

export function buildPasswordResetEmail({
  fullName,
  resetUrl,
  expiresMinutes,
}: PasswordResetEmailInput) {
  const subject = "Reset your ClassBridge password";
  const greeting = fullName.trim() ? `Hi ${fullName},` : "Hi,";

  const text = [
    greeting,
    "",
    "We received a request to reset your ClassBridge password.",
    `Use this link to choose a new password (expires in ${expiresMinutes} minutes):`,
    resetUrl,
    "",
    "If you did not request this, you can ignore this email.",
    "",
    "— ClassBridge",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 560px;">
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">We received a request to reset your ClassBridge password.</p>
      <p style="margin: 0 0 24px;">
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
          Reset password
        </a>
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
        This link expires in ${expiresMinutes} minutes. If the button does not work, copy and paste this URL into your browser:
      </p>
      <p style="margin: 0 0 24px; font-size: 13px; word-break: break-all; color: #334155;">${resetUrl}</p>
      <p style="margin: 0; font-size: 14px; color: #64748b;">If you did not request this, you can ignore this email.</p>
    </div>
  `.trim();

  return { subject, html, text };
}
