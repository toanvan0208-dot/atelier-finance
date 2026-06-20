import { describe, expect, it } from "vitest";

import { buildControlledValuationIntegrationBoundary } from "../controlled-valuation-integration-boundary";

describe("controlled valuation integration boundary", () => {
  it("uses Financials runtime revenue and equity when available", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        revenue: 1000,
        equity: 1200,
        dataMode: "research_only",
        readPath: "local_db",
      },
    });

    expect(result.selectedInputs.revenue).toEqual({ value: 1000, source: "financials_runtime" });
    expect(result.selectedInputs.equity).toEqual({ value: 1200, source: "financials_runtime" });
    expect(result.sourceBoundary.productionApproved).toBe(false);
    expect(result.sourceBoundary.canClaimValuationDbBacked).toBe(false);
  });

  it("uses persisted market price ownership with runtime financials as mixed source", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { revenue: 1000, eps: 5, dataMode: "research_only" },
      persistedValuationInputs: { marketPrice: 100, dataMode: "research_only" },
    });

    expect(result.selectedInputs.marketPrice).toEqual({ value: 100, source: "persisted_bridge" });
    expect(result.sourceBoundary.valuationSourceMode).toBe("mixed_source");
    expect(result.sourceBoundary.warnings).toContain("valuation_remains_mixed_source");
  });

  it("computes P/E when runtime EPS and persisted market price are valid", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { eps: 5 },
      persistedValuationInputs: { marketPrice: 100 },
    });

    expect(result.calculation.metrics.pe.status).toBe("ready");
    expect(result.calculation.metrics.pe.value).toBe(20);
    expect(result.sourceBoundary.canClaimValuationDbBacked).toBe(false);
  });

  it("keeps P/E insufficient when EPS is missing from both sources", () => {
    const result = buildControlledValuationIntegrationBoundary({
      persistedValuationInputs: { marketPrice: 100 },
    });

    expect(result.selectedInputs.eps).toEqual({ value: null, source: "unavailable" });
    expect(result.calculation.metrics.pe.status).toBe("insufficient_data");
    expect(result.calculation.metrics.pe.value).toBeNull();
  });

  it("keeps P/E not applicable when runtime EPS is non-positive", () => {
    for (const eps of [0, -1]) {
      const result = buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: { eps },
        persistedValuationInputs: { marketPrice: 100 },
      });

      expect(result.calculation.metrics.pe.status).toBe("not_applicable");
      expect(result.calculation.metrics.pe.value).toBeNull();
    }
  });

  it("computes BVPS and P/B from runtime equity and shares plus persisted market price", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { equity: 1000, sharesOutstanding: 100 },
      persistedValuationInputs: { marketPrice: 20 },
    });

    expect(result.calculation.metrics.bvps.status).toBe("ready");
    expect(result.calculation.metrics.bvps.value).toBe(10);
    expect(result.calculation.metrics.pb.status).toBe("ready");
    expect(result.calculation.metrics.pb.value).toBe(2);
  });

  it("keeps BVPS and P/B not applicable when equity is non-positive", () => {
    for (const equity of [0, -1]) {
      const result = buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: { equity, sharesOutstanding: 100 },
        persistedValuationInputs: { marketPrice: 20 },
      });

      expect(result.calculation.metrics.bvps.status).toBe("not_applicable");
      expect(result.calculation.metrics.pb.status).toBe("not_applicable");
    }
  });

  it("computes P/S from runtime revenue and direct persisted market cap", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { revenue: 1000 },
      persistedValuationInputs: { marketCap: 5000 },
    });

    expect(result.calculation.metrics.marketCap.status).toBe("ready");
    expect(result.calculation.metrics.ps.status).toBe("ready");
    expect(result.calculation.metrics.ps.value).toBe(5);
  });

  it("computes market cap from persisted market price and runtime shares outstanding", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { sharesOutstanding: 100 },
      persistedValuationInputs: { marketPrice: 50 },
    });

    expect(result.calculation.metrics.marketCap.status).toBe("ready");
    expect(result.calculation.metrics.marketCap.value).toBe(5000);
    expect(result.sourceBoundary.valuationSourceMode).toBe("mixed_source");
  });

  it("keeps market cap and BVPS insufficient when shares outstanding is missing", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { equity: 1000 },
      persistedValuationInputs: { marketPrice: 50 },
    });

    expect(result.selectedInputs.sharesOutstanding).toEqual({ value: null, source: "unavailable" });
    expect(result.calculation.metrics.marketCap.status).toBe("insufficient_data");
    expect(result.calculation.metrics.marketCap.value).toBeNull();
    expect(result.calculation.metrics.bvps.status).toBe("insufficient_data");
    expect(result.calculation.metrics.bvps.value).toBeNull();
  });

  it("falls back to persisted financial field when runtime field is explicitly missing", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { revenue: null, dataMode: "research_only" },
      persistedValuationInputs: { revenue: 1000, marketCap: 5000 },
    });

    expect(result.selectedInputs.revenue).toEqual({ value: 1000, source: "persisted_bridge" });
    expect(result.sourceBoundary.warnings).toContain("runtime_revenue_missing_used_persisted_bridge");
    expect(result.calculation.metrics.ps.status).toBe("ready");
  });

  it("marks runtime local research data as not approved for production use", () => {
    const result = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { revenue: 1000, dataMode: "research_only", readPath: "local_db" },
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
      financialsRuntimeSnapshot: { revenue: 1000, equity: 1000, eps: 5, sharesOutstanding: 100 },
      persistedValuationInputs: { marketPrice: 100, marketCap: 10_000 },
    });

    expect(result.calculation.blockedMetrics.ev.status).toBe("blocked");
    expect(result.calculation.blockedMetrics.evToEbitda.status).toBe("blocked");
    expect(result.calculation.blockedMetrics.dcf.status).toBe("blocked");
    expect(result.calculation.blockedMetrics.fairValueRange.status).toBe("blocked");
  });

  it("records that UI output is unchanged by this integration boundary", () => {
    const result = buildControlledValuationIntegrationBoundary();

    expect(result.integrationNotes).toContain("calculation_helper_integrated_ui_output_unchanged");
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
        },
        persistedValuationInputs: { marketPrice: 100, marketCap: 10_000 },
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
});
