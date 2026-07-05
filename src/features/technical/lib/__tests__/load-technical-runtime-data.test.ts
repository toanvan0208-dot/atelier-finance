import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { pvtObservationData } from "../../data/pvtObservation.data";
import type { LoadTechnicalDeskDataResult } from "../load-technical-desk-data";
import { loadTechnicalRuntimeData } from "../load-technical-runtime-data";
import { buildUnknownMarketPvtUnitMetadata } from "../market-pvt-unit-metadata-capture";

const fallbackResult: LoadTechnicalDeskDataResult = {
  ok: true,
  data: null,
  dataQuality: {
    source: "sample",
    asOf: "2026-06-01",
    isDemoData: true,
    isStale: false,
    missingFields: [],
  },
  source: {
    sourceType: "sample_static_fallback",
    provider: "sample_static",
    sourceLabel: "sample_static_fallback",
    dataMode: "sample",
    productionApproved: false,
  },
  marketDataSource: {
    sourceType: "sample_static_fallback",
    provider: "sample_static",
    sourceLabel: "sample_static_fallback",
    dataMode: "sample",
    productionApproved: false,
    fallbackUsed: true,
    ticker: null,
    asOf: "2026-06-01",
    dateSpan: {
      from: null,
      to: null,
    },
  },
  marketUnitMetadata: buildUnknownMarketPvtUnitMetadata(
    {},
    {
      asOf: "2026-06-01",
      dataMode: "sample",
      source: "sample_fallback",
      sourceLabel: "sample_static_fallback",
    },
  ),
  issuerMetadata: {
    ticker: "FPT",
    displayName: "FPT",
    issuerName: "FPT",
    industry: "sample",
    sector: null,
    sourceLabel: "sample_static_fallback",
    dataMode: "sample",
    productionApproved: false,
    verificationStatus: "static_sample",
    limitations: ["Static sample issuer metadata is not verified production metadata."],
    warnings: [],
  },
  fallbackUsed: true,
  warnings: ["Static fallback"],
  errors: [],
};

const dbResult: LoadTechnicalDeskDataResult = {
  ...fallbackResult,
  source: {
    sourceType: "local_db_manual_import",
    provider: "vnstock",
    sourceLabel: "vnstock",
    dataMode: "research_only",
    productionApproved: false,
  },
  fallbackUsed: false,
  marketDataSource: {
    sourceType: "local_db_manual_import",
    provider: "vnstock",
    sourceLabel: "vnstock",
    dataMode: "research_only",
    productionApproved: false,
    fallbackUsed: false,
    ticker: "FPT",
    asOf: "2025-01-31",
    dateSpan: {
      from: "2025-01-01",
      to: "2025-01-31",
    },
  },
  marketUnitMetadata: buildUnknownMarketPvtUnitMetadata(
    { marketPrice: 100, tradingValue: 100_000, volume: 1000 },
    {
      asOf: "2025-01-31",
      dataMode: "research_only",
      source: "local_research",
      sourceLabel: "vnstock",
    },
  ),
  issuerMetadata: {
    ticker: "FPT",
    displayName: null,
    issuerName: null,
    industry: null,
    sector: null,
    sourceLabel: "unavailable",
    dataMode: "unknown",
    productionApproved: false,
    verificationStatus: "unavailable",
    limitations: ["Company/issuer metadata is unavailable for this DB-backed ticker."],
    warnings: [],
  },
  warnings: ["Local DB manual import"],
};

const dbResultForTicker = (ticker: string): LoadTechnicalDeskDataResult => ({
  ...dbResult,
  data: {
    ...pvtObservationData,
    ticker,
    companyName: ticker,
    industry: "Chua co du lieu xac minh",
  },
  marketDataSource: {
    ...dbResult.marketDataSource,
    ticker,
    sourceLabel: "vnstock_research_candidate",
    asOf: "2025-06-30",
    dateSpan: {
      from: "2025-06-02",
      to: "2025-06-30",
    },
  },
  issuerMetadata: {
    ...dbResult.issuerMetadata,
    ticker,
    displayName: ticker,
  },
  source: {
    ...dbResult.source,
    sourceLabel: "vnstock_research_candidate",
  },
});

const expectedDefaultToDate = () => new Date().toISOString().slice(0, 10);
const expectedDefaultFromDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
};

