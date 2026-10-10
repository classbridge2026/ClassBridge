export const ROLE_KEYS = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "LECTURER",
  "STUDENT",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];
