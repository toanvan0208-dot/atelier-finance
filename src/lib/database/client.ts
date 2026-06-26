import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  atelierFinancePrisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize the Prisma client.");
}

const createPrismaClient = (): PrismaClient => {
  if (databaseUrl.startsWith("file:")) {
    throw new Error("Phase 142F Prisma runtime supports postgresql DATABASE_URL only.");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.atelierFinancePrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.atelierFinancePrisma = prisma;
}

export type DatabaseClient = PrismaClient;
