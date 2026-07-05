import { describe, expect, it } from "vitest";

import { assessFinancialStatementLocalWriteDatabaseUrl } from "../financial-statement-local-write-guard";

describe("financial statement local write guard", () => {
  it("accepts PostgreSQL/Supabase URLs", () => {
    const supabase = assessFinancialStatementLocalWriteDatabaseUrl(
      "postgresql://user:password@db.example.supabase.co/postgres?sslmode=require",
    );
    const localPostgres = assessFinancialStatementLocalWriteDatabaseUrl("postgresql://user:password@localhost:5432/app");

    expect(supabase.accepted).toBe(true);
    expect(supabase.databaseMode).toBe("postgres_supabase");
    expect(localPostgres.accepted).toBe(true);
    expect(localPostgres.databaseMode).toBe("postgres_dev");
  });

  it("rejects missing, SQLite/file, non-Postgres, and production-like URLs", () => {
    const missing = assessFinancialStatementLocalWriteDatabaseUrl(undefined);
    const sqlite = assessFinancialStatementLocalWriteDatabaseUrl("file:./dev.db");
    const mysql = assessFinancialStatementLocalWriteDatabaseUrl("mysql://user:password@example.com/db");
    const production = assessFinancialStatementLocalWriteDatabaseUrl("postgresql://user:password@prod.example.com/db");

    expect(missing.accepted).toBe(false);
    expect(sqlite.accepted).toBe(false);
    expect(mysql.accepted).toBe(false);
    expect(production.accepted).toBe(false);
    expect(mysql.safeDatabaseUrlDisplay).toContain("<redacted>");
  });
});
