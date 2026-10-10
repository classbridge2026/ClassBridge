import "server-only";
import nodemailer from "nodemailer";
import { serverEnv } from "@/config/env";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function smtpConfigured(): boolean {
  return Boolean(serverEnv.SMTP_HOST && serverEnv.SMTP_FROM);
}

export function isEmailConfigured(): boolean {
  return smtpConfigured();
}

function createTransport() {
  if (!smtpConfigured()) {
    throw new Error("SMTP is not configured.");
  }

  const port = serverEnv.SMTP_PORT ?? 587;
  const secure = serverEnv.SMTP_SECURE ?? port === 465;

  return nodemailer.createTransport({
    host: serverEnv.SMTP_HOST,
    port,
    secure,
    auth:
      serverEnv.SMTP_USER && serverEnv.SMTP_PASS
        ? {
            user: serverEnv.SMTP_USER,
            pass: serverEnv.SMTP_PASS,
          }
        : undefined,
  });
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const transport = createTransport();

  await transport.sendMail({
    from: serverEnv.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
