import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Dùng cho test environment (Postgres Docker Local Disposable)
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://atelier:atelier@localhost:5432/atelier_finance_test?schema=public";

export function getPostgresTestDatabase() {
  if (!TEST_DATABASE_URL.includes("localhost") && !TEST_DATABASE_URL.includes("127.0.0.1")) {
    throw new Error("TEST_DATABASE_URL must be a local database to prevent destructive actions.");
  }

  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  return {
    prisma,
    async reset() {
      // In PostgreSQL, to clean up, we can delete all data from public tables
      const tableNames = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(`
        SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
      `);
      
      if (tableNames.length > 0) {
        const tables = tableNames.map(t => `"public"."${t.tablename}"`).join(", ");
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      }
    },
    async cleanup() {
      await prisma.$disconnect();
      await pool.end();
    }
  };
}
