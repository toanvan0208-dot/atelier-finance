import { describe, expect, it, vi } from "vitest";
import {
  fetchFinancialStatementsByTicker,
  fetchLatestFinancialStatementByTicker,
  FinancialsApiError,
  financialsApiClientInternals,
} from "../financials-api-client";

const statementRecord = {
  id: "statement-1",
  ticker: "FPTLAB",
  companyType: "non_financial",
  periodType: "year",
  period: "FY2025",
  fiscalYear: 2025,
  fiscalQuarter: null,
  currency: "VND",
  unit: "million",
  revenue: "120000",
  grossProfit: "30000",
  netIncome: "9000",
  operatingCashFlow: "8500",
  totalAssets: "250000",
  equity: "120000",
  totalDebt: null,
  currentAssets: null,
  currentLiabilities: null,
  eps: "",
  bvps: "15000",
  sharesOutstanding: "800",
  sourceLabel: "Local sample seed",
  sourceType: "curated_internal",
  dataMode: "sample",
  asOf: "2026-06-18T00:00:00.000Z",
  collectedAt: null,
  qualityStatus: "sample",
  readiness: "needs_review",
  missingFields: JSON.stringify(["eps", "currentAssets"]),
  warningCodes: JSON.stringify(["DEMO_DATA"]),
  errorCodes: "[]",
  source: {
    name: "Local sample seed",
    sourceType: "curated_internal",
    usageStatus: "research_only",
  },
} as const;

const apiSuccess = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ ok: true, status: "success", data }), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("financials API client", () => {
  it("calls the financial statements endpoint for a ticker", async () => {
    const fetcher = vi.fn().mockResolvedValue(apiSuccess([statementRecord]));

    await fetchFinancialStatementsByTicker({ ticker: " fptlab ", limit: 2 }, fetcher);

    expect(fetcher).toHaveBeenCalledWith("/api/companies/FPTLAB/financials?limit=2");
  });

  it("adds latest=true for the latest statement helper", async () => {
    const fetcher = vi.fn().mockResolvedValue(apiSuccess(statementRecord));

    const result = await fetchLatestFinancialStatementByTicker({ ticker: "FPTLAB" }, fetcher);

    expect(fetcher).toHaveBeenCalledWith("/api/companies/FPTLAB/financials?latest=true");
    expect(result?.metadata.fallback).toBe(false);
  });

  it("parses a successful API payload without turning missing values into zero", async () => {
    const fetcher = vi.fn().mockResolvedValue(apiSuccess([statementRecord]));

    const [statement] = await fetchFinancialStatementsByTicker({ ticker: "FPTLAB" }, fetcher);

    expect(statement.snapshot.ticker).toBe("FPTLAB");
    expect(statement.snapshot.periodType).toBe("annual");
    expect(statement.snapshot.revenue).toBe(120000);
    expect(statement.snapshot.eps).toBeNull();
    expect(statement.dataQuality.isDemoData).toBe(true);
    expect(statement.dataQuality.missingFields).toEqual(["eps", "currentAssets"]);
    expect(statement.metadata.dataMode).toBe("sample");
    expect(statement.metadata.readiness).toBe("needs_review");
  });

  it("throws a safe API error and does not provide fallback data", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          status: "error",
          error: {
            code: "FINANCIALS_NOT_FOUND",
            message: "Financial statements were not found.",
          },
        }),
        { status: 404, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(fetchFinancialStatementsByTicker({ ticker: "NONE" }, fetcher)).rejects.toMatchObject({
      name: "FinancialsApiError",
      code: "FINANCIALS_NOT_FOUND",
      httpStatus: 404,
      message: "Financial statements were not found.",
    } satisfies Partial<FinancialsApiError>);
  });

  it("returns an empty collection for an empty API success body", async () => {
    const fetcher = vi.fn().mockResolvedValue(apiSuccess([]));

    await expect(fetchFinancialStatementsByTicker({ ticker: "EMPTY" }, fetcher)).resolves.toEqual([]);
  });

  it("does not create production approval metadata when the API did not send it", async () => {
    const fetcher = vi.fn().mockResolvedValue(apiSuccess([statementRecord]));

    const [statement] = await fetchFinancialStatementsByTicker({ ticker: "FPTLAB" }, fetcher);

    expect(statement.metadata).not.toHaveProperty("productionApproved");
    expect(statement.metadata.dataMode).toBe("sample");
  });

  it("marks user-input metadata with a warning code for the UI bridge", () => {
    const mapped = financialsApiClientInternals.mapFinancialStatementRecord({
      ...statementRecord,
      sourceType: "user_input",
      dataMode: "user_input",
      qualityStatus: "user_input",
      warningCodes: "[]",
      source: {
        name: "Manual upload",
        sourceType: "user_input",
        usageStatus: "research_only",
      },
    });

    expect(mapped.metadata.warningCodes).toContain("USER_INPUT_DATA");
    expect(mapped.dataQuality.isDemoData).toBe(false);
  });
});
