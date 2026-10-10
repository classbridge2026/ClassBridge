import { RoleKey } from "@prisma/client";

/** Campus console roles (not lecturer/student). */
export const INSTITUTION_STAFF_ROLES: RoleKey[] = [
  RoleKey.INSTITUTION_ADMIN,
  RoleKey.ADMIN_OFFICER,
  RoleKey.EXAM_OFFICER,
  RoleKey.FINANCE_OFFICER,
];

export const STAFF_ROLE_LABELS: Record<
  (typeof INSTITUTION_STAFF_ROLES)[number],
  string
> = {
  INSTITUTION_ADMIN: "Institution Admin",
  ADMIN_OFFICER: "Admin Officer",
  EXAM_OFFICER: "Exam Officer",
  FINANCE_OFFICER: "Finance Officer",
};

/** Roles that may be invited from the Administrators screen (not Institution Admin). */
export const INVITABLE_STAFF_ROLES: RoleKey[] = [
  RoleKey.ADMIN_OFFICER,
  RoleKey.EXAM_OFFICER,
  RoleKey.FINANCE_OFFICER,
];

/**
 * Nav privilege map for the institution console.
 * Institution Admin has full access; officers get scoped menus for later domain work.
 *
 * - Admin Officer: day-to-day academics & people (not admin invites / settings)
 * - Exam Officer: students, courses, classes, reports (assessments later)
 * - Finance Officer: students + reports (fees/billing later)
 */
const ROLE_NAV: Record<(typeof INSTITUTION_STAFF_ROLES)[number], string[] | "*"> = {
  INSTITUTION_ADMIN: "*",
  ADMIN_OFFICER: [
    "/institution-admin",
    "/institution-admin/students",
    "/institution-admin/lecturers",
    "/institution-admin/departments",
    "/institution-admin/programs",
    "/institution-admin/courses",
    "/institution-admin/classes",
    "/institution-admin/reports",
    "/institution-admin/activity",
  ],
  EXAM_OFFICER: [
    "/institution-admin",
    "/institution-admin/students",
    "/institution-admin/courses",
    "/institution-admin/classes",
    "/institution-admin/reports",
    "/institution-admin/activity",
  ],
  FINANCE_OFFICER: [
    "/institution-admin",
    "/institution-admin/students",
    "/institution-admin/reports",
    "/institution-admin/activity",
  ],
};

export function isInstitutionStaffRole(roleKey: RoleKey): boolean {
  return INSTITUTION_STAFF_ROLES.includes(roleKey);
}

export function staffRoleLabel(roleKey: RoleKey): string {
  if (isInstitutionStaffRole(roleKey)) {
    return STAFF_ROLE_LABELS[roleKey];
  }
  return roleKey;
}

export function canManageAdministrators(roleKey: RoleKey): boolean {
  return roleKey === RoleKey.INSTITUTION_ADMIN;
}

export function navAllowedForRole(roleKey: RoleKey, href: string): boolean {
  if (!isInstitutionStaffRole(roleKey)) return false;
  const allowed = ROLE_NAV[roleKey];
  if (allowed === "*") return true;
  return allowed.some(
    (prefix) => href === prefix || (prefix !== "/institution-admin" && href.startsWith(`${prefix}/`)),
  );
}

export function filterNavHrefsForRole(roleKey: RoleKey, hrefs: string[]): string[] {
  if (!isInstitutionStaffRole(roleKey)) return [];
  const allowed = ROLE_NAV[roleKey];
  if (allowed === "*") return hrefs;
  return hrefs.filter((href) => allowed.includes(href));
}

export function pathAllowedForRole(roleKey: RoleKey, pathname: string): boolean {
  if (!isInstitutionStaffRole(roleKey)) return false;
  const allowed = ROLE_NAV[roleKey];
  if (allowed === "*") return true;

  if (pathname === "/institution-admin") return true;

  return allowed.some((prefix) => {
    if (prefix === "/institution-admin") return pathname === prefix;
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}
