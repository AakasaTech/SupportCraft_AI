import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // The first interactive transaction on a fresh connection pool has been
    // observed taking ~7s (vs ~1s steady-state) against Neon — comfortably
    // over Prisma's 5s default $transaction timeout. Give both a generous
    // margin so a cold pool doesn't intermittently fail signup/invitation
    // transactions right after a deploy/restart.
    transactionOptions: { maxWait: 10_000, timeout: 15_000 },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
