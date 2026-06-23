/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

import type { FinancialStatementSeriesResult } from "../../../../lib/data-sources/financial-statement-read-service";
import { adaptFinancialStatementSeries } from "../adapt-financial-statement-records";

const resultBase = (patch: Partial<FinancialStatementSeriesResult> = {}): FinancialStatementSeriesResult => ({
  ok: true,
  status: "partial",
  ticker: "FPT",
  sourceLabel: "local_financial_statement_research",
  dataMode: "research_only",
  productionApproved: false,
  warnings: ["Financial statement read path is local academic/research only; production approval remains false."],
  errors: [],
  records: [
    {
      id: "fs-1",
      ticker: "FPT",
      fiscalYear: 2025,
      fiscalQuarter: null,
      period: "2025",
      periodType: "year",
      statementDate: "2026-03-31",
      source: {
        sourceLabel: "local_financial_statement_research",
        dataMode: "research_only",
        productionApproved: false,
        importedAt: "2026-04-01",
        asOf: "2026-03-31",
        fiscalPeriod: "2025",
        ticker: "FPT",
        statementType: "financial_statement",
        currency: "VND",
        periodType: "year",
        limitations: ["Local/research-only financial statement data is not production-approved."],
        warnings: [],
      },
      values: {
        revenue: null,
        grossProfit: 300,
        operatingIncome: null,
        netIncome: null,
        totalAssets: 2000,
        totalLiabilities: 1_200,
        totalDebt: 400,
        totalEquity: 0,
        cashAndEquivalents: 125,
        currentAssets: 900,
        currentLiabilities: 500,
        operatingCashFlow: null,
        capitalExpenditure: null,
        sharesOutstanding: 100,
        eps: -1,
      },
      dataQuality: {
        status: "partial",
        missingFields: ["revenue", "netIncome", "operatingCashFlow"],
        availableFields: ["grossProfit", "totalAssets", "totalEquity"],
        invalidFields: [],
        warnings: ["totalEquity is non-positive; equity-based interpretation must remain not_applicable."],
      },
    },
  ],
  ...patch,
});

describe("adaptFinancialStatementSeries", () => {
  it("maps local records to Financials snapshots while preserving null values", () => {
    const result = adaptFinancialStatementSeries(resultBase());

    expect(result.ok).toBe(true);
    expect(result.status).toBe("partial");
    expect(result.productionApproved).toBe(false);
    expect(result.statements).toHaveLength(1);
    expect(result.statements[0].snapshot).toMatchObject({
      ticker: "FPT",
      period: "2025",
      periodType: "annual",
      sourceName: "local_financial_statement_research",
      revenue: null,
      netProfit: null,
      operatingCashFlow: null,
      capitalExpenditure: null,
      cashAndEquivalents: 125,
      totalEquity: 0,
      totalLiabilities: 1_200,
      totalDebt: 400,
      eps: -1,
    });
    expect(result.statements[0].metadata).toMatchObject({
      sourceLabel: "local_financial_statement_research",
      dataMode: "research_only",
      productionApproved: false,
      fallbackUsed: false,
    });
    expect(result.missingFields).toEqual(expect.arrayContaining(["revenue", "netIncome", "operatingCashFlow"]));
  });

  it("keeps unavailable read results empty instead of falling back to sample financials", () => {
    const result = adaptFinancialStatementSeries(resultBase({
      ok: false,
      status: "unavailable",
      records: [],
      warnings: ["No local financial statement records were found."],
    }));

    expect(result.ok).toBe(false);
    expect(result.status).toBe("unavailable");
    expect(result.statements).toEqual([]);
    expect(result.productionApproved).toBe(false);
    expect(result.warnings.join(" ")).toContain("No local financial statement records");
  });

  it("does not emit prohibited recommendation or trading-signal wording", () => {
    const result = adaptFinancialStatementSeries(resultBase());
    const output = JSON.stringify(result).toLowerCase();

    expect(output).not.toMatch(/nên mua|nên bán|nên nắm giữ|tín hiệu mua|tín hiệu bán|điểm mua|cổ phiếu an toàn|chắc chắn rẻ|chắc chắn xấu/);
  });
});
