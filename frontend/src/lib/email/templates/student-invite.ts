type StudentInviteEmailInput = {
  studentName: string;
  adminName: string;
  institutionName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
};

export function buildStudentInviteEmail({
  studentName,
  adminName,
  institutionName,
  email,
  temporaryPassword,
  loginUrl,
}: StudentInviteEmailInput) {
  const greeting = studentName.trim() ? `Hi ${studentName},` : "Hi,";
  const subject = `${adminName} added you to ClassBridge (${institutionName})`;

  const text = [
    greeting,
    "",
    `${adminName} has added you to ClassBridge for ${institutionName}.`,
    "",
    "Your login credentials:",
    `Email: ${email}`,
    `Temporary password: ${temporaryPassword}`,
    "",
    `Sign in at: ${loginUrl}`,
    "",
    "For your security, please change this password after you sign in.",
    "",
    "— ClassBridge",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 560px;">
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">
        <strong>${adminName}</strong> has added you to ClassBridge for
        <strong>${institutionName}</strong>.
      </p>
      <div style="margin: 0 0 20px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;">
          Login credentials
        </p>
        <p style="margin: 0 0 6px;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0;"><strong>Temporary password:</strong> ${temporaryPassword}</p>
      </div>
      <p style="margin: 0 0 20px;">
        <a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
          Sign in to ClassBridge
        </a>
      </p>
      <p style="margin: 0; font-size: 14px; color: #b45309;">
        For your security, please change this password after you sign in.
      </p>
    </div>
  `.trim();

  return { subject, html, text };
}
