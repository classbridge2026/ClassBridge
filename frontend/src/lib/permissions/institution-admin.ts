import "server-only";
import { redirect } from "next/navigation";
import { RoleKey } from "@prisma/client";
import { requireAuthUser } from "@/lib/permissions/rbac";
import type { SessionUser } from "@/lib/auth/session";

export type InstitutionAdminContext = {
  user: SessionUser;
  institutionId: string;
  institutionName: string;
  institutionSlug: string;
  institutionUserId: string;
};

/**
 * Auth gate for Institution Admin routes/actions.
 * Institution ID always comes from the session membership — never from the client.
 * Platform Super Admin does not inherit this console; they must use Super Admin.
 */
export async function requireInstitutionAdmin(): Promise<InstitutionAdminContext> {
  const user = await requireAuthUser();
  const membership = user.activeMembership;

  if (
    !membership?.institutionId ||
    membership.roleKey !== RoleKey.INSTITUTION_ADMIN
  ) {
    redirect("/login?error=unauthorized");
  }

  return {
    user,
    institutionId: membership.institutionId,
    institutionName: membership.institutionName,
    institutionSlug: membership.institutionSlug,
    institutionUserId: membership.institutionUserId,
  };
}

/** Assert a resource's institutionId matches the admin's institution. */
export function assertSameInstitution(
  resourceInstitutionId: string | null | undefined,
  adminInstitutionId: string,
): boolean {
  return Boolean(resourceInstitutionId && resourceInstitutionId === adminInstitutionId);
}
