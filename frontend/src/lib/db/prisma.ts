import "server-only";
import { PrismaClient } from "@prisma/client";
import { serverEnv } from "@/config/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  if (!serverEnv.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in .env before using the database.",
    );
  }

  return new PrismaClient({
    log:
      serverEnv.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
});
