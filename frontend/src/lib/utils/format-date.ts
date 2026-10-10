/** Deterministic date string for SSR + client (avoids locale hydration mismatches). */
export function formatDate(value: string | number | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
