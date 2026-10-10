import "server-only";
import { serverEnv } from "@/config/env";
import { sendEmail, isEmailConfigured } from "@/lib/email/client";
import { buildStudentInviteEmail } from "@/lib/email/templates/student-invite";

type SendStudentInviteEmailInput = {
  to: string;
  studentName: string;
  adminName: string;
  institutionName: string;
  temporaryPassword: string;
  loginUrl: string;
};

export async function sendStudentInviteEmail(
  input: SendStudentInviteEmailInput,
): Promise<"sent" | "logged"> {
  const { subject, html, text } = buildStudentInviteEmail({
    studentName: input.studentName,
    adminName: input.adminName,
    institutionName: input.institutionName,
    email: input.to,
    temporaryPassword: input.temporaryPassword,
    loginUrl: input.loginUrl,
  });

  if (isEmailConfigured()) {
    await sendEmail({ to: input.to, subject, html, text });
    return "sent";
  }

  if (serverEnv.NODE_ENV === "development") {
    console.info(
      `[student-invite] SMTP not configured. Would email ${input.to} with temp password ${input.temporaryPassword}`,
    );
    return "logged";
  }

  throw new Error("SMTP is not configured for student invite email delivery.");
}
