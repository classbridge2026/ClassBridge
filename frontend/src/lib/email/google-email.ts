import "server-only";
import dns from "node:dns/promises";
import { isGmailDomain } from "@/lib/email/google-email-shared";

function isGoogleMx(exchange: string): boolean {
  const host = exchange.toLowerCase().replace(/\.$/, "");
  return (
    host.endsWith(".google.com") ||
    host.endsWith(".googlemail.com") ||
    host.includes("aspmx.l.google") ||
    host.includes("googlemail")
  );
}

/** True when the address is Gmail or a Google Workspace domain (MX → Google). */
export async function isGoogleConnectedEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 1) return false;

  const domain = normalized.slice(at + 1);
  if (!domain || domain.includes(" ")) return false;
  if (isGmailDomain(domain)) return true;

  try {
    const records = await dns.resolveMx(domain);
    if (!records.length) return false;
    return records.some((record) => isGoogleMx(record.exchange));
  } catch {
    return false;
  }
}
