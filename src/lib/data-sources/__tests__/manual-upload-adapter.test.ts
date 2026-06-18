import { describe, expect, it } from "vitest";

import {
  bridgeFinancialsContract,
  bridgeValuationContract,
} from "../../data-contract";
import {
  getSourcePolicy,
  isSourceUsableForProductRuntime,
  normalizeManualUpload,
  parseNullableNumber,
} from "../index";

const baseRow = {
  ticker: "FPT",
  period: "2024Q4",
  netProfit: "200000",
  totalAssets: "5000000",
  totalEquity: "3000000",
  operatingCashFlow: "150000",
  eps: "4000",
  bookValuePerShare: "25000",
  sharesOutstanding: "1000000",
  lastPrice: "95000",
  volume: "1000000",
  tradingValue: "95000000000",
  source: "manual_upload",
  asOf: "2025-01-31",
  currency: "VND",
};

describe("manual upload adapter", () => {
  it("maps manual-upload aliases to canonical records", () => {
    const result = normalizeManualUpload({ kind: "rows", rows: [baseRow] });

    expect(result.errors).toHaveLength(0);
    expect(result.data?.financialStatements[0]?.netIncome).toBe(200000);
    expect(result.data?.financialStatements[0]?.equity).toBe(3000000);
    expect(result.data?.valuationInputs[0]?.bvps).toBe(25000);
    expect(result.data?.marketData[0]?.closePrice).toBe(95000);
    expect(result.rowResults[0].readiness).toBe("insufficient_data");
  });

  it("does not parse missing tokens as zero", () => {
    for (const value of ["", "-", "N/A", null, undefined]) {
      const parsed = parseNullableNumber(value, "field");

      expect(parsed.value).toBeNull();
      expect(parsed.value).not.toBe(0);
    }
  });

  it("keeps missing operating cash flow and close price as null", () => {
    const result = normalizeManualUpload({
      kind: "rows",
      rows: [{ ...baseRow, operatingCashFlow: "N/A", lastPrice: "-" }],
    });

    expect(result.data?.financialStatements[0]?.operatingCashFlow).toBeNull();
    expect(result.data?.marketData[0]?.closePrice).toBeNull();
    expect(result.summary.missingFieldCounts.closePrice).toBe(1);
  });

  it("returns errors for invalid numbers without silently parsing", () => {
    const result = normalizeManualUpload({
      kind: "rows",
      rows: [{ ...baseRow, netProfit: "abc" }],
    });

    expect(result.data).toBeNull();
    expect(result.readiness).toBe("not_ready");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_NUMBER", field: "netIncome" }),
      ]),
    );
  });

  it("rejects invalid asOf and does not use the current date", () => {
    const result = normalizeManualUpload({
      kind: "rows",
      rows: [{ ...baseRow, asOf: "not-a-date" }],
    });

    expect(result.data).toBeNull();
    expect(result.readiness).toBe("not_ready");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_AS_OF" }),
      ]),
    );
  });

  it("keeps readiness not ready when asOf is missing", () => {
    const result = normalizeManualUpload({
      kind: "rows",
      rows: [{ ...baseRow, asOf: "" }],
    });

    expect(result.data).toBeNull();
    expect(result.readiness).toBe("not_ready");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "AS_OF_MISSING" }),
      ]),
    );
  });

  it("keeps row readiness not ready when period is missing for financial data", () => {
    const result = normalizeManualUpload({
      kind: "rows",
      rows: [{ ...baseRow, period: "" }],
    });

    expect(result.rowResults[0].readiness).toBe("not_ready");
    expect(result.readiness).toBe("not_ready");
    expect(result.rowResults[0].warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "PERIOD_MISSING" }),
      ]),
    );
  });

  it("does not auto-convert non-VND currency without exchange rate source", () => {
    const result = normalizeManualUpload({
      kind: "rows",
      rows: [{ ...baseRow, currency: "USD" }],
    });

    expect(result.readiness).toBe("needs_review");
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CURRENCY_NEEDS_REVIEW" }),
      ]),
    );
  });

  it("returns insufficient data for asset-denominator ratios when total assets are zero", () => {
    const result = normalizeManualUpload({
      kind: "rows",
      rows: [{ ...baseRow, totalAssets: "0" }],
    });
    const statement = result.data?.financialStatements[0];
    const market = result.data?.marketData[0];
    expect(statement).toBeDefined();
    expect(market).toBeDefined();

    const bridge = bridgeFinancialsContract({ statement: statement!, market: market! });
    expect(bridge.contractMetrics.roa.value).toBeNull();
    expect(bridge.contractMetrics.roa.status).toBe("insufficient_data");
    expect(bridge.contractMetrics.cfoToAssets.value).toBeNull();
    expect(bridge.contractMetrics.cfoToAssets.status).toBe("insufficient_data");
  });

  it("marks P/E not applicable when EPS is zero or negative", () => {
    for (const eps of ["0", "-1"]) {
      const result = normalizeManualUpload({
        kind: "rows",
        rows: [{ ...baseRow, eps }],
      });
      const valuationBridge = bridgeValuationContract({
        statement: result.data!.financialStatements[0],
        market: result.data!.marketData[0],
        valuation: result.data!.valuationInputs[0],
      });

      expect(valuationBridge.contractMetrics.peInterpretation.interpretation).toBe("not_applicable");
      expect(valuationBridge.moduleMetrics.peRatio.value).toBeNull();
    }
  });

  it("marks equity-based metrics not applicable when equity is zero or negative", () => {
    for (const totalEquity of ["0", "-1"]) {
      const result = normalizeManualUpload({
        kind: "rows",
        rows: [{ ...baseRow, totalEquity }],
      });
      const valuationBridge = bridgeValuationContract({
        statement: result.data!.financialStatements[0],
        market: result.data!.marketData[0],
        valuation: result.data!.valuationInputs[0],
      });

      expect(valuationBridge.contractMetrics.equityInterpretation.interpretation).toBe("not_applicable");
      expect(valuationBridge.moduleMetrics.pbRatio.value).toBeNull();
      expect(valuationBridge.moduleMetrics.bvps.value).toBeNull();
      expect(valuationBridge.moduleMetrics.roe.value).toBeNull();
    }
  });

  it("records unmapped fields in warnings and summary", () => {
    const result = normalizeManualUpload({
      kind: "rows",
      rows: [{ ...baseRow, strangeField: "value" }],
    });

    expect(result.rowResults[0].unmappedFields).toEqual(["strangeField"]);
    expect(result.summary.unmappedFieldCounts.strangeField).toBe(1);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "UNMAPPED_FIELDS" }),
      ]),
    );
  });

  it("does not treat manual upload as production-approved source", () => {
    const policy = getSourcePolicy("manual-academic-source");

    expect(policy.usageStatus).toBe("research_only");
    expect(isSourceUsableForProductRuntime(policy)).toBe(false);
  });

  it("does not fallback to mock data when upload input is invalid", () => {
    const result = normalizeManualUpload({
      kind: "rows",
      rows: [{ ...baseRow, asOf: "bad-date", netProfit: "bad-number" }],
    });

    expect(result.data).toBeNull();
    expect(result.metadata).toBeNull();
    expect(result.summary.errorRows).toBe(1);
  });

  it("parses simple CSV text and rejects quoted CSV explicitly", () => {
    const csv = [
      "ticker,period,netProfit,totalAssets,totalEquity,eps,bookValuePerShare,sharesOutstanding,lastPrice,volume,source,asOf",
      "FPT,2024Q4,200000,5000000,3000000,4000,25000,1000000,95000,1000000,manual_upload,2025-01-31",
    ].join("\n");
    const parsed = normalizeManualUpload({ kind: "csv", csvText: csv });
    const quoted = normalizeManualUpload({ kind: "csv", csvText: "ticker,period\n\"FPT\",2024Q4" });

    expect(parsed.data?.financialStatements[0]?.ticker).toBe("FPT");
    expect(quoted.data).toBeNull();
    expect(quoted.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CSV_PARSE_UNSUPPORTED" }),
      ]),
    );
  });
});
