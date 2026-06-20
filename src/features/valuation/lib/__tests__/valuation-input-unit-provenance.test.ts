import { describe, expect, it } from "vitest";

import { normalizeValuationInput } from "../valuation-input-unit-provenance";

const provenance = {
  productionApproved: false,
  source: "financials_runtime" as const,
  sourceLabel: "unit-test",
};

describe("valuation input unit provenance", () => {
  it("normalizes million VND to VND", () => {
    const result = normalizeValuationInput({
      expected: "currency",
      provenance,
      unit: "million_vnd",
      value: 1000,
    });

    expect(result.status).toBe("ready");
    expect(result.normalizedUnit).toBe("vnd");
    expect(result.normalizedValue).toBe(1_000_000_000);
  });

  it("normalizes billion VND to VND", () => {
    const result = normalizeValuationInput({
      expected: "currency",
      provenance,
      unit: "billion_vnd",
      value: 2,
    });

    expect(result.status).toBe("ready");
    expect(result.normalizedUnit).toBe("vnd");
    expect(result.normalizedValue).toBe(2_000_000_000);
  });

  it("normalizes thousand shares to shares", () => {
    const result = normalizeValuationInput({
      expected: "shares",
      provenance,
      unit: "thousand_shares",
      value: 500,
    });

    expect(result.status).toBe("ready");
    expect(result.normalizedUnit).toBe("shares");
    expect(result.normalizedValue).toBe(500_000);
  });

  it("normalizes million shares to shares", () => {
    const result = normalizeValuationInput({
      expected: "shares",
      provenance,
      unit: "million_shares",
      value: 10,
    });

    expect(result.status).toBe("ready");
    expect(result.normalizedUnit).toBe("shares");
    expect(result.normalizedValue).toBe(10_000_000);
  });

  it("keeps VND per share unchanged", () => {
    const result = normalizeValuationInput({
      expected: "per_share",
      provenance,
      unit: "vnd_per_share",
      value: 25_000,
    });

    expect(result.status).toBe("ready");
    expect(result.normalizedUnit).toBe("vnd_per_share");
    expect(result.normalizedValue).toBe(25_000);
  });

  it("blocks unknown unit without magnitude guessing", () => {
    const result = normalizeValuationInput({
      expected: "currency",
      provenance,
      unit: "unknown",
      value: 9_999_999_999_999,
    });

    expect(result.status).toBe("unknown_unit");
    expect(result.normalizedValue).toBeNull();
    expect(result.warnings).toContain("unknown_unit_blocks_calculation");
  });

  it("keeps missing values null without zero-fill", () => {
    const result = normalizeValuationInput({
      expected: "currency",
      provenance,
      unit: "vnd",
      value: null,
    });

    expect(result.status).toBe("missing");
    expect(result.value).toBeNull();
    expect(result.normalizedValue).toBeNull();
  });

  it("blocks incompatible unit for expected kind", () => {
    const result = normalizeValuationInput({
      expected: "shares",
      provenance,
      unit: "million_vnd",
      value: 100,
    });

    expect(result.status).toBe("not_normalized");
    expect(result.normalizedValue).toBeNull();
    expect(result.warnings).toContain("unit_million_vnd_not_compatible_with_shares");
  });
});
