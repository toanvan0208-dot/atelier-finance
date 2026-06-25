/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

import type { FinancialStatementSeriesResult } from "../../../../lib/data-sources/financial-statement-read-service";
import { loadFinancialsRuntimeData } from "../load-financials-runtime-data";

const result = (
  ticker: string,
  sourceLabel: string,
  available: boolean,
): FinancialStatementSeriesResult => ({
  ok: available,
  status: available ? "partial" : "unavailable",
  ticker,
  sourceLabel,
  dataMode: "research_only",
  productionApproved: false,
  warnings: [],
  errors: [],
  records: available
    ? [
        {
          id: `${ticker}-${sourceLabel}`,
          ticker,
          fiscalYear: 2025,
          fiscalQuarter: null,
          period: "2025",
          periodType: "year",
          statementDate: null,
          source: {
            sourceLabel,
            dataMode: "research_only",
            productionApproved: false,
            importedAt: "2026-06-25",
            asOf: "2025-12-31",
            fiscalPeriod: "2025",
            ticker,
            statementType: "financial_statement",
            currency: "VND",
            periodType: "year",
            limitations: [],
            warnings: [],
          },
          values: {
            revenue: null,
            grossProfit: null,
            operatingIncome: null,
            netIncome: null,
            totalAssets: null,
            totalLiabilities: null,
            totalDebt: ticker === "MSN" ? 64877.178 : ticker === "MWG" ? 29930.943 : null,
            totalEquity: null,
            cashAndEquivalents: null,
            currentAssets: null,
            currentLiabilities: null,
            operatingCashFlow: null,
            capitalExpenditure: null,
            sharesOutstanding: ticker === "MSN" ? 1520491927 : ticker === "MWG" ? 1468456763 : 1,
            eps: ticker === "MSN" ? 2710 : ticker === "MWG" ? 4774 : 1,
          },
          dataQuality: {
            status: "partial",
            missingFields: [],
            availableFields: ["eps", "sharesOutstanding"],
            invalidFields: [],
            warnings: [],
          },
        },
      ]
    : [],
});

describe("Phase 140G reviewed-PDF source priority", () => {
  it.each(["FPT", "HPG", "VNM", "MSN", "MWG"])(
    "prefers reviewed PDF source for %s",
    async (ticker) => {
      const runtime = await loadFinancialsRuntimeData(
        { ticker, preferDb: true, allowFallback: false },
        {
          readLatestMarketPrice: async () => null as any,
          readSeries: async ({ sourceLabel }) =>
            result(
              ticker,
              sourceLabel ?? "",
              sourceLabel === "annual_report_2025_pdf_reviewed_preview",
            ),
        },
      );
      expect(runtime.source.sourceLabel).toBe(
        "annual_report_2025_pdf_reviewed_preview",
      );
    },
  );

  it("keeps MWG on phase109 if reviewed PDF is absent", async () => {
    const calls: string[] = [];
    const runtime = await loadFinancialsRuntimeData(
      { ticker: "MWG", preferDb: true, allowFallback: false },
      {
        readLatestMarketPrice: async () => null as any,
        readSeries: async ({ sourceLabel }) => {
          calls.push(sourceLabel ?? "");
          return result(
            "MWG",
            sourceLabel ?? "",
            sourceLabel === "phase109_controlled_local_financials",
          );
        },
      },
    );
    expect(runtime.source.sourceLabel).toBe(
      "phase109_controlled_local_financials",
    );
    expect(calls).toContain("annual_report_2025_pdf_reviewed_preview");
  });

  it("keeps VCB behavior unchanged and does not probe reviewed PDF", async () => {
    const calls: string[] = [];
    const runtime = await loadFinancialsRuntimeData(
      { ticker: "VCB", preferDb: true, allowFallback: false },
      {
        readLatestMarketPrice: async () => null as any,
        readSeries: async ({ sourceLabel }) => {
          calls.push(sourceLabel ?? "");
          return result(
            "VCB",
            sourceLabel ?? "",
            sourceLabel === "vnstock_financials_candidate",
          );
        },
      },
    );
    expect(runtime.source.sourceLabel).toBe("vnstock_financials_candidate");
    expect(calls).not.toContain("annual_report_2025_pdf_reviewed_preview");
  });
});
