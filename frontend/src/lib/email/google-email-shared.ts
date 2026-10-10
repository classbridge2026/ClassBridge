const GOOGLE_CONSUMER_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

export function isGmailDomain(domain: string): boolean {
  return GOOGLE_CONSUMER_DOMAINS.has(domain.trim().toLowerCase());
}

/** Fast client-side check for consumer Gmail addresses. */
export function isLikelyGoogleEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 1) return false;
  return isGmailDomain(normalized.slice(at + 1));
}
