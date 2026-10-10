import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { RoleKey } from "@prisma/client";

/**
 * Ensures user is authenticated. Redirects to /login if unauthenticated.
 */
export async function requireAuthUser(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Ensures user is authenticated AND has one of the allowed role keys or is Super Admin.
 */
export async function requireRoleUser(allowedRoles: RoleKey[]): Promise<SessionUser> {
  const session = await requireAuthUser();

  // Platform Super Admin bypasses role checks
  if (session.isPlatformSuperAdmin) {
    return session;
  }

  const activeRole = session.activeMembership?.roleKey;
  if (!activeRole || !allowedRoles.includes(activeRole)) {
    redirect("/login?error=unauthorized");
  }

  return session;
}

/**
 * Ensures user is a Super Admin.
 */
export async function requireSuperAdminUser(): Promise<SessionUser> {
  const session = await requireAuthUser();
  if (!session.isPlatformSuperAdmin && session.activeMembership?.roleKey !== RoleKey.SUPER_ADMIN) {
    redirect("/login?error=unauthorized");
  }
  return session;
}

/** Aliases for backward compatibility */
export const requirePlatformSuperAdmin = requireSuperAdminUser;
export const requireRole = requireRoleUser;
