import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  atelierFinancePrisma?: PrismaClient;
};

export const prisma = globalForPrisma.atelierFinancePrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.atelierFinancePrisma = prisma;
}

export type DatabaseClient = PrismaClient;
