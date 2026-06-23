/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

import {
  buildFinancialsUnitMetadata,
  financialsUnitContracts,
  financialsUnitsForValuation,
  isFinancialsUnitAccepted,
} from "../financials-unit-metadata-contract";
import type { FinancialsStatementSnapshot } from "../map-financials-to-logic-input";

const snapshot = {
  ticker: "FPT",
  period: "2024",
  periodType: "annual",
  sourceName: "phase45_synthetic_financial_statement_local_write",
  collectedAt: null,
  revenue: 1_000,
  previousRevenue: null,
  grossProfit: null,
  operatingProfit: null,
  netProfit: 100,
  previousNetProfit: null,
  totalAssets: 2_000,
  previousTotalAssets: null,
  totalLiabilities: null,
  totalEquity: 1_200,
  previousTotalEquity: null,
  currentAssets: 700,
  currentLiabilities: 300,
  operatingCashFlow: 200,
  previousOperatingCashFlow: null,
  capitalExpenditure: null,
  sharesOutstanding: 100,
  eps: 1_000,
} satisfies FinancialsStatementSnapshot;

describe("financials unit metadata contract", () => {
  it("defines only Financials import fields and excludes market-derived inputs", () => {
    expect(Object.keys(financialsUnitContracts).sort()).toEqual([
      "currentAssets",
      "currentLiabilities",
      "eps",
      "equity",
      "netIncome",
      "operatingCashFlow",
      "revenue",
      "sharesOutstanding",
      "totalAssets",
      "totalDebt",
    ]);
    expect("marketPrice" in financialsUnitContracts).toBe(false);
    expect("marketCap" in financialsUnitContracts).toBe(false);
  });

  it("accepts currency units for statement totals, EPS unit for EPS, and share units for shares", () => {
    expect(isFinancialsUnitAccepted("revenue", "million_vnd")).toBe(true);
    expect(isFinancialsUnitAccepted("equity", "billion_vnd")).toBe(true);
    expect(isFinancialsUnitAccepted("operatingCashFlow", "vnd")).toBe(true);
    expect(isFinancialsUnitAccepted("eps", "vnd_per_share")).toBe(true);
    expect(isFinancialsUnitAccepted("eps", "vnd")).toBe(false);
    expect(isFinancialsUnitAccepted("sharesOutstanding", "million_shares")).toBe(true);
    expect(isFinancialsUnitAccepted("sharesOutstanding", "million_vnd")).toBe(false);
  });

  it("keeps present values unknown when source metadata has no explicit unit", () => {
    const metadata = buildFinancialsUnitMetadata({
      dataMode: "research_only",
      snapshot,
      sourceLabel: "phase45_synthetic_financial_statement_local_write",
    });

    expect(metadata.revenue).toMatchObject({
      productionApproved: false,
      status: "unknown_unit",
      unit: "unknown",
      warnings: ["revenue_financials_unit_metadata_missing"],
    });
    expect(metadata.equity.status).toBe("unknown_unit");
    expect(metadata.netIncome.status).toBe("unknown_unit");
    expect(metadata.eps.status).toBe("unknown_unit");
    expect(metadata.sharesOutstanding.status).toBe("unknown_unit");
  });

  it("marks missing fields as missing without substituting zero or warning as if present", () => {
    const metadata = buildFinancialsUnitMetadata({
      snapshot: {
        ...snapshot,
        operatingCashFlow: null,
        sharesOutstanding: null,
      },
    });

    expect(metadata.operatingCashFlow).toMatchObject({
      status: "missing",
      unit: "unknown",
      warnings: [],
    });
    expect(metadata.sharesOutstanding.status).toBe("missing");
    expect(JSON.stringify(metadata)).not.toContain(":0");
  });

  it("honors explicit accepted units and flags invalid explicit units", () => {
    const metadata = buildFinancialsUnitMetadata({
      explicitUnits: {
        equity: "billion_vnd",
        eps: "vnd",
        revenue: "million_vnd",
        sharesOutstanding: "million_shares",
      },
      snapshot,
    });

    expect(metadata.revenue.status).toBe("explicit");
    expect(metadata.revenue.unit).toBe("million_vnd");
    expect(metadata.equity.unit).toBe("billion_vnd");
    expect(metadata.sharesOutstanding.status).toBe("explicit");
    expect(metadata.eps).toMatchObject({
      status: "invalid_unit",
      unit: "vnd",
      warnings: ["eps_financials_unit_vnd_invalid"],
    });
  });

  it("exposes only valuation-relevant field units to the Valuation bridge", () => {
    const metadata = buildFinancialsUnitMetadata({
      explicitUnits: {
        equity: "billion_vnd",
        eps: "vnd_per_share",
        netIncome: "million_vnd",
        revenue: "million_vnd",
        sharesOutstanding: "million_shares",
      },
      snapshot,
    });

    expect(financialsUnitsForValuation(metadata)).toEqual({
      equity: "billion_vnd",
      eps: "vnd_per_share",
      netIncome: "million_vnd",
      revenue: "million_vnd",
      sharesOutstanding: "million_shares",
    });
  });
});
