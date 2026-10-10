type InstitutionInviteEmailInput = {
  fullName: string;
  institutionName: string;
  isExistingUser: boolean;
  setupUrl: string;
  loginUrl: string;
  expiresMinutes: number;
};

export function buildInstitutionInviteEmail({
  fullName,
  institutionName,
  isExistingUser,
  setupUrl,
  loginUrl,
  expiresMinutes,
}: InstitutionInviteEmailInput) {
  const greeting = fullName.trim() ? `Hi ${fullName},` : "Hi,";
  const subject = isExistingUser
    ? `You've been added as admin of ${institutionName} on ClassBridge`
    : `Set up your ClassBridge admin account for ${institutionName}`;

  const primaryLabel = isExistingUser ? "Set password & sign in" : "Create password & sign in";
  const intro = isExistingUser
    ? `You have been assigned as the primary administrator for ${institutionName} on ClassBridge. Use the link below to set or update your password, then sign in.`
    : `A ClassBridge institution account for ${institutionName} has been created for you. Use the link below to create your password and sign in.`;

  const text = [
    greeting,
    "",
    intro,
    `Link (expires in ${expiresMinutes} minutes):`,
    setupUrl,
    "",
    `After setting your password, you can also sign in at: ${loginUrl}`,
    "",
    "— ClassBridge",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 560px;">
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">${intro}</p>
      <p style="margin: 0 0 24px;">
        <a href="${setupUrl}" style="display: inline-block; background: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
          ${primaryLabel}
        </a>
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
        This link expires in ${expiresMinutes} minutes. If the button does not work, copy and paste this URL:
      </p>
      <p style="margin: 0 0 16px; font-size: 13px; word-break: break-all; color: #334155;">${setupUrl}</p>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        Sign in later at <a href="${loginUrl}" style="color: #0f766e;">${loginUrl}</a>
      </p>
    </div>
  `.trim();

  return { subject, html, text };
}
