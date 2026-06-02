import { PrismaClient } from "@prisma/client";

/**
 * Prisma-klient som singleton. I utvecklingsläge återanvänds samma instans
 * mellan hot-reloads för att undvika att anslutningarna tar slut.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
