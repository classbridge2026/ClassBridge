import "server-only";
import { redirect } from "next/navigation";
import { RoleKey } from "@prisma/client";
import { requireAuthUser } from "@/lib/permissions/rbac";
import type { SessionUser } from "@/lib/auth/session";
import {
  canManageAdministrators,
  isInstitutionStaffRole,
  pathAllowedForRole,
} from "@/lib/permissions/institution-privileges";

export type InstitutionAdminContext = {
  user: SessionUser;
  institutionId: string;
  institutionName: string;
  institutionSlug: string;
  institutionUserId: string;
  roleKey: RoleKey;
};

/**
 * Auth gate for Institution Admin console routes/actions.
 * Allows Institution Admin and campus officer roles.
 * Institution ID always comes from the session membership — never from the client.
 */
export async function requireInstitutionAdmin(): Promise<InstitutionAdminContext> {
  const user = await requireAuthUser();
  const membership = user.activeMembership;

  if (!membership?.institutionId || !isInstitutionStaffRole(membership.roleKey)) {
    redirect("/login?error=unauthorized");
  }

  return {
    user,
    institutionId: membership.institutionId,
    institutionName: membership.institutionName,
    institutionSlug: membership.institutionSlug,
    institutionUserId: membership.institutionUserId,
    roleKey: membership.roleKey,
  };
}

/** Only full Institution Admins may invite/manage campus staff roles. */
export async function requireFullInstitutionAdmin(): Promise<InstitutionAdminContext> {
  const ctx = await requireInstitutionAdmin();
  if (!canManageAdministrators(ctx.roleKey)) {
    redirect("/institution-admin?error=forbidden");
  }
  return ctx;
}

/** Redirect officers away from routes outside their privilege set. */
export async function assertInstitutionPathAccess(pathname: string): Promise<InstitutionAdminContext> {
  const ctx = await requireInstitutionAdmin();
  if (!pathAllowedForRole(ctx.roleKey, pathname)) {
    redirect("/institution-admin?error=forbidden");
  }
  return ctx;
}

/** Assert a resource's institutionId matches the admin's institution. */
export function assertSameInstitution(
  resourceInstitutionId: string | null | undefined,
  adminInstitutionId: string,
): boolean {
  return Boolean(resourceInstitutionId && resourceInstitutionId === adminInstitutionId);
}
