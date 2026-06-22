import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { FinancialStatementSeriesResult } from "../../../../lib/data-sources/financial-statement-read-service";
import { financialReadingDeskData } from "../../data/financialReadingDesk.data";
import { buildFinancialReadingDeskData } from "../build-financial-reading-desk-data";
import {
  auditFinancialsStatementSnapshot,
  financialsTickerMatches,
} from "../financials-data-audit";
import { loadFinancialsRuntimeData } from "../load-financials-runtime-data";

const sourceLabel = "financials_audit_local_research";

const seriesForTicker = (ticker: string): FinancialStatementSeriesResult => ({
  ok: true,
  status: "partial",
  ticker,
  sourceLabel,
  dataMode: "research_only",
  productionApproved: false,
  warnings: [],
  errors: [],
  records: [
    {
      id: `${ticker}-2024`,
      ticker,
      fiscalYear: 2024,
      fiscalQuarter: null,
      period: "2024",
      periodType: "year",
      statementDate: null,
      source: {
        sourceLabel,
        dataMode: "research_only",
        productionApproved: false,
        importedAt: "2026-06-20",
        asOf: "2024-12-31",
        fiscalPeriod: "2024",
        ticker,
        statementType: "financial_statement",
        currency: "VND",
        periodType: "year",
        limitations: ["Local research data"],
        warnings: [],
      },
      values: {
        revenue: 1_000,
        grossProfit: null,
        operatingIncome: null,
        netIncome: 100,
        totalAssets: 2_000,
        totalLiabilities: 800,
        totalDebt: null,
        totalEquity: 1_200,
        cashAndEquivalents: null,
        currentAssets: null,
        currentLiabilities: null,
        operatingCashFlow: null,
        capitalExpenditure: null,
        sharesOutstanding: null,
        eps: null,
      },
      dataQuality: {
        status: "partial",
        missingFields: ["operatingCashFlow", "totalDebt", "sharesOutstanding", "eps"],
        availableFields: ["revenue", "netIncome", "totalAssets", "totalLiabilities", "totalEquity"],
        invalidFields: [],
        warnings: [],
      },
    },
  ],
});

describe("Financials MVP data audit", () => {
  it.each(["FPT", "MWG", "VNM"])(
    "keeps unavailable fallback for %s on the requested ticker without a borrowed snapshot",
    async (ticker) => {
      const result = await loadFinancialsRuntimeData(
        { ticker, preferDb: false },
        { readSeries: async () => seriesForTicker(ticker) },
      );

      expect(result.source.ticker).toBe(ticker);
      expect(result.source.productionApproved).toBe(false);
      expect(result.source.fallbackUsed).toBe(true);
      expect(result.statementSnapshot).toBeNull();
      expect(result.dataQuality.missingFields).toEqual(
        expect.arrayContaining(["revenue", "netIncome", "operatingCashFlow", "eps"]),
      );
    },
  );

  it("blocks a DB record whose ticker differs from the requested ticker", async () => {
    const result = await loadFinancialsRuntimeData(
      { ticker: "FPT", preferDb: true, allowFallback: true, sourceLabel },
      { readSeries: async () => seriesForTicker("MWG") },
    );

    expect(result.runtimeStatus).toBe("unavailable");
    expect(result.source.ticker).toBe("FPT");
    expect(result.statementSnapshot).toBeNull();
    expect(result.source.fallbackUsed).toBe(false);
    expect(result.dataQuality.warnings.join(" ")).toContain("ticker mismatch");
  });

  it("normalizes ticker comparisons without allowing a different ticker", () => {
    expect(financialsTickerMatches(" fpt ", "FPT")).toBe(true);
    expect(financialsTickerMatches("FPT", "MWG")).toBe(false);
    expect(financialsTickerMatches("FPT", null)).toBe(false);
  });

  it.each([null, 0, -1])("marks EPS %s insufficient for P/E interpretation", (eps) => {
    const audit = auditFinancialsStatementSnapshot({ eps });
    expect(audit.canInterpretPe).toBe(false);
    expect(audit.eps).not.toBe("available");
  });

  it.each([null, 0, -1])("blocks share metrics when sharesOutstanding is %s", (sharesOutstanding) => {
    const audit = auditFinancialsStatementSnapshot({ sharesOutstanding });
    expect(audit.canUseShareMetrics).toBe(false);
    expect(audit.sharesOutstanding).not.toBe("available");
  });

  it.each([null, 0, -1])("blocks equity interpretation when equity is %s", (totalEquity) => {
    const audit = auditFinancialsStatementSnapshot({ totalEquity });
    expect(audit.canInterpretEquityMetrics).toBe(false);
    expect(audit.equity).not.toBe("available");
  });

  it("does not relabel totalLiabilities as totalDebt", () => {
    const audit = auditFinancialsStatementSnapshot({
      totalLiabilities: 800,
      totalDebt: null,
    });
    expect(audit.canAssessDebt).toBe(false);
    expect(audit.totalDebt).toBe("missing");
  });

  it("keeps a fully missing snapshot away from zero scores and mock conclusions", () => {
    const desk = buildFinancialReadingDeskData(financialReadingDeskData, {
      ticker: "VNM",
      period: "2024",
    });

    expect(desk.preliminaryConclusion.score).toBeNull();
    expect(desk.preliminaryConclusion.scoreNote).toContain("Chưa đủ dữ liệu");
    expect(desk.metrics.find((metric) => metric.id === "roe")?.value).toBe(
      "Không phù hợp để diễn giải",
    );
    expect(desk.metrics.find((metric) => metric.id === "roe")?.value).not.toContain("0");
  });

  it("keeps positive recommendation wording out of Financials UI copy", () => {
    const source = [
      "src/features/financials/components/FinancialsPage.tsx",
      "src/features/financials/components/FinancialsSourceTransparency.tsx",
      "src/features/financials/data/financials.data.ts",
    ]
      .map((file) => readFileSync(join(process.cwd(), file), "utf8").toLowerCase())
      .join("\n");
    const forbidden = [
      "nên mua",
      "nên bán",
      "nên nắm giữ",
      "tín hiệu mua",
      "tín hiệu bán",
      "điểm mua",
      "cổ phiếu an toàn",
      "đáng mua",
      "giá mục tiêu",
      "fair value",
      "target price",
      "upside",
      "downside",
      "recommendation",
      "doanh nghiệp tốt",
      "doanh nghiệp xấu",
    ];

    for (const term of forbidden) expect(source).not.toContain(term);
  });
});
