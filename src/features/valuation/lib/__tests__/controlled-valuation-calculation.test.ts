import { describe, expect, it } from "vitest";

import { buildControlledValuationCalculation } from "../controlled-valuation-calculation";

describe("controlled valuation calculation helper", () => {
  it("calculates P/E only when market price and EPS are positive", () => {
    const result = buildControlledValuationCalculation({
      financials: { eps: 5 },
      market: { marketPrice: 100 },
    });

    expect(result.metrics.pe.status).toBe("ready");
    expect(result.metrics.pe.value).toBe(20);
  });

  it("keeps P/E insufficient when EPS is missing", () => {
    const result = buildControlledValuationCalculation({
      financials: { eps: null },
      market: { marketPrice: 100 },
    });

    expect(result.metrics.pe.status).toBe("insufficient_data");
    expect(result.metrics.pe.value).toBeNull();
    expect(result.metrics.pe.reason).toBe("missing_eps");
  });

  it("keeps P/E not applicable when EPS is zero or negative", () => {
    for (const eps of [0, -1]) {
      const result = buildControlledValuationCalculation({
        financials: { eps },
        market: { marketPrice: 100 },
      });

      expect(result.metrics.pe.status).toBe("not_applicable");
      expect(result.metrics.pe.value).toBeNull();
      expect(result.metrics.pe.reason).toBe("eps_non_positive");
    }
  });

  it("keeps P/E insufficient when market price is missing or non-positive", () => {
    for (const marketPrice of [null, 0, -1]) {
      const result = buildControlledValuationCalculation({
        financials: { eps: 5 },
        market: { marketPrice },
      });

      expect(result.metrics.pe.status).toBe("insufficient_data");
      expect(result.metrics.pe.value).toBeNull();
      expect(result.metrics.pe.reason).toBe("missing_valid_market_price");
    }
  });

  it("calculates BVPS only when equity and shares outstanding are positive", () => {
    const result = buildControlledValuationCalculation({
      financials: { equity: 1000, sharesOutstanding: 100 },
    });

    expect(result.metrics.bvps.status).toBe("ready");
    expect(result.metrics.bvps.value).toBe(10);
  });

  it("keeps BVPS insufficient and P/B not ready when equity is missing", () => {
    const result = buildControlledValuationCalculation({
      financials: { equity: null, sharesOutstanding: 100 },
      market: { marketPrice: 20 },
    });

    expect(result.metrics.bvps.status).toBe("insufficient_data");
    expect(result.metrics.bvps.value).toBeNull();
    expect(result.metrics.pb.status).toBe("insufficient_data");
    expect(result.metrics.pb.value).toBeNull();
  });

  it("keeps BVPS and P/B not applicable when equity is zero or negative", () => {
    for (const equity of [0, -1]) {
      const result = buildControlledValuationCalculation({
        financials: { equity, sharesOutstanding: 100 },
        market: { marketPrice: 20 },
      });

      expect(result.metrics.bvps.status).toBe("not_applicable");
      expect(result.metrics.pb.status).toBe("not_applicable");
      expect(result.metrics.bvps.value).toBeNull();
      expect(result.metrics.pb.value).toBeNull();
    }
  });

  it("keeps market cap and BVPS insufficient when shares outstanding is missing or non-positive", () => {
    for (const sharesOutstanding of [null, 0, -1]) {
      const result = buildControlledValuationCalculation({
        financials: { equity: 1000, sharesOutstanding },
        market: { marketPrice: 20 },
      });

      expect(result.metrics.marketCap.status).toBe("insufficient_data");
      expect(result.metrics.marketCap.value).toBeNull();
      expect(result.metrics.bvps.status).toBe("insufficient_data");
      expect(result.metrics.bvps.value).toBeNull();
    }
  });

  it("calculates P/B only when market price and BVPS are ready", () => {
    const result = buildControlledValuationCalculation({
      financials: { equity: 1000, sharesOutstanding: 100 },
      market: { marketPrice: 20 },
    });

    expect(result.metrics.bvps.value).toBe(10);
    expect(result.metrics.pb.status).toBe("ready");
    expect(result.metrics.pb.value).toBe(2);
  });

  it("calculates P/S from direct market cap when revenue is positive", () => {
    const result = buildControlledValuationCalculation({
      financials: { revenue: 1000 },
      market: { marketCap: 5000 },
    });

    expect(result.metrics.marketCap.status).toBe("ready");
    expect(result.metrics.marketCap.value).toBe(5000);
    expect(result.metrics.ps.status).toBe("ready");
    expect(result.metrics.ps.value).toBe(5);
  });

  it("calculates P/S from market price multiplied by shares when direct market cap is absent", () => {
    const result = buildControlledValuationCalculation({
      financials: { revenue: 1000, sharesOutstanding: 100 },
      market: { marketPrice: 50 },
    });

    expect(result.metrics.marketCap.status).toBe("ready");
    expect(result.metrics.marketCap.value).toBe(5000);
    expect(result.metrics.ps.status).toBe("ready");
    expect(result.metrics.ps.value).toBe(5);
  });

  it("keeps P/S insufficient when revenue is missing", () => {
    const result = buildControlledValuationCalculation({
      financials: { revenue: null },
      market: { marketCap: 5000 },
    });

    expect(result.metrics.ps.status).toBe("insufficient_data");
    expect(result.metrics.ps.value).toBeNull();
    expect(result.metrics.ps.reason).toBe("missing_revenue");
  });

  it("keeps P/S not applicable when revenue is zero or negative", () => {
    for (const revenue of [0, -1]) {
      const result = buildControlledValuationCalculation({
        financials: { revenue },
        market: { marketCap: 5000 },
      });

      expect(result.metrics.ps.status).toBe("not_applicable");
      expect(result.metrics.ps.value).toBeNull();
      expect(result.metrics.ps.reason).toBe("revenue_non_positive");
    }
  });

  it("always blocks EV, EV/EBITDA, DCF, and fair value range in Phase 59", () => {
    const result = buildControlledValuationCalculation({
      financials: { revenue: 1000, equity: 1000, eps: 5, sharesOutstanding: 100 },
      market: { marketPrice: 100, marketCap: 10_000 },
    });

    expect(result.blockedMetrics.ev).toMatchObject({
      status: "blocked",
      value: null,
      reason: "blocked_until_explicit_ev_inputs",
    });
    expect(result.blockedMetrics.evToEbitda).toMatchObject({
      status: "blocked",
      value: null,
      reason: "blocked_until_ebitda_source_is_explicit",
    });
    expect(result.blockedMetrics.dcf).toMatchObject({
      status: "blocked",
      value: null,
      reason: "blocked_no_dcf_wacc_in_phase_59",
    });
    expect(result.blockedMetrics.fairValueRange).toMatchObject({
      status: "blocked",
      value: null,
      reason: "blocked_no_fair_value_range_in_phase_59",
    });
  });

  it("keeps production approval false for local, research-only, and sample source states", () => {
    for (const dataMode of ["local", "research_only", "sample"]) {
      const result = buildControlledValuationCalculation({
        source: { dataMode, productionApproved: false },
      });

      expect(result.sourceBoundary.productionApproved).toBe(false);
      expect(result.sourceBoundary.canClaimValuationDbBacked).toBe(false);
      expect(result.sourceBoundary.warnings).toContain("local_research_data_not_production_approved");
    }
  });

  it("adds mixed-source warning and keeps Valuation DB-backed claim blocked", () => {
    const result = buildControlledValuationCalculation({
      source: {
        financialsSourceMode: "financials_runtime_partial",
        marketSourceMode: "persisted_bridge",
        mixedSource: true,
      },
    });

    expect(result.sourceBoundary.mixedSource).toBe(true);
    expect(result.sourceBoundary.canClaimValuationDbBacked).toBe(false);
    expect(result.sourceBoundary.warnings).toContain("valuation_remains_mixed_source");
  });

  it("adds fallback warning and keeps production approval false", () => {
    const result = buildControlledValuationCalculation({
      source: { fallbackUsed: true, dataMode: "sample" },
    });

    expect(result.sourceBoundary.productionApproved).toBe(false);
    expect(result.sourceBoundary.warnings).toContain("fallback_data_not_production_approved");
  });

  it("does not zero-fill missing values", () => {
    const result = buildControlledValuationCalculation();
    const values = [
      result.metrics.pe.value,
      result.metrics.bvps.value,
      result.metrics.pb.value,
      result.metrics.ps.value,
      result.metrics.marketCap.value,
      result.blockedMetrics.ev.value,
      result.blockedMetrics.evToEbitda.value,
      result.blockedMetrics.dcf.value,
      result.blockedMetrics.fairValueRange.value,
    ];

    expect(values.every((value) => value === null)).toBe(true);
    expect(values).not.toContain(0);
  });

  it("keeps forbidden interpretation flags false", () => {
    const result = buildControlledValuationCalculation({
      financials: { revenue: 1000, equity: 1000, eps: 5, sharesOutstanding: 100 },
      market: { marketPrice: 100 },
    });

    expect(result.forbiddenInterpretation.hasRecommendation).toBe(false);
    expect(result.forbiddenInterpretation.hasCheapExpensiveClaim).toBe(false);
  });

  it("does not emit forbidden wording in helper output", () => {
    const output = JSON.stringify(
      buildControlledValuationCalculation({
        financials: { revenue: 1000, equity: 1000, eps: 5, sharesOutstanding: 100 },
        market: { marketPrice: 100 },
        source: { mixedSource: true, fallbackUsed: true, dataMode: "research_only" },
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