describe("loadTechnicalRuntimeData", () => {
  it("defaults to the static fallback path with DB preference disabled", async () => {
    const loadDeskData = vi.fn().mockResolvedValue(fallbackResult);

    const result = await loadTechnicalRuntimeData(undefined, {
      env: {},
      loadDeskData,
    });

    expect(loadDeskData).toHaveBeenCalledWith({
      ticker: "HPG",
      from: expectedDefaultFromDate(),
      to: expectedDefaultToDate(),
      sourceLabel: undefined,
      preferDb: false,
      allowFallback: false,
    });
    expect(result.fallbackUsed).toBe(true);
    expect(result.source.sourceType).toBe("sample_static_fallback");
    expect(result.source.productionApproved).toBe(false);
  });

  it("uses the explicit DB path when env enables it", async () => {
    const loadDeskData = vi.fn().mockResolvedValue(dbResult);

    const result = await loadTechnicalRuntimeData(undefined, {
      env: { ATELIER_TECHNICAL_PVT_DB_SOURCE: "enabled" },
      loadDeskData,
    });

    expect(loadDeskData).toHaveBeenCalledWith({
      ticker: "HPG",
      from: expectedDefaultFromDate(),
      to: expectedDefaultToDate(),
      sourceLabel: undefined,
      preferDb: true,
      allowFallback: false,
    });
    expect(result.fallbackUsed).toBe(false);
    expect(result.source).toMatchObject({
      sourceLabel: "vnstock",
      dataMode: "research_only",
      productionApproved: false,
    });
  });

  it("lets an explicit input preference override the env default", async () => {
    const loadDeskData = vi.fn().mockResolvedValue(fallbackResult);

    await loadTechnicalRuntimeData(
      { ticker: "MWG", from: "2025-02-01", to: "2025-02-28", preferDb: false },
      {
        env: { ATELIER_TECHNICAL_PVT_DB_SOURCE: "enabled" },
        loadDeskData,
      },
    );

    expect(loadDeskData).toHaveBeenCalledWith({
      ticker: "MWG",
      from: "2025-02-01",
      to: "2025-02-28",
      sourceLabel: undefined,
      preferDb: false,
      allowFallback: false,
    });
  });

  it("passes the explicit VNStock source label for intended local DB activation", async () => {
    const loadDeskData = vi.fn().mockResolvedValue(dbResult);

    await loadTechnicalRuntimeData(
      {
        ticker: "FPT",
        from: "2025-06-02",
        to: "2025-06-30",
        sourceLabel: "vnstock_research_candidate",
        preferDb: true,
      },
      { loadDeskData },
    );

    expect(loadDeskData).toHaveBeenCalledWith({
      ticker: "FPT",
      from: "2025-06-02",
      to: "2025-06-30",
      sourceLabel: "vnstock_research_candidate",
      preferDb: true,
      allowFallback: false,
    });
  });

  it.each(["FPT", "MWG", "VNM"])(
    "uses the explicit %s query ticker without falling back to another ticker",
    async (ticker) => {
      const loadDeskData = vi.fn().mockImplementation(async (input) => dbResultForTicker(input.ticker));

      const result = await loadTechnicalRuntimeData({ ticker }, { loadDeskData });

      expect(loadDeskData).toHaveBeenCalledWith({
        ticker,
        from: expectedDefaultFromDate(),
        to: expectedDefaultToDate(),
        sourceLabel: undefined,
        preferDb: true,
        allowFallback: false,
      });
      expect(result.data?.ticker).toBe(ticker);
      expect(result.marketDataSource.ticker).toBe(ticker);
      expect(result.issuerMetadata.ticker).toBe(ticker);
      expect(result.fallbackUsed).toBe(false);
    },
  );

  it("falls back safely when the runtime loader throws and fallback is explicitly allowed", async () => {
    const loadDeskData = vi.fn().mockRejectedValue(new Error("DB read failed"));

    const result = await loadTechnicalRuntimeData(
      { ticker: "FPT", from: "2025-01-01", to: "2025-01-31", preferDb: true, allowFallback: true },
      { loadDeskData },
    );

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.source.productionApproved).toBe(false);
    expect(result.warnings.join(" ")).toContain("static fallback");
    expect(result.warnings.join(" ")).toContain("DB read failed");
  });

  it("keeps cross-ticker fallback disabled for explicit ticker runtime errors", async () => {
    const loadDeskData = vi.fn().mockRejectedValue(new Error("DB read failed"));

    const result = await loadTechnicalRuntimeData(
      { ticker: "FPT", from: "2025-01-01", to: "2025-01-31", preferDb: true },
      { loadDeskData },
    );

    expect(result.fallbackUsed).toBe(false);
    expect(result.data).toBeNull();
    expect(result.marketDataSource.ticker).toBe("FPT");
    expect(result.issuerMetadata.ticker).toBe("FPT");
    expect(result.warnings.join(" ")).toContain("cross-ticker fallback remained disabled");
    expect(result.warnings.join(" ")).toContain("DB read failed");
  });

  it("keeps client Technical files away from server-only data imports", () => {
    const root = process.cwd();
    const clientFiles = [
      "src/features/technical/components/TechnicalPage.tsx",
      "src/components/layout/AppShell.tsx",
    ];
    const forbiddenImports = [
      "market-price-read-service",
      "load-technical-desk-data",
      "load-technical-runtime-data",
      "getMarketPriceSeries",
      "prisma",
    ];

    for (const file of clientFiles) {
      const content = readFileSync(join(root, file), "utf8");
      for (const forbiddenImport of forbiddenImports) {
        expect(content).not.toContain(forbiddenImport);
      }
    }
  });

  it("does not expose prohibited investment fields", async () => {
    const loadDeskData = vi.fn().mockResolvedValue(dbResult);
    const result = await loadTechnicalRuntimeData(
      { ticker: "FPT", from: "2025-01-01", to: "2025-01-31", preferDb: true },
      { loadDeskData },
    );
    const output = JSON.stringify(result);

    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("rating");
    expect(output).not.toContain("targetPrice");
    expect(output).not.toContain("buySignal");
    expect(output).not.toContain("sellSignal");
    expect(output).not.toContain("holdSignal");
    expect(output).not.toContain("entryPoint");
    expect(output).not.toContain("exitPoint");
  });
});
