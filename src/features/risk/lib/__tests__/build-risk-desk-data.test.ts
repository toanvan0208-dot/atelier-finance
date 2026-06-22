import { describe, expect, it } from "vitest";
import {
  baseRiskRedesignData,
  riskRedesignDataByTicker,
  riskStatementSnapshotsByTicker,
} from "../../data/riskRedesign.data";
import { buildMissingDataRiskSummary, buildRiskDeskData } from "../build-risk-desk-data";
import { mapRiskToLogicInput, type RiskStatementSnapshot } from "../map-risk-to-logic-input";

const completeSnapshot: RiskStatementSnapshot = {
  ticker: "AAA",
  companyName: "AAA Test",
  companyType: "non_financial",
  industry: "Test industry",
  period: "2024",
  periodType: "annual",
  sourceName: "Manual reviewed source",
  collectedAt: "2025-03-31",
  revenue: 10_000,
  netProfit: 1_000,
  totalEquity: 12_000,
  totalDebt: 2_000,
  operatingCashFlow: 1_200,
  sharesOutstanding: 100,
  eps: 10,
  closePrice: 50,
};

const dataText = (value: unknown) => JSON.stringify(value).toLowerCase();

describe("mapRiskToLogicInput", () => {
  it("maps fields without turning missing data into zero", () => {
    const input = mapRiskToLogicInput({ ticker: "AAA", operatingCashFlow: undefined, totalDebt: null });

    expect(input.ticker).toBe("AAA");
    expect(input.operatingCashFlow).toBeUndefined();
    expect(input.totalDebt).toBeNull();
    expect(input.totalDebt).not.toBe(0);
  });
});

describe("buildMissingDataRiskSummary", () => {
  it("creates missing-data summaries for FPT, MWG, and VNM without wrong ticker fallback", () => {
    for (const ticker of ["FPT", "MWG", "VNM"]) {
      const summary = buildMissingDataRiskSummary(riskStatementSnapshotsByTicker[ticker]);

      expect(summary.ticker).toBe(ticker);
      expect(summary.productionApproved).toBe(false);
      expect(summary.dataMode).toBe("research_only");
      expect(summary.overallDataReadiness).toBe("partial");
      expect(summary.riskSummaryLabel).toBe("Chưa đủ dữ liệu");
    }
  });

  it("lists missing EPS, totalDebt, equity, sharesOutstanding and market price", () => {
    const summary = buildMissingDataRiskSummary({ ...completeSnapshot, eps: null, totalDebt: null, totalEquity: null, sharesOutstanding: null, closePrice: null });

    expect(summary.missingFinancialFields).toEqual(
      expect.arrayContaining(["EPS", "totalDebt", "equity", "sharesOutstanding", "market price"]),
    );
    expect(summary.unavailableValuationMetrics).toEqual(
      expect.arrayContaining(["P/E", "P/B", "BVPS", "marketCap", "P/S"]),
    );
  });

  it("does not relabel totalLiabilities as totalDebt", () => {
    const summary = buildMissingDataRiskSummary({
      ...completeSnapshot,
      totalDebt: null,
      totalLiabilities: 9_000,
    });

    expect(summary.missingFinancialFields).toContain("totalDebt");
  });

  it("keeps production approval false for research/local/manual summaries", () => {
    const summary = buildMissingDataRiskSummary(completeSnapshot);

    expect(summary.productionApproved).toBe(false);
    expect(summary.dataMode).toBe("research_only");
  });
});

describe("buildRiskDeskData", () => {
  it("uses neutral missing-data labels instead of investment score labels", () => {
    const data = buildRiskDeskData(baseRiskRedesignData, { ...completeSnapshot, eps: null });

    expect(data.overall.score).toBeNull();
    expect(data.finalConclusion.readiness).toMatch(/dữ liệu|kiểm tra/i);
    expect(data.overall.status).not.toMatch(/điểm đầu tư|risk score/i);
  });

  it("lists unavailable valuation metrics as metrics that cannot be calculated", () => {
    const data = buildRiskDeskData(baseRiskRedesignData, {
      ...completeSnapshot,
      eps: null,
      totalEquity: null,
      sharesOutstanding: null,
      closePrice: null,
      revenue: null,
    });
    const source = data.riskSources.find((item) => item.id === "unavailable-metrics");

    expect(source?.title).toBe("Chỉ số chưa thể tính");
    expect(source?.relatedMetrics).toEqual(expect.arrayContaining(["P/E", "P/B", "BVPS", "marketCap", "P/S"]));
    expect(source?.mainRisk).toContain("thiếu dữ liệu đầu vào");
  });

  it("does not render mock/sample/fallback data as real data in default ticker summaries", () => {
    const output = dataText(riskRedesignDataByTicker);

    expect(output).not.toContain("mock");
    expect(output).not.toContain("fallbackused");
    expect(output).not.toContain("dữ liệu giả");
    expect(output).not.toContain("mock financial statement snapshot");
  });

  it("does not contain recommendation or financial-risk-rule conclusions", () => {
    const output = dataText(riskRedesignDataByTicker);
    const blockedPhrases = [
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
      "nợ vay cao",
      "nợ vay thấp",
      "rủi ro cao",
      "rủi ro thấp",
      "debt-to-equity",
    ];

    for (const phrase of blockedPhrases) {
      expect(output).not.toContain(phrase);
    }
  });
});
