"use server";

import { prisma } from "@/lib/db/prisma";
import { requireSuperAdminUser } from "@/lib/permissions/rbac";

export type SuperAdminSearchResult = {
  institutions: Array<{ id: string; name: string; slug: string; status: string }>;
  users: Array<{
    id: string;
    fullName: string;
    email: string;
    isPlatformSuperAdmin: boolean;
    status: string;
  }>;
};

export async function searchSuperAdmin(query: string): Promise<SuperAdminSearchResult> {
  await requireSuperAdminUser();

  const q = query.trim();
  if (q.length < 2) {
    return { institutions: [], users: [] };
  }

  const [institutions, users] = await Promise.all([
    prisma.institution.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, slug: true, status: true },
      take: 8,
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        isPlatformSuperAdmin: true,
        status: true,
      },
      take: 8,
      orderBy: { fullName: "asc" },
    }),
  ]);

  return { institutions, users };
}
