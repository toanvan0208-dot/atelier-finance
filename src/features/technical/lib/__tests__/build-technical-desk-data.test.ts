import { describe, expect, it } from "vitest";
import { buildTechnicalDeskData } from "../build-technical-desk-data";
import { mapTechnicalToLogicInput, type TechnicalMarketSnapshot } from "../map-technical-to-logic-input";
import type { PVTObservationData } from "../../types";

const baseData: PVTObservationData = {
  ticker: "ABC",
  companyName: "ABC",
  industry: "Retail",
  currentPrice: 50_000,
  status: {
    label: "Base",
    tone: "neutral",
    conclusion: "Base conclusion",
  },
  keyLevels: {
    support: "48.000",
    resistance: "55.000",
  },
  volume: {
    currentVsAvg20: 1,
    label: "Base volume",
    conclusion: "Base volume conclusion",
  },
  chart: {
    title: "PVT",
    points: [
      { label: "T-1", price: 49, volume: 1, ma20: 48, ma50: 47 },
      { label: "Now", price: 50, volume: 2, ma20: 49, ma50: 48 },
    ],
    events: [],
    quickRead: [],
  },
  signalLayers: [
    {
      id: "price",
      title: "Price",
      shortTitle: "Price",
      question: "Price?",
      conclusion: "Base price",
      evidence: [],
      commonMistake: "Base",
    },
    {
      id: "volume",
      title: "Volume",
      shortTitle: "Volume",
      question: "Volume?",
      conclusion: "Base volume",
      evidence: [],
      commonMistake: "Base",
    },
  ],
  confirmation: [],
  invalidation: [],
  scenarios: [],
  riskReward: {
    currentPrice: 50_000,
    supportPrice: 48_000,
    resistancePrice: 55_000,
    upside: "Chưa đủ dữ liệu",
    downside: "Chưa đủ dữ liệu",
    conclusion: "Base risk/reward",
  },
  fomo: {
    level: "Thấp",
    score: 1,
    maxScore: 6,
    signs: [],
    conclusion: "Base fomo",
  },
  finalConclusion: {
    status: "Base status",
    positive: "Base positive",
    caution: "Base caution",
    nextStep: "Base next step",
  },
  nextActions: [{ label: "Đưa vào Watchlist", moduleKey: "watchlist", primary: true }],
};

const completeSnapshot: TechnicalMarketSnapshot = {
  ticker: "ABC",
  companyType: "non_financial",
  industry: "Retail",
  period: "Today",
  periodType: "unknown",
  sourceName: "Unit test",
  collectedAt: "2026-06-01",
  closePrice: 50_000,
  previousClosePrice: 48_000,
  volume: 2_000,
  avgVolume20d: 1_000,
};

const getMetric = (data: PVTObservationData, id: string) => {
  const metric = data.logicSummary?.metrics.find((item) => item.id === id);
  expect(metric).toBeDefined();
  return metric!;
};

describe("technical PVT logic adapter", () => {
  it("maps market snapshot fields to FinancialStatementInput without calculating metrics", () => {
    const input = mapTechnicalToLogicInput(completeSnapshot);

    expect(input.closePrice).toBe(50_000);
    expect(input.previousClosePrice).toBe(48_000);
    expect(input.volume).toBe(2_000);
    expect(input.avgVolume20d).toBe(1_000);
  });
});

