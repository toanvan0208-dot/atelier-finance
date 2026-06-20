import { describe, expect, it, vi } from "vitest";

import { getFinancialStatementSeries } from "../financial-statement-read-service";

const record = (patch: Record<string, unknown> = {}) => ({
  id: "fs-1",
  ticker: "FPT",
  periodType: "year",
  period: "2025",
  fiscalYear: 2025,
  fiscalQuarter: null,
  reportDate: "2026-03-31",
  currency: "VND",
  revenue: 1000,
  grossProfit: 300,
  netIncome: 120,
  operatingCashFlow: null,
  totalAssets: 2000,
  equity: 800,
  totalDebt: 400,
  currentAssets: 900,
  currentLiabilities: 500,
  eps: 1200,
  sharesOutstanding: 100,
  sourceLabel: "local_financial_statement_research",
  dataMode: "research_only",
  asOf: "2026-03-31",
  collectedAt: "2026-04-01",
  missingFields: "[]",
  warningCodes: "[]",
  errorCodes: "[]",
  ...patch,
});

describe("financial statement read service", () => {
  it("returns local records with source metadata and preserves null fields", async () => {
    const findMany = vi.fn().mockResolvedValue([record()]);
    const result = await getFinancialStatementSeries(
      { ticker: " fpt ", sourceLabel: "local_financial_statement_research", dataMode: "research_only" },
      { db: { financialStatement: { findMany } } },
    );

    expect(result.ok).toBe(true);
    expect(result.status).toBe("partial");
    expect(result.productionApproved).toBe(false);
    expect(result.ticker).toBe("FPT");
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      ticker: "FPT",
      fiscalYear: 2025,
      period: "2025",
      source: {
        sourceLabel: "local_financial_statement_research",
        dataMode: "research_only",
        productionApproved: false,
        statementType: "financial_statement",
      },
      values: {
        revenue: 1000,
        netIncome: 120,
        operatingCashFlow: null,
        capitalExpenditure: null,
      },
    });
    expect(result.records[0].dataQuality.missingFields).toContain("operatingCashFlow");
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("does not query DB when ticker is invalid", async () => {
    const findMany = vi.fn();
    const result = await getFinancialStatementSeries(
      { ticker: "   " },
      { db: { financialStatement: { findMany } } },
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe("invalid_input");
    expect(result.productionApproved).toBe(false);
    expect(result.errors).toContain("Ticker is required.");
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns unavailable without sample fallback when no local records exist", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const result = await getFinancialStatementSeries(
      { ticker: "FPT" },
      { db: { financialStatement: { findMany } } },
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe("unavailable");
    expect(result.records).toEqual([]);
    expect(result.productionApproved).toBe(false);
    expect(result.warnings.join(" ")).toContain("No local financial statement records");
  });

  it("flags non-positive equity without replacing it with zero-derived interpretation", async () => {
    const findMany = vi.fn().mockResolvedValue([record({ equity: -1 })]);
    const result = await getFinancialStatementSeries(
      { ticker: "FPT" },
      { db: { financialStatement: { findMany } } },
    );

    expect(result.records[0].values.totalEquity).toBe(-1);
    expect(result.records[0].dataQuality.warnings.join(" ")).toContain("non-positive");
  });

  it("does not emit prohibited recommendation or trading-signal wording", async () => {
    const findMany = vi.fn().mockResolvedValue([record()]);
    const result = await getFinancialStatementSeries(
      { ticker: "FPT" },
      { db: { financialStatement: { findMany } } },
    );
    const output = JSON.stringify(result).toLowerCase();

    expect(output).not.toMatch(/nên mua|nên bán|nên nắm giữ|tín hiệu mua|tín hiệu bán|điểm mua|cổ phiếu an toàn|chắc chắn rẻ|chắc chắn xấu/);
  });
});

