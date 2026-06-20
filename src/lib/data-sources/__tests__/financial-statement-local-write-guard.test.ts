import { describe, expect, it } from "vitest";

import { assessFinancialStatementLocalWriteDatabaseUrl } from "../financial-statement-local-write-guard";

describe("financial statement local write guard", () => {
  it("accepts local SQLite dev file URLs", () => {
    const relative = assessFinancialStatementLocalWriteDatabaseUrl("file:./dev.db");
    const parent = assessFinancialStatementLocalWriteDatabaseUrl("file:../dev.db");
    const absolute = assessFinancialStatementLocalWriteDatabaseUrl("file:/tmp/atelier-finance-dev.db");

    expect(relative.accepted).toBe(true);
    expect(parent.accepted).toBe(true);
    expect(absolute.accepted).toBe(true);
    expect(relative.databaseMode).toBe("local_sqlite_dev");
  });

  it("rejects missing, remote, and production-like URLs", () => {
    const missing = assessFinancialStatementLocalWriteDatabaseUrl(undefined);
    const postgres = assessFinancialStatementLocalWriteDatabaseUrl("postgresql://user:password@example.com/db");
    const mysql = assessFinancialStatementLocalWriteDatabaseUrl("mysql://user:password@example.com/db");
    const production = assessFinancialStatementLocalWriteDatabaseUrl("file:./production.db");

    expect(missing.accepted).toBe(false);
    expect(postgres.accepted).toBe(false);
    expect(mysql.accepted).toBe(false);
    expect(production.accepted).toBe(false);
    expect(postgres.safeDatabaseUrlDisplay).toContain("<redacted>");
  });
});