describe("technical PVT builder", () => {
  it("calculates price change percent through financial logic core when close prices are present", () => {
    const data = buildTechnicalDeskData(baseData, completeSnapshot);
    const priceChange = getMetric(data, "priceChangePct");

    expect(priceChange.rawValue).toBeCloseTo(0.041666, 5);
    expect(priceChange.value).toBe("4.2%");
  });

  it("keeps price change unavailable when previousClosePrice is missing", () => {
    const data = buildTechnicalDeskData(baseData, {
      ...completeSnapshot,
      previousClosePrice: null,
    });
    const priceChange = getMetric(data, "priceChangePct");

    expect(priceChange.rawValue).toBeNull();
    expect(priceChange.value).toBe("Chưa đủ dữ liệu");
    expect(priceChange.missingFields).toContain("previousClosePrice");
    expect(priceChange.value).not.toBe("0%");
  });

  it("calculates trading value through financial logic core when closePrice and volume are present", () => {
    const data = buildTechnicalDeskData(baseData, completeSnapshot);
    const tradingValue = getMetric(data, "tradingValue");

    expect(tradingValue.rawValue).toBe(100_000_000);
  });

  it("does not fabricate trading value when closePrice or volume is missing", () => {
    const data = buildTechnicalDeskData(baseData, {
      ...completeSnapshot,
      volume: null,
    });
    const tradingValue = getMetric(data, "tradingValue");

    expect(tradingValue.rawValue).toBeNull();
    expect(tradingValue.value).toBe("Chưa đủ dữ liệu");
    expect(tradingValue.missingFields).toContain("volume");
  });

  it("calculates average trading value 20d through financial logic core when avgVolume20d is present", () => {
    const data = buildTechnicalDeskData(baseData, completeSnapshot);
    const avgTradingValue20d = getMetric(data, "avgTradingValue20d");

    expect(avgTradingValue20d.rawValue).toBe(50_000_000);
  });

  it("does not assume 20-session data when avgVolume20d and avgTradingValue20d are missing", () => {
    const data = buildTechnicalDeskData(baseData, {
      ...completeSnapshot,
      avgVolume20d: null,
      avgTradingValue20d: null,
    });
    const avgTradingValue20d = getMetric(data, "avgTradingValue20d");

    expect(avgTradingValue20d.rawValue).toBeNull();
    expect(avgTradingValue20d.value).toBe("Chưa đủ dữ liệu");
    expect(avgTradingValue20d.missingFields).toEqual(
      expect.arrayContaining(["avgTradingValue20d", "avgVolume20d"])
    );
  });

  it("uses core liquidity status instead of classifying liquidity in component or raw data", () => {
    const data = buildTechnicalDeskData(baseData, completeSnapshot);
    const liquidityStatus = getMetric(data, "liquidityStatus");

    expect(liquidityStatus.rawValue).not.toBeNull();
    expect(data.volume.label).toBe(liquidityStatus.value);
  });

  it("reflects poor data quality in builder output", () => {
    const data = buildTechnicalDeskData(baseData, {
      ...completeSnapshot,
      sourceName: null,
      collectedAt: null,
    });

    expect(data.logicSummary?.dataQualityRisk.level).not.toBe("low");
    expect(data.logicSummary?.dataQualityRisk.warnings.join(" ")).toMatch(/nguồn|cập nhật|Thiếu/i);
  });

  it("does not mark complete technical market data as poor because financial statement fields are absent", () => {
    const data = buildTechnicalDeskData(baseData, completeSnapshot);

    expect(data.logicSummary?.dataQualityRisk.level).toBe("low");
    expect(data.logicSummary?.dataQualityRisk.missingFields).not.toContain("revenue");
    expect(data.logicSummary?.dataQualityRisk.missingFields).not.toContain("netProfit");
    expect(data.logicSummary?.dataQualityRisk.missingFields).not.toContain("totalEquity");
  });

  it("surfaces market-profile warnings for missing comparison price, volume, and 20-session average", () => {
    const data = buildTechnicalDeskData(baseData, {
      ...completeSnapshot,
      previousClosePrice: null,
      volume: null,
      avgVolume20d: null,
      avgTradingValue20d: null,
    });
    const warnings = data.logicSummary?.dataQualityRisk.warnings.join(" ") ?? "";

    expect(data.logicSummary?.dataQualityRisk.level).toBe("medium");
    expect(warnings).toMatch(/giá phiên trước|biến động giá/i);
    expect(warnings).toMatch(/khối lượng|giá trị giao dịch/i);
    expect(warnings).toMatch(/bình quân 20 phiên/i);
  });

  it("does not output buy/sell/hold recommendation wording", () => {
    const data = buildTechnicalDeskData(baseData, completeSnapshot);
    const output = JSON.stringify(data).toLowerCase();

    expect(output).not.toMatch(/tín hiệu mua|tín hiệu bán|sell the news|\bbuy\b|\bsell\b|\bhold\b|recommendation/);
  });
});
