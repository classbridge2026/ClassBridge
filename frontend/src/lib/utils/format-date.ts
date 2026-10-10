/** Deterministic date string for SSR + client (avoids locale hydration mismatches). */
export function formatDate(value: string | number | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

/** Deterministic date+time string for SSR + client (fixed en-US, not host locale). */
export function formatDateTime(value: string | number | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}
