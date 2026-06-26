 
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getPostgresTestDatabase } from "@/test-utils/postgres-test-database";

describe("financials unit metadata sidecar schema", () => {
  it("adds the sidecar model and parent relation to schema.prisma", () => {
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf-8");
    expect(schema).toContain("model FinancialStatementUnitMetadata");
    expect(schema).toContain("unitMetadata        FinancialStatementUnitMetadata[]");
    expect(schema).toContain("@@unique([financialStatementId, field])");
    expect(schema).toContain("@@index([financialStatementId])");
    expect(schema).toContain("productionApproved   Boolean            @default(false)");
  });

  it("actually creates the table, index and constraints in PostgreSQL", async () => {
    const db = getPostgresTestDatabase();
    
    // Check table exists
    const tableRes = await db.prisma.$queryRawUnsafe<any[]>(`SELECT * FROM information_schema.tables WHERE table_name = 'FinancialStatementUnitMetadata'`);
    expect(tableRes.length).toBeGreaterThan(0);
    
    // Check unique index
    const indexRes = await db.prisma.$queryRawUnsafe<any[]>(`
      SELECT indexname, indexdef FROM pg_indexes 
      WHERE tablename = 'FinancialStatementUnitMetadata' AND indexname LIKE '%_key';
    `);
    expect(indexRes.some(r => r.indexdef.includes('financialStatementId') && r.indexdef.includes('field'))).toBe(true);

    // Check cascade constraint
    const cascadeRes = await db.prisma.$queryRawUnsafe<any[]>(`
      SELECT confdeltype::text, confupdtype::text FROM pg_constraint 
      WHERE conrelid = '"FinancialStatementUnitMetadata"'::regclass AND contype = 'f';
    `);
    // In pg, 'a' = no action, 'r' = restrict, 'c' = cascade, 'n' = set null, 'd' = set default
    expect(cascadeRes.some(r => r.confdeltype === 'c' && r.confupdtype === 'c')).toBe(true);
    
    await db.cleanup();
  });
});
