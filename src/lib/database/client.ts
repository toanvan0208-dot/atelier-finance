import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  atelierFinancePrisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize the Prisma client.");
}

const createPrismaClient = (): PrismaClient => {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Phase 29F.1 Prisma runtime supports local SQLite file: DATABASE_URL only.");
  }

  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.atelierFinancePrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.atelierFinancePrisma = prisma;
}

export type DatabaseClient = PrismaClient;
