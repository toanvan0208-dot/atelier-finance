import { describe, expect, it } from "vitest";

import {
  deriveMetadataFromInputs,
  normalizeOptionalNumber,
  safeRatio,
  validateEquityInterpretation,
  validatePeInterpretation,
  validateSectorSensitiveMetric,
  type DataSourceMetadata,
} from "../index";

const metadata: DataSourceMetadata = {
  source: "unit-test-source",
  sourceType: "curated_internal",
  asOf: "2026-06-17",
  period: {
    type: "quarter",
    value: "2026-Q2",
    fiscalYear: 2026,
    fiscalQuarter: 2,
  },
  collectedAt: "2026-06-17T00:00:00.000Z",
  isDemoData: false,
  isStale: false,
  missingFields: [],
  warnings: [],
};

describe("data contract validation", () => {
  it("does not convert missing numeric fields to zero", () => {
    expect(normalizeOptionalNumber(undefined)).toBeNull();
    expect(normalizeOptionalNumber(null)).toBeNull();
    expect(normalizeOptionalNumber(Number.NaN)).toBeNull();
    expect(normalizeOptionalNumber(0)).toBe(0);
  });

  it("returns insufficient_data when ratio denominator is zero or missing", () => {
    const zeroDenominator = safeRatio(10, 0, metadata, "testRatio");
    const missingDenominator = safeRatio(10, null, metadata, "testRatio");

    expect(zeroDenominator.value).toBeNull();
    expect(zeroDenominator.status).toBe("insufficient_data");
    expect(zeroDenominator.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_DENOMINATOR" }),
      ]),
    );

    expect(missingDenominator.value).toBeNull();
    expect(missingDenominator.status).toBe("insufficient_data");
    expect(missingDenominator.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_DENOMINATOR" }),
      ]),
    );
  });

  it("marks EPS less than or equal to zero as not applicable for P/E interpretation", () => {
    for (const eps of [0, -1]) {
      const result = validatePeInterpretation({ eps, metadata });

      expect(result.status).toBe("not_ready");
      expect(result.interpretation).toBe("not_applicable");
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "EPS_NOT_POSITIVE" }),
        ]),
      );
    }
  });

  it("marks equity less than or equal to zero as not applicable for equity-based interpretation", () => {
    for (const equity of [0, -1]) {
      const result = validateEquityInterpretation({ equity, metadata });

      expect(result.status).toBe("needs_review");
      expect(result.interpretation).toBe("not_applicable");
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "EQUITY_NOT_POSITIVE" }),
        ]),
      );
    }
  });

  it("blocks generic current ratio and debt-to-equity checks for banks", () => {
    for (const metric of ["currentRatio", "debtToEquity"] as const) {
      const result = validateSectorSensitiveMetric({
        companyType: "bank",
        metric,
        metadata,
      });

      expect(result.status).toBe("needs_review");
      expect(result.interpretation).toBe("not_applicable");
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "FINANCIAL_SECTOR_CAVEAT" }),
        ]),
      );
    }
  });

  it("preserves source and asOf metadata when deriving metrics", () => {
    const secondMetadata: DataSourceMetadata = {
      ...metadata,
      source: "second-source",
      asOf: "2026-06-16",
      missingFields: ["eps"],
    };

    const derived = deriveMetadataFromInputs(
      [metadata, secondMetadata],
      {},
      "data-contract-v1",
    );

    expect(derived.source).toBe(metadata.source);
    expect(derived.asOf).toBe(metadata.asOf);
    expect(derived.derivedFrom).toHaveLength(2);
    expect(derived.missingFields).toEqual(["eps"]);
    expect(derived.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "DERIVED_FROM_INPUTS" }),
      ]),
    );
  });
});

