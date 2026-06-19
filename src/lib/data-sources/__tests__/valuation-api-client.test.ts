import { describe, expect, it, vi } from "vitest";
import { buildValuationDeskData } from "@/features/valuation/lib/build-valuation-desk-data";
import { baseValuationRefactoredData } from "@/features/valuation/data/valuationRefactored.data";
import {
  fetchValuationInputsByTicker,
  ValuationApiError,
  valuationApiClientInternals,
} from "../valuation-api-client";

const financialRecord = {
  ticker: "FPTLAB",
  companyType: "non_financial",
  periodType: "quarter",
  period: "2025Q4",
  revenue: "62000000000000",
  netIncome: "9300000000000",
  equity: "31000000000000",
  totalDebt: "12000000000000",
  operatingCashFlow: "8500000000000",
  eps: "5200",
  bvps: "21000",
  sharesOutstanding: "1000000000",
  sourceLabel: "Atelier Finance sample dataset",
  sourceType: "curated_internal",
  dataMode: "sample",
  asOf: "2026-02-15T00:00:00.000Z",
  collectedAt: "2026-02-16T00:00:00.000Z",
  qualityStatus: "sample",
  readiness: "needs_review",
  missingFields: "[]",
  warningCodes: JSON.stringify(["DEMO_DATA"]),
  errorCodes: "[]",
  source: {
    name: "Atelier Finance sample dataset",
    sourceType: "curated_internal",
    usageStatus: "research_only",
  },
} as const;

const marketRecord = {
  ticker: "FPTLAB",
  periodType: "day",
  period: "2026-02-16",
  tradingDate: "2026-02-16T00:00:00.000Z",
  closePrice: "65000",
  adjustedClosePrice: null,
  sourceLabel: "Atelier Finance sample dataset",
  sourceType: "curated_internal",
  dataMode: "sample",
  asOf: "2026-02-16T00:00:00.000Z",
  collectedAt: "2026-02-16T00:00:00.000Z",
  qualityStatus: "sample",
  readiness: "needs_review",
  missingFields: "[]",
  warningCodes: JSON.stringify(["DEMO_DATA"]),
  errorCodes: "[]",
  source: {
    name: "Atelier Finance sample dataset",
    sourceType: "curated_internal",
    usageStatus: "research_only",
  },
} as const;

const successResponse = (data: unknown) =>
  new Response(JSON.stringify({ ok: true, status: "success", data }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

const errorResponse = (code: string, message: string, status = 500) =>
  new Response(JSON.stringify({ ok: false, status: "error", error: { code, message } }), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("valuation API client", () => {
  it("calls the latest financials and market-prices endpoints", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(successResponse(financialRecord))
      .mockResolvedValueOnce(successResponse(marketRecord));

    await fetchValuationInputsByTicker({ ticker: " fptlab " }, fetcher);

    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/companies/FPTLAB/financials?latest=true");
    expect(fetcher).toHaveBeenNthCalledWith(2, "/api/companies/FPTLAB/market-prices?latest=true");
  });

  it("parses API success into valuation inputs without production approval metadata", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(successResponse(financialRecord))
      .mockResolvedValueOnce(successResponse(marketRecord));

    const result = await fetchValuationInputsByTicker({ ticker: "FPTLAB" }, fetcher);

    expect(result.status).toBe("ready");
    expect(result.snapshot.ticker).toBe("FPTLAB");
    expect(result.snapshot.eps).toBe(5200);
    expect(result.snapshot.closePrice).toBe(65000);
    expect(result.metadata.dataMode).toBe("sample");
    expect(result.metadata.fallback).toBe(false);
    expect(result.metadata).not.toHaveProperty("productionApproved");
    expect(result.dataQuality.isDemoData).toBe(true);
  });

  it("throws a safe error for unhandled API failures", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(errorResponse("INTERNAL_ERROR", "Unable to complete the request."))
      .mockResolvedValueOnce(successResponse(marketRecord));

    await expect(fetchValuationInputsByTicker({ ticker: "FPTLAB" }, fetcher)).rejects.toMatchObject({
      name: "ValuationApiError",
      code: "INTERNAL_ERROR",
      httpStatus: 500,
      message: "Unable to complete the request.",
    } satisfies Partial<ValuationApiError>);
  });

  it("returns insufficient data instead of silently falling back when market price is missing", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(successResponse(financialRecord))
      .mockResolvedValueOnce(errorResponse("MARKET_PRICES_NOT_FOUND", "Market prices were not found.", 404));

    const result = await fetchValuationInputsByTicker({ ticker: "FPTLAB" }, fetcher);

    expect(result.status).toBe("insufficient_data");
    expect(result.missingReasons).toContain("market_price");
    expect(result.missingReasons).toContain("market_price_close");
    expect(result.snapshot.closePrice).toBeNull();
    expect(result.metadata.fallback).toBe(false);
  });

  it("keeps EPS null as insufficient data for P/E", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(successResponse({ ...financialRecord, eps: null }))
      .mockResolvedValueOnce(successResponse(marketRecord));

    const result = await fetchValuationInputsByTicker({ ticker: "FPTLAB" }, fetcher);
    const data = buildValuationDeskData(baseValuationRefactoredData, result.snapshot);
    const peRow = data.ranges.rows.find((row) => row.method === "P/E");

    expect(result.status).toBe("insufficient_data");
    expect(result.missingReasons).toContain("eps");
    expect(peRow?.range).toBe("Chưa đủ dữ liệu");
  });

  it("keeps EPS <= 0 not applicable for P/E", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(successResponse({ ...financialRecord, eps: "-1" }))
      .mockResolvedValueOnce(successResponse(marketRecord));

    const result = await fetchValuationInputsByTicker({ ticker: "FPTLAB" }, fetcher);
    const data = buildValuationDeskData(baseValuationRefactoredData, result.snapshot);
    const peRow = data.ranges.rows.find((row) => row.method === "P/E");

    expect(peRow?.range).toBe("Không phù hợp để diễn giải");
    expect(peRow?.range).not.toBe("0x");
  });

  it("maps missing close price to insufficient valuation metrics", () => {
    const snapshot = valuationApiClientInternals.buildSnapshot("FPTLAB", financialRecord, {
      ...marketRecord,
      closePrice: null,
      adjustedClosePrice: null,
    });
    const reasons = valuationApiClientInternals.buildMissingReasons(
      { ok: true, data: financialRecord },
      { ok: true, data: { ...marketRecord, closePrice: null, adjustedClosePrice: null } },
      snapshot,
    );

    expect(snapshot.closePrice).toBeNull();
    expect(reasons).toContain("market_price_close");
  });

  it("adds source warnings for user-provided metadata", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        successResponse({
          ...financialRecord,
          sourceType: "user_input",
          dataMode: "user_input",
          qualityStatus: "user_input",
          source: { name: "Manual upload", sourceType: "user_input", usageStatus: "research_only" },
        }),
      )
      .mockResolvedValueOnce(successResponse(marketRecord));

    const result = await fetchValuationInputsByTicker({ ticker: "FPTLAB" }, fetcher);

    expect(result.metadata.warningCodes).toContain("USER_INPUT_FINANCIALS");
    expect(result.metadata.dataMode).toBe("user_input + sample");
  });
});
