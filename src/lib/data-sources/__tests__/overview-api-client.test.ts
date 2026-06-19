import { describe, expect, it, vi } from "vitest";
import {
  fetchOverviewInputsByTicker,
  OverviewApiError,
  overviewApiClientInternals,
} from "../overview-api-client";

const companyRecord = {
  ticker: "FPTLAB",
  exchange: "LOCAL",
  companyName: "FPTLAB local sample company",
  companyType: "non_financial",
  industryName: "Local sample",
  dataMode: "sample",
  profileAsOf: "2026-02-16T00:00:00.000Z",
  profileSource: {
    name: "Atelier Finance sample dataset",
    sourceType: "curated_internal",
    usageStatus: "research_only",
  },
} as const;

const financialRecord = {
  ticker: "FPTLAB",
  companyType: "non_financial",
  periodType: "quarter",
  period: "2025Q4",
  revenue: "62000000000000",
  grossProfit: "24500000000000",
  netIncome: "9300000000000",
  operatingCashFlow: "8500000000000",
  totalAssets: "72000000000000",
  equity: "31000000000000",
  totalDebt: "12000000000000",
  currentAssets: "28000000000000",
  currentLiabilities: "16000000000000",
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
  closePrice: "96000",
  previousClose: "95000",
  adjustedClosePrice: null,
  volume: "1200000",
  tradingValue: "115200000000",
  sourceLabel: "Atelier Finance sample dataset",
  sourceType: "curated_internal",
  dataMode: "demo",
  asOf: "2026-02-16T00:00:00.000Z",
  collectedAt: "2026-02-16T12:00:00.000Z",
  qualityStatus: "demo",
  readiness: "needs_review",
  missingFields: JSON.stringify(["adjustedClosePrice", "marketCap"]),
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

describe("overview API client", () => {
  it("calls company, latest financials and latest market-prices endpoints", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(successResponse(companyRecord))
      .mockResolvedValueOnce(successResponse(financialRecord))
      .mockResolvedValueOnce(successResponse(marketRecord));

    await fetchOverviewInputsByTicker({ ticker: " fptlab " }, fetcher);

    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/companies/FPTLAB");
    expect(fetcher).toHaveBeenNthCalledWith(2, "/api/companies/FPTLAB/financials?latest=true");
    expect(fetcher).toHaveBeenNthCalledWith(3, "/api/companies/FPTLAB/market-prices?latest=true");
  });

  it("parses API success into overview inputs without production approval metadata", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(successResponse(companyRecord))
      .mockResolvedValueOnce(successResponse(financialRecord))
      .mockResolvedValueOnce(successResponse(marketRecord));

    const result = await fetchOverviewInputsByTicker({ ticker: "FPTLAB" }, fetcher);

    expect(result.status).toBe("ready");
    expect(result.companyName).toBe("FPTLAB local sample company");
    expect(result.snapshot.ticker).toBe("FPTLAB");
    expect(result.snapshot.netProfit).toBe(9300000000000);
    expect(result.snapshot.closePrice).toBe(96000);
    expect(result.metadata.dataMode).toBe("sample + sample + demo");
    expect(result.metadata.fallback).toBe(false);
    expect(result.metadata).not.toHaveProperty("productionApproved");
    expect(result.dataQuality.isDemoData).toBe(true);
  });

  it("throws a safe error for unhandled API failures", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(successResponse(companyRecord))
      .mockResolvedValueOnce(errorResponse("INTERNAL_ERROR", "Unable to complete the request."))
      .mockResolvedValueOnce(successResponse(marketRecord));

    await expect(fetchOverviewInputsByTicker({ ticker: "FPTLAB" }, fetcher)).rejects.toMatchObject({
      name: "OverviewApiError",
      code: "INTERNAL_ERROR",
      httpStatus: 500,
      message: "Unable to complete the request.",
    } satisfies Partial<OverviewApiError>);
  });

  it("returns insufficient data instead of silently falling back when market price is missing", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(successResponse(companyRecord))
      .mockResolvedValueOnce(successResponse(financialRecord))
      .mockResolvedValueOnce(errorResponse("MARKET_PRICES_NOT_FOUND", "Market prices were not found.", 404));

    const result = await fetchOverviewInputsByTicker({ ticker: "FPTLAB" }, fetcher);

    expect(result.status).toBe("insufficient_data");
    expect(result.missingReasons).toContain("market_price");
    expect(result.missingReasons).toContain("market_price_close");
    expect(result.snapshot.closePrice).toBeNull();
    expect(result.metadata.fallback).toBe(false);
  });

  it("surfaces empty company data as insufficient without fallback data", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(errorResponse("COMPANY_NOT_FOUND", "Company was not found.", 404))
      .mockResolvedValueOnce(errorResponse("FINANCIALS_NOT_FOUND", "Financial statements were not found.", 404))
      .mockResolvedValueOnce(errorResponse("MARKET_PRICES_NOT_FOUND", "Market prices were not found.", 404));

    const result = await fetchOverviewInputsByTicker({ ticker: "NOPELAB" }, fetcher);

    expect(result.status).toBe("insufficient_data");
    expect(result.missingReasons).toContain("company");
    expect(result.missingReasons).toContain("financial_statement");
    expect(result.missingReasons).toContain("market_price");
    expect(result.companyName).toBe("NOPELAB");
    expect(result.metadata.fallback).toBe(false);
  });

  it("keeps EPS missing out of ordinary P/E interpretation inputs", () => {
    const snapshot = overviewApiClientInternals.buildSnapshot("FPTLAB", companyRecord, {
      ...financialRecord,
      eps: null,
    }, marketRecord);
    const reasons = overviewApiClientInternals.buildMissingReasons(
      { ok: true, data: companyRecord },
      { ok: true, data: { ...financialRecord, eps: null } },
      { ok: true, data: marketRecord },
      snapshot,
    );

    expect(snapshot.eps).toBeNull();
    expect(snapshot.sharesOutstanding).toBeNull();
    expect(reasons).toContain("eps");
  });

  it("adds source warnings for user-provided metadata", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(successResponse(companyRecord))
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

    const result = await fetchOverviewInputsByTicker({ ticker: "FPTLAB" }, fetcher);

    expect(result.metadata.warningCodes).toContain("USER_INPUT_FINANCIALS");
    expect(result.metadata.dataMode).toBe("sample + user_input + demo");
  });
});
