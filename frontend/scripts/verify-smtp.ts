/**
 * One-off SMTP connectivity check.
 * Usage: npx tsx scripts/verify-smtp.ts
 */
import "dotenv/config";
import nodemailer from "nodemailer";

async function main() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !from || !user || !pass) {
    console.error("Missing SMTP_HOST, SMTP_FROM, SMTP_USER, or SMTP_PASS in .env");
    process.exit(1);
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  console.log(`Verifying SMTP ${host}:${port} as ${user}...`);
  await transport.verify();
  console.log("SMTP connection OK.");

  const to = process.env.SMTP_TEST_TO || user;
  const info = await transport.sendMail({
    from,
    to,
    subject: "ClassBridge SMTP test",
    text: "ClassBridge SMTP is configured correctly. Password reset emails can be delivered.",
    html: "<p>ClassBridge SMTP is configured correctly. Password reset emails can be delivered.</p>",
  });

  console.log(`Test email sent to ${to}. messageId=${info.messageId}`);
}

main().catch((error) => {
  console.error("SMTP verification failed:");
  console.error(error);
  process.exit(1);
});
