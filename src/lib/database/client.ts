import "dotenv/config";
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

  const parsedDatabaseUrl = new URL(databaseUrl);
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(parsedDatabaseUrl.hostname);
  const sslMode = parsedDatabaseUrl.searchParams.get("sslmode");
  const needsSsl =
    !isLocalHost &&
    (parsedDatabaseUrl.hostname.includes("supabase.com") || sslMode === "require" || sslMode === "no-verify");
  const poolConnectionString = new URL(databaseUrl);

  if (needsSsl) {
    poolConnectionString.searchParams.delete("sslmode");
  }

  const pool = new Pool({
    connectionString: poolConnectionString.toString(),
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    max: Number(process.env.DATABASE_POOL_MAX ?? (process.env.NODE_ENV === "production" ? "1" : "5")),
    allowExitOnIdle: true,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.atelierFinancePrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.atelierFinancePrisma = prisma;
}

export type DatabaseClient = PrismaClient;
