import { describe, expect, it } from "vitest";

import {
  bridgeFinancialsContract,
  bridgeValuationContract,
  type DataSourceMetadata,
  type FinancialStatementRecord,
  type MarketDataRecord,
  type ValuationInputRecord,
} from "../index";

const makeMetadata = (patch: Partial<DataSourceMetadata> = {}): DataSourceMetadata => ({
  source: "unit-test-source",
  sourceType: "curated_internal",
  asOf: "2026-06-17",
  period: {
    type: "quarter",
    value: "2026-Q2",
    fiscalYear: 2026,
    fiscalQuarter: 2,
  },
  collectedAt: "2026-06-17T00:00:00.000Z",
  isDemoData: false,
  isStale: false,
  missingFields: [],
  warnings: [],
  ...patch,
});

const makeStatement = (
  patch: Partial<FinancialStatementRecord> = {},
): FinancialStatementRecord => ({
  ticker: "AAA",
  companyType: "non_financial",
  revenue: 1_000,
  grossProfit: 300,
  netIncome: 100,
  operatingCashFlow: 120,
  totalAssets: 2_000,
  equity: 800,
  totalDebt: 300,
  currentAssets: 500,
  currentLiabilities: 250,
  metadata: makeMetadata(),
  ...patch,
});

const makeMarket = (patch: Partial<MarketDataRecord> = {}): MarketDataRecord => ({
  ticker: "AAA",
  closePrice: 20,
  previousClose: 19,
  volume: 1_000_000,
  tradingValue: 20_000_000,
  metadata: makeMetadata({
    source: "market-source",
    period: { type: "day", value: "2026-06-17" },
  }),
  ...patch,
});

const makeValuation = (
  patch: Partial<ValuationInputRecord> = {},
): ValuationInputRecord => ({
  ticker: "AAA",
  eps: 2,
  bvps: 10,
  sharesOutstanding: 100_000_000,
  marketCap: 2_000_000_000,
  enterpriseValue: null,
  metadata: makeMetadata({
    source: "valuation-source",
    period: { type: "ttm", value: "TTM-2026-Q2" },
  }),
  ...patch,
});

describe("module data contract bridge", () => {
  it("preserves financials metadata while mapping canonical fields to current logic input", () => {
    const statement = makeStatement();
    const market = makeMarket();

    const result = bridgeFinancialsContract({ statement, market });

    expect(result.metadata.statement.source).toBe("unit-test-source");
    expect(result.metadata.market?.source).toBe("market-source");
    expect(result.metadata.combined.source).toBe("unit-test-source");
    expect(result.metadata.combined.asOf).toBe("2026-06-17");
    expect(result.logicInput.netProfit).toBe(statement.netIncome);
    expect(result.logicInput.totalEquity).toBe(statement.equity);
    expect(result.logicInput.closePrice).toBe(market.closePrice);
  });

  it("does not turn missing operating cash flow into zero", () => {
    const result = bridgeFinancialsContract({
      statement: makeStatement({ operatingCashFlow: null }),
    });

    expect(result.logicInput.operatingCashFlow).toBeNull();
    expect(result.contractMetrics.cfoToAssets.value).toBeNull();
    expect(result.contractMetrics.cfoToAssets.status).toBe("insufficient_data");
  });

  it("marks ROA and CFOA as insufficient when total assets are null or zero", () => {
    for (const totalAssets of [null, 0]) {
      const result = bridgeFinancialsContract({
        statement: makeStatement({ totalAssets }),
      });

      expect(result.contractMetrics.roa.value).toBeNull();
      expect(result.contractMetrics.roa.status).toBe("insufficient_data");
      expect(result.contractMetrics.cfoToAssets.value).toBeNull();
      expect(result.contractMetrics.cfoToAssets.status).toBe("insufficient_data");
    }
  });

  it("marks P/E as not applicable when EPS is zero or negative", () => {
    for (const eps of [0, -1]) {
      const result = bridgeValuationContract({
        statement: makeStatement(),
        market: makeMarket(),
        valuation: makeValuation({ eps }),
      });

      expect(result.contractMetrics.peInterpretation.interpretation).toBe("not_applicable");
      expect(result.moduleMetrics.peRatio.value).toBeNull();
      expect(result.moduleMetrics.peRatio.level).toBe("not_applicable");
    }
  });

  it("marks P/B, BVPS, and ROE as not applicable when equity is zero or negative", () => {
    for (const equity of [0, -1]) {
      const result = bridgeValuationContract({
        statement: makeStatement({ equity }),
        market: makeMarket(),
        valuation: makeValuation(),
      });

      expect(result.contractMetrics.equityInterpretation.interpretation).toBe("not_applicable");
      expect(result.moduleMetrics.pbRatio.value).toBeNull();
      expect(result.moduleMetrics.pbRatio.level).toBe("not_applicable");
      expect(result.moduleMetrics.bvps.value).toBeNull();
      expect(result.moduleMetrics.bvps.level).toBe("not_applicable");
      expect(result.moduleMetrics.roe.value).toBeNull();
      expect(result.moduleMetrics.roe.level).toBe("not_applicable");
    }
  });

  it("returns not_ready valuation readiness when close price is missing", () => {
    const result = bridgeValuationContract({
      statement: makeStatement(),
      market: makeMarket({ closePrice: null }),
      valuation: makeValuation(),
    });

    expect(result.readiness).toBe("not_ready");
    expect(result.missingFields).toContain("closePrice");
  });

  it("returns not_ready valuation readiness when valuation inputs are missing", () => {
    const result = bridgeValuationContract({
      statement: makeStatement(),
      market: makeMarket(),
      valuation: makeValuation({
        eps: null,
        bvps: null,
        sharesOutstanding: null,
      }),
    });

    expect(result.readiness).toBe("not_ready");
    expect(result.missingFields).toEqual(
      expect.arrayContaining(["eps", "bvps", "sharesOutstanding"]),
    );
  });

  it("keeps demo data marked in bridge metadata and readiness", () => {
    const result = bridgeFinancialsContract({
      statement: makeStatement({
        metadata: makeMetadata({ isDemoData: true }),
      }),
    });

    expect(result.metadata.combined.isDemoData).toBe(true);
    expect(result.readiness).toBe("needs_review");
  });
});

