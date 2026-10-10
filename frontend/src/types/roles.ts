export const ROLE_KEYS = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "ADMIN_OFFICER",
  "EXAM_OFFICER",
  "FINANCE_OFFICER",
  "LECTURER",
  "STUDENT",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];
