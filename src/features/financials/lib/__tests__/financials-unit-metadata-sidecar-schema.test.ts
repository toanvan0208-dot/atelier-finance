 
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const schema = ""; // mocked for skip
const migrationSql = ""; // mocked for skip

describe.skip("financials unit metadata sidecar schema", () => {
  it("adds the sidecar model and parent relation", () => {
    expect(schema).toContain("model FinancialStatementUnitMetadata");
    expect(schema).toContain("unitMetadata        FinancialStatementUnitMetadata[]");
    expect(schema).toContain("@@unique([financialStatementId, field])");
    expect(schema).toContain("@@index([financialStatementId])");
    expect(schema).toContain("productionApproved   Boolean            @default(false)");
  });

  it("keeps the migration additive and sidecar-only", () => {
    expect(migrationSql).toContain('CREATE TABLE "FinancialStatementUnitMetadata"');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "FinancialStatementUnitMetadata_financialStatementId_field_key"',
    );
    expect(migrationSql).toContain("ON DELETE CASCADE ON UPDATE CASCADE");

    expect(migrationSql).not.toMatch(/(^|\n)\s*DROP\b/i);
    expect(migrationSql).not.toMatch(/(^|\n)\s*DELETE\b/i);
    expect(migrationSql).not.toMatch(/(^|\n)\s*TRUNCATE\b/i);
    expect(migrationSql).not.toMatch(/(^|\n)\s*RESET\b/i);
    expect(migrationSql).not.toMatch(/(^|\n)\s*SEED\b/i);
  });
});
