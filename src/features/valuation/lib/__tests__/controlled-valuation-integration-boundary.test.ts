import { describe, expect, it } from "vitest";

import { buildMarketPvtUnitMetadata } from "@/features/technical/lib/market-pvt-unit-metadata-contract";
import { buildControlledValuationIntegrationBoundary } from "../controlled-valuation-integration-boundary";

describe("controlled valuation integration boundary", () => {
  it("uses Financials runtime revenue and equity when available", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        revenue: 1000,
        equity: 1200,
        dataMode: "research_only",
        readPath: "local_db",
        units: { equity: "vnd", revenue: "vnd" },
      },
    });

    expect(result.selectedInputs.revenue).toMatchObject({
      normalizationStatus: "ready",
      source: "financials_runtime",
      unit: "vnd",
      value: 1000,
    });
    expect(result.selectedInputs.equity).toMatchObject({
      normalizationStatus: "ready",
      source: "financials_runtime",
      unit: "vnd",
      value: 1200,
    });
    expect(result.sourceBoundary.productionApproved).toBe(false);
    expect(result.sourceBoundary.canClaimValuationDbBacked).toBe(false);
  });

  it("uses persisted market price ownership with runtime financials as mixed source", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        revenue: 1000,
        eps: 5,
        dataMode: "research_only",
        units: { eps: "vnd_per_share", revenue: "vnd" },
      },
      persistedValuationInputs: {
        dataMode: "research_only",
        marketPrice: 100,
        units: { marketPrice: "vnd_per_share" },
      },
    });

    expect(result.selectedInputs.marketPrice).toMatchObject({
      normalizationStatus: "ready",
      source: "persisted_bridge",
      unit: "vnd_per_share",
      value: 100,
    });
    expect(result.sourceBoundary.valuationSourceMode).toBe("mixed_source");
    expect(result.sourceBoundary.warnings).toContain("valuation_remains_mixed_source");
  });

  it("computes P/E when runtime EPS and persisted market price are valid", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { eps: 5, units: { eps: "vnd_per_share" } },
      persistedValuationInputs: { marketPrice: 100, units: { marketPrice: "vnd_per_share" } },
    });

    expect(result.calculation.metrics.pe.status).toBe("ready");
    expect(result.calculation.metrics.pe.value).toBe(20);
    expect(result.sourceBoundary.canClaimValuationDbBacked).toBe(false);
  });

  it("keeps P/E insufficient when EPS is missing from both sources", () => {
    const result = buildControlledValuationIntegrationBoundary({
      persistedValuationInputs: { marketPrice: 100, units: { marketPrice: "vnd_per_share" } },
    });

    expect(result.selectedInputs.eps).toMatchObject({
      normalizationStatus: "missing",
      source: "unavailable",
      value: null,
    });
    expect(result.calculation.metrics.pe.status).toBe("insufficient_data");
    expect(result.calculation.metrics.pe.value).toBeNull();
  });

  it("keeps P/E not applicable when runtime EPS is non-positive", () => {
    for (const eps of [0, -1]) {
      const result = buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: { eps, units: { eps: "vnd_per_share" } },
        persistedValuationInputs: { marketPrice: 100, units: { marketPrice: "vnd_per_share" } },
      });

      expect(result.calculation.metrics.pe.status).toBe("not_applicable");
      expect(result.calculation.metrics.pe.value).toBeNull();
    }
  });

  it("computes BVPS and P/B from runtime equity and shares plus persisted market price", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { equity: 1000, sharesOutstanding: 100, units: { equity: "vnd", sharesOutstanding: "shares" } },
      persistedValuationInputs: { marketPrice: 20, units: { marketPrice: "vnd_per_share" } },
    });

    expect(result.calculation.metrics.bvps.status).toBe("ready");
    expect(result.calculation.metrics.bvps.value).toBe(10);
    expect(result.calculation.metrics.pb.status).toBe("ready");
    expect(result.calculation.metrics.pb.value).toBe(2);
  });

  it("keeps BVPS and P/B not applicable when equity is non-positive", () => {
    for (const equity of [0, -1]) {
      const result = buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: { equity, sharesOutstanding: 100, units: { equity: "vnd", sharesOutstanding: "shares" } },
        persistedValuationInputs: { marketPrice: 20, units: { marketPrice: "vnd_per_share" } },
      });

      expect(result.calculation.metrics.bvps.status).toBe("not_applicable");
      expect(result.calculation.metrics.pb.status).toBe("not_applicable");
    }
  });

  it("computes P/S from runtime revenue and direct persisted market cap", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { revenue: 1000, units: { revenue: "vnd" } },
      persistedValuationInputs: { marketCap: 5000, units: { marketCap: "vnd" } },
    });

    expect(result.calculation.metrics.marketCap.status).toBe("ready");
    expect(result.calculation.metrics.ps.status).toBe("ready");
    expect(result.calculation.metrics.ps.value).toBe(5);
  });

  it("computes market cap from persisted market price and runtime shares outstanding", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { sharesOutstanding: 100, units: { sharesOutstanding: "shares" } },
      persistedValuationInputs: { marketPrice: 50, units: { marketPrice: "vnd_per_share" } },
    });

    expect(result.calculation.metrics.marketCap.status).toBe("ready");
    expect(result.calculation.metrics.marketCap.value).toBe(5000);
    expect(result.sourceBoundary.valuationSourceMode).toBe("mixed_source");
  });

  it("keeps market cap and BVPS insufficient when shares outstanding is missing", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { equity: 1000, units: { equity: "vnd" } },
      persistedValuationInputs: { marketPrice: 50, units: { marketPrice: "vnd_per_share" } },
    });

    expect(result.selectedInputs.sharesOutstanding).toMatchObject({
      normalizationStatus: "missing",
      source: "unavailable",
      value: null,
    });
    expect(result.calculation.metrics.marketCap.status).toBe("insufficient_data");
    expect(result.calculation.metrics.marketCap.value).toBeNull();
    expect(result.calculation.metrics.bvps.status).toBe("insufficient_data");
    expect(result.calculation.metrics.bvps.value).toBeNull();
  });

  it("falls back to persisted financial field when runtime field is explicitly missing", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { revenue: null, dataMode: "research_only" },
      persistedValuationInputs: { marketCap: 5000, revenue: 1000, units: { marketCap: "vnd", revenue: "vnd" } },
    });

    expect(result.selectedInputs.revenue).toMatchObject({
      normalizationStatus: "ready",
      source: "persisted_bridge",
      unit: "vnd",
      value: 1000,
    });
    expect(result.sourceBoundary.warnings).toContain("runtime_revenue_missing_used_persisted_bridge");
    expect(result.calculation.metrics.ps.status).toBe("ready");
  });

  it("marks runtime local research data as not approved for production use", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { dataMode: "research_only", readPath: "local_db", revenue: 1000, units: { revenue: "vnd" } },
    });

    expect(result.sourceBoundary.productionApproved).toBe(false);
    expect(result.sourceBoundary.warnings).toContain("local_research_data_not_production_approved");
  });

  it("keeps fallback source unapproved", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { fallbackUsed: true, dataMode: "sample" },
      mode: "fallback",
    });

    expect(result.sourceBoundary.valuationSourceMode).toBe("sample_fallback");
    expect(result.sourceBoundary.productionApproved).toBe(false);
    expect(result.sourceBoundary.warnings).toContain("fallback_data_not_production_approved");
  });

  it("keeps EV, EV/EBITDA, DCF, and fair value range blocked", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        equity: 1000,
        eps: 5,
        revenue: 1000,
        sharesOutstanding: 100,
        units: { equity: "vnd", eps: "vnd_per_share", revenue: "vnd", sharesOutstanding: "shares" },
      },
      persistedValuationInputs: { marketCap: 10_000, marketPrice: 100, units: { marketCap: "vnd", marketPrice: "vnd_per_share" } },
    });

    expect(result.calculation.blockedMetrics.ev.status).toBe("blocked");
    expect(result.calculation.blockedMetrics.evToEbitda.status).toBe("blocked");
    expect(result.calculation.blockedMetrics.dcf.status).toBe("blocked");
    expect(result.calculation.blockedMetrics.fairValueRange.status).toBe("blocked");
  });

  it("records that unit provenance guards are active in this integration boundary", () => {
    const result = buildControlledValuationIntegrationBoundary();

    expect(result.integrationNotes).toContain("calculation_helper_integrated_with_unit_provenance_guard");
    expect(result.integrationNotes).toContain("unknown_units_block_scale_sensitive_calculation");
    expect(result.integrationNotes).toContain("no_ev_dcf_or_fair_value_integration");
  });

  it("does not emit forbidden wording in boundary output", () => {
    const output = JSON.stringify(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: {
          revenue: 1000,
          equity: 1000,
          eps: 5,
          sharesOutstanding: 100,
          dataMode: "research_only",
          readPath: "local_db",
          units: { equity: "vnd", eps: "vnd_per_share", revenue: "vnd", sharesOutstanding: "shares" },
        },
        persistedValuationInputs: { marketCap: 10_000, marketPrice: 100, units: { marketCap: "vnd", marketPrice: "vnd_per_share" } },
      }),
    ).toLowerCase();
    const blockedPhrases = [
      "nen mua",
      "tin hieu mua",
      "dinh gia hap dan",
      "dang re",
      "dang mua",
      "re ",
      "dat ",
      "hap dan",
      "gia muc tieu",
      "muc tieu gia",
      "upside",
      "downside",
      "official",
      "realtime",
      "production-ready",
      "production-approved",
    ];

    for (const phrase of blockedPhrases) {
      expect(output).not.toContain(phrase);
    }
  });

  it("blocks calculation when a present input has unknown unit", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { equity: 1000, sharesOutstanding: 100, units: { sharesOutstanding: "shares" } },
      persistedValuationInputs: { marketPrice: 20, units: { marketPrice: "vnd_per_share" } },
    });

    expect(result.selectedInputs.equity).toMatchObject({
      normalizationStatus: "unknown_unit",
      rawValue: 1000,
      unit: "unknown",
      value: null,
    });
    expect(result.sourceBoundary.warnings).toContain("equity_unknown_unit_blocks_calculation");
    expect(result.calculation.metrics.bvps.status).toBe("insufficient_data");
    expect(result.calculation.metrics.pb.status).toBe("insufficient_data");
  });

  it("normalizes explicit scaled units before calculation", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        equity: 2,
        revenue: 100,
        sharesOutstanding: 10,
        units: { equity: "billion_vnd", revenue: "billion_vnd", sharesOutstanding: "million_shares" },
      },
      persistedValuationInputs: { marketPrice: 50_000, units: { marketPrice: "vnd_per_share" } },
    });

    expect(result.selectedInputs.equity).toMatchObject({
      normalizationStatus: "ready",
      normalizedUnit: "vnd",
      value: 2_000_000_000,
    });
    expect(result.selectedInputs.sharesOutstanding).toMatchObject({
      normalizationStatus: "ready",
      normalizedUnit: "shares",
      value: 10_000_000,
    });
    expect(result.calculation.metrics.bvps.value).toBe(200);
    expect(result.calculation.metrics.marketCap.value).toBe(500_000_000_000);
    expect(result.calculation.metrics.ps.value).toBe(5);
  });

  it("uses Market/PVT metadata for market price handoff into P/E", () => {
    const marketUnitMetadata = buildMarketPvtUnitMetadata({
      dataMode: "research_only",
      sourceLabel: "market_pvt_unit_test",
      units: { marketPrice: "vnd_per_share" },
      values: { marketPrice: 50_000 },
    });
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { eps: 2500, units: { eps: "vnd_per_share" } },
      persistedValuationInputs: {
        dataMode: "research_only",
        marketPrice: 50_000,
        marketUnitMetadata,
      },
    });

    expect(result.selectedInputs.marketPrice).toMatchObject({
      normalizationStatus: "ready",
      provenance: { source: "market_pvt", sourceLabel: "market_pvt_unit_test" },
      source: "market_pvt",
      unit: "vnd_per_share",
    });
    expect(result.calculation.metrics.pe.status).toBe("ready");
    expect(result.calculation.metrics.pe.value).toBe(20);
    expect(result.sourceBoundary.productionApproved).toBe(false);
    expect(result.sourceBoundary.canClaimValuationDbBacked).toBe(false);
  });

  it("blocks P/E when market price has unknown Market/PVT unit", () => {
    const marketUnitMetadata = buildMarketPvtUnitMetadata({
      values: { marketPrice: 50_000 },
    });
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { eps: 2500, units: { eps: "vnd_per_share" } },
      persistedValuationInputs: {
        marketPrice: 50_000,
        marketUnitMetadata,
      },
    });

    expect(result.selectedInputs.marketPrice).toMatchObject({
      normalizationStatus: "unknown_unit",
      source: "market_pvt",
      unit: "unknown",
      value: null,
    });
    expect(result.sourceBoundary.warnings).toContain("marketPrice_market_pvt_unit_metadata_missing");
    expect(result.calculation.metrics.pe.status).toBe("insufficient_data");
  });

  it("blocks market inputs with invalid Market/PVT units", () => {
    const marketUnitMetadata = buildMarketPvtUnitMetadata({
      units: { marketCap: "vnd_per_share", marketPrice: "million_vnd" },
      values: { marketCap: 5000, marketPrice: 50_000 },
    });
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        eps: 2500,
        revenue: 100,
        sharesOutstanding: 10,
        units: { eps: "vnd_per_share", revenue: "billion_vnd", sharesOutstanding: "million_shares" },
      },
      persistedValuationInputs: {
        marketCap: 5000,
        marketPrice: 50_000,
        marketUnitMetadata,
      },
    });

    expect(result.selectedInputs.marketPrice.source).toBe("market_pvt");
    expect(result.selectedInputs.marketPrice.normalizationStatus).toBe("not_normalized");
    expect(result.selectedInputs.marketCap.normalizationStatus).toBe("not_normalized");
    expect(result.sourceBoundary.warnings).toEqual(
      expect.arrayContaining([
        "marketPrice_market_pvt_unit_million_vnd_invalid_unit",
        "marketCap_market_pvt_unit_vnd_per_share_invalid_unit",
      ]),
    );
    expect(result.calculation.metrics.pe.status).toBe("insufficient_data");
    expect(result.calculation.metrics.ps.status).toBe("insufficient_data");
  });

  it("does not bypass invalid Market/PVT value metadata with persisted market numbers", () => {
    const marketUnitMetadata = buildMarketPvtUnitMetadata({
      units: { marketPrice: "vnd_per_share" },
      values: { marketPrice: -50_000 },
    });
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { eps: 2500, units: { eps: "vnd_per_share" } },
      persistedValuationInputs: {
        marketPrice: 50_000,
        marketUnitMetadata,
      },
    });

    expect(result.selectedInputs.marketPrice).toMatchObject({
      normalizationStatus: "invalid",
      rawValue: null,
      source: "market_pvt",
      value: null,
    });
    expect(result.sourceBoundary.warnings).toContain("marketPrice_market_pvt_value_invalid");
    expect(result.calculation.metrics.pe.status).toBe("insufficient_data");
  });

  it("uses direct explicit Market/PVT market cap before deriving from price and shares", () => {
    const marketUnitMetadata = buildMarketPvtUnitMetadata({
      units: { marketCap: "billion_vnd", marketPrice: "vnd_per_share" },
      values: { marketCap: 2, marketPrice: 50_000 },
    });
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        revenue: 100,
        sharesOutstanding: 10,
        units: { revenue: "billion_vnd", sharesOutstanding: "million_shares" },
      },
      persistedValuationInputs: {
        marketCap: 2,
        marketPrice: 50_000,
        marketUnitMetadata,
      },
    });

    expect(result.selectedInputs.marketCap).toMatchObject({
      normalizationStatus: "ready",
      normalizedUnit: "vnd",
      source: "market_pvt",
      value: 2_000_000_000,
    });
    expect(result.calculation.metrics.marketCap).toMatchObject({
      reason: "ready_from_direct_market_cap",
      status: "ready",
      value: 2_000_000_000,
    });
    expect(result.calculation.metrics.ps.status).toBe("ready");
  });

  it("uses persisted market bridge metadata without changing ownership to Financials", () => {
    const marketUnitMetadata = buildMarketPvtUnitMetadata({
      source: "persisted_market_bridge",
      sourceLabel: "persisted_market_bridge_unit_test",
      units: { marketCap: "billion_vnd", marketPrice: "vnd_per_share" },
      values: { marketCap: 5, marketPrice: 50_000 },
    });
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        revenue: 1000,
        units: { revenue: "million_vnd" },
      },
      persistedValuationInputs: {
        marketCap: 5,
        marketPrice: 50_000,
        marketUnitMetadata,
      },
    });

    expect(result.selectedInputs.marketPrice).toMatchObject({
      normalizationStatus: "ready",
      source: "persisted_bridge",
      unit: "vnd_per_share",
    });
    expect(result.sourceBoundary.marketSourceMode).toBe("persisted_bridge");
    expect(result.calculation.metrics.marketCap).toMatchObject({
      reason: "ready_from_direct_market_cap",
      status: "ready",
      value: 5_000_000_000,
    });
    expect(result.calculation.metrics.ps.status).toBe("ready");
  });

  it("derives market cap only when market price and shares units are explicit", () => {
    const explicitMarket = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { sharesOutstanding: 10, units: { sharesOutstanding: "million_shares" } },
      persistedValuationInputs: {
        marketPrice: 50_000,
        marketUnitMetadata: buildMarketPvtUnitMetadata({
          units: { marketPrice: "vnd_per_share" },
          values: { marketPrice: 50_000 },
        }),
      },
    });
    const unknownShares = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { sharesOutstanding: 10 },
      persistedValuationInputs: {
        marketPrice: 50_000,
        marketUnitMetadata: buildMarketPvtUnitMetadata({
          units: { marketPrice: "vnd_per_share" },
          values: { marketPrice: 50_000 },
        }),
      },
    });

    expect(explicitMarket.calculation.metrics.marketCap).toMatchObject({
      reason: "ready_from_market_price_and_shares",
      status: "ready",
      value: 500_000_000_000,
    });
    expect(unknownShares.selectedInputs.sharesOutstanding.normalizationStatus).toBe("unknown_unit");
    expect(unknownShares.calculation.metrics.marketCap.status).toBe("insufficient_data");
  });

  it("does not accept market price or market cap from Financials runtime ownership", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        eps: 2500,
        marketCap: 1_000_000_000,
        marketPrice: 50_000,
        units: { eps: "vnd_per_share" },
      } as never,
    });

    expect(result.selectedInputs.marketPrice.source).toBe("unavailable");
    expect(result.selectedInputs.marketCap.source).toBe("unavailable");
    expect(result.calculation.metrics.pe.status).toBe("insufficient_data");
    expect(result.calculation.metrics.marketCap.status).toBe("insufficient_data");
  });
});
