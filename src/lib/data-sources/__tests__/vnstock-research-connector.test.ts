import { describe, expect, it, vi } from "vitest";

import {
  createVnstockResearchConnector,
  fetchVnstockResearchMarketPrices,
  getVnstockResearchConnectorStatus,
  isVnstockResearchConnectorProductionApproved,
  VNSTOCK_RESEARCH_SOURCE_POLICY,
} from "../index";

describe("vnstock research connector skeleton", () => {
  it("fails closed by default", () => {
    const result = createVnstockResearchConnector();

    expect(result.ok).toBe(false);
    expect(result.status).toBe("disabled");
    expect(result.data).toBeNull();
    expect(result.metadata.provider).toBe("vnstock");
    expect(result.metadata.productionApproved).toBe(false);
  });

  it("does not fetch when enabled but network is disabled", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = getVnstockResearchConnectorStatus({
      enabled: true,
      allowNetwork: false,
      mode: "local_research",
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    expect(result.status).toBe("network_not_allowed");
    expect(result.data).toBeNull();
    expect(result.warnings.join(" ")).toContain("not production-approved");
    expect(result.warnings.join(" ")).toContain("network access is disabled");

    fetchSpy.mockRestore();
  });

  it("keeps market price fetch closed when network is disabled", async () => {
    const fetchMarketPrices = vi.fn();

    const result = await fetchVnstockResearchMarketPrices(
      { ticker: "FPT" },
      {
        enabled: true,
        allowNetwork: false,
        mode: "local_research",
        fetchMarketPrices,
      },
    );

    expect(fetchMarketPrices).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    expect(result.status).toBe("network_not_allowed");
    expect(result.data).toBeNull();
    expect(result.metadata.productionApproved).toBe(false);
  });

  it("fails closed when fetcher is missing", async () => {
    const result = await fetchVnstockResearchMarketPrices(
      { ticker: "FPT" },
      {
        enabled: true,
        allowNetwork: true,
        mode: "local_research",
      },
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe("fetcher_not_configured");
    expect(result.data).toBeNull();
  });

  it("normalizes controlled local market price records from an injected fetcher", async () => {
    const fetchMarketPrices = vi.fn().mockResolvedValue([
      {
        ticker: "fpt",
        date: "2026-06-19",
        open: "100",
        high: "110",
        low: "95",
        close: "105",
        volume: "1000",
        tradingValue: "105000",
      },
    ]);

    const result = await fetchVnstockResearchMarketPrices(
      { ticker: "FPT", startDate: "2026-06-19", endDate: "2026-06-19" },
      {
        enabled: true,
        allowNetwork: true,
        mode: "local_research",
        fetchMarketPrices,
        now: new Date("2026-06-19T00:00:00.000Z"),
      },
    );

    expect(fetchMarketPrices).toHaveBeenCalledTimes(1);
    expect(fetchMarketPrices).toHaveBeenCalledWith({
      ticker: "FPT",
      startDate: "2026-06-19",
      endDate: "2026-06-19",
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe("fetched");
    expect(result.metadata.productionApproved).toBe(false);
    expect(result.metadata.sourceType).toBe("third_party_tool");
    expect(result.metadata.usageScope).toBe("academic_non_commercial");
    expect(result.data).toEqual([
      expect.objectContaining({
        ticker: "FPT",
        date: "2026-06-19",
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1000,
        tradingValue: 105000,
        sourceProvider: "vnstock",
        sourceType: "third_party_tool",
        usageScope: "academic_non_commercial",
        productionApproved: false,
        asOf: "2026-06-19",
        retrievedAt: "2026-06-19T00:00:00.000Z",
      }),
    ]);
  });

  it("keeps missing numeric market fields null", async () => {
    const result = await fetchVnstockResearchMarketPrices(
      { ticker: "FPT" },
      {
        enabled: true,
        allowNetwork: true,
        mode: "local_research",
        fetchMarketPrices: vi.fn().mockResolvedValue([{ ticker: "FPT", date: "2026-06-19" }]),
      },
    );

    expect(result.ok).toBe(true);
    expect(result.data?.[0]).toMatchObject({
      open: null,
      high: null,
      low: null,
      close: null,
      volume: null,
      tradingValue: null,
    });
    expect(result.data?.[0].close).not.toBe(0);
  });

  it("sets invalid numbers to null with a warning", async () => {
    const result = await fetchVnstockResearchMarketPrices(
      { ticker: "FPT" },
      {
        enabled: true,
        allowNetwork: true,
        mode: "local_research",
        fetchMarketPrices: vi.fn().mockResolvedValue([
          { ticker: "FPT", date: "2026-06-19", close: "abc" },
        ]),
      },
    );

    expect(result.ok).toBe(true);
    expect(result.data?.[0].close).toBeNull();
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("close could not be parsed as a number"),
      ]),
    );
  });

  it("rejects invalid ticker or date without throwing", async () => {
    const result = await fetchVnstockResearchMarketPrices(
      { ticker: "" },
      {
        enabled: true,
        allowNetwork: true,
        mode: "local_research",
        fetchMarketPrices: vi.fn().mockResolvedValue([
          { ticker: "", date: "2026-06-19", close: "100" },
          { ticker: "FPT", date: "not-a-date", close: "100" },
        ]),
      },
    );

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.warnings.join(" ")).toContain("ticker is missing");
    expect(result.warnings.join(" ")).toContain("date is invalid");
  });

  it("preserves academic research metadata classification", () => {
    expect(VNSTOCK_RESEARCH_SOURCE_POLICY).toMatchObject({
      sourceCandidateId: "vnstock-academic-research-connector",
      provider: "vnstock",
      sourceType: "third_party_tool",
      usageScope: "academic_non_commercial",
      reviewStatus: "research_connector_candidate",
      legalStatus: "needs_review",
      productionApproved: false,
      attributionRequired: true,
      implementationStatus: "skeleton_only",
      runtimeUse: "not_configured",
    });
  });

  it("never reports production approval", () => {
    expect(isVnstockResearchConnectorProductionApproved()).toBe(false);
  });

  it("does not contain unsafe approval metadata", () => {
    const serialized = JSON.stringify(VNSTOCK_RESEARCH_SOURCE_POLICY);

    expect(serialized).not.toContain('"productionApproved":true');
  });

  it("does not include investment action wording in connector warnings", () => {
    const result = createVnstockResearchConnector();
    const warningText = result.warnings.join(" ").toLowerCase();
    const unsafeTerms = [
      `nên ${"mua"}`,
      `nên ${"bán"}`,
      `tín hiệu ${"mua"}`,
      `tín hiệu ${"bán"}`,
      `điểm ${"mua"}`,
      `cổ phiếu ${"an toàn"}`,
    ];

    for (const term of unsafeTerms) {
      expect(warningText).not.toContain(term);
    }
  });
});
