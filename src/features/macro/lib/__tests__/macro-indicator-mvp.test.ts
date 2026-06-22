import { describe, expect, it } from "vitest";
import { macroIndicators } from "../../data/macroIndicators.data";
import { macroCompassData } from "../../data/macroCompass.data";
import {
  formatMacroCompassMetricValue,
  macroCompassMetricCanBeAvailable,
  MACRO_COMPASS_MISSING_LABEL,
} from "../macro-compass-data-contract";
import {
  formatMacroIndicatorValue,
  MACRO_INDICATOR_KEYS,
  MACRO_MISSING_VALUE_LABEL,
  type MacroIndicator,
} from "../macro-indicator-contract";

describe("Macro MVP indicator contract", () => {
  const compassMetrics = [...macroCompassData.worldMetrics, ...macroCompassData.vietnamMetrics];
  it("contains exactly the four required indicator keys", () => {
    expect(macroIndicators.map((indicator) => indicator.indicatorKey)).toEqual([...MACRO_INDICATOR_KEYS]);
  });

  it("keeps missing values null and never formats them as zero", () => {
    for (const indicator of macroIndicators.filter((item) => item.status === "missing")) {
      expect(indicator.value).toBeNull();
      expect(formatMacroIndicatorValue(indicator)).toBe(MACRO_MISSING_VALUE_LABEL);
      expect(formatMacroIndicatorValue(indicator)).not.toContain("0");
    }
  });

  it("fails closed when a numeric value has no explicit unit", () => {
    const invalidUnitRecord: MacroIndicator = {
      ...macroIndicators[0],
      value: 5,
      unit: null,
      status: "partial",
    };

    expect(formatMacroIndicatorValue(invalidUnitRecord)).toBe(MACRO_MISSING_VALUE_LABEL);
  });

  it("keeps missing and manual reviewed records outside production approval", () => {
    for (const indicator of macroIndicators) {
      expect(indicator.productionApproved).toBe(false);
    }
  });

  it("contains the expected manual reviewed indicator keys", () => {
    expect(
      macroIndicators
        .filter((indicator) => indicator.dataMode === "manual_reviewed")
        .map((indicator) => indicator.indicatorKey)
    ).toEqual(["gdp_growth", "cpi", "usd_vnd"]);
  });

  it("requires complete metadata for every available indicator", () => {
    for (const indicator of macroIndicators.filter((item) => item.status === "available")) {
      expect(indicator.value).not.toBeNull();
      expect(indicator.unit).toBeTruthy();
      expect(indicator.period).toBeTruthy();
      expect(indicator.asOf).toBeTruthy();
      expect(indicator.sourceName).toBeTruthy();
      expect(indicator.sourceLabel || indicator.sourceRef).toBeTruthy();
      expect(indicator.productionApproved).toBe(false);
    }
  });

  it("provides beginner explanation, relevance, and a next check for every indicator", () => {
    for (const indicator of macroIndicators) {
      expect(indicator.explanationForBeginner.length).toBeGreaterThan(20);
      expect(indicator.whyItMatters.length).toBeGreaterThan(20);
      expect(indicator.whatToCheckNext.length).toBeGreaterThan(20);
    }
  });

  it("does not include recommendation terms in Macro contract copy", () => {
    const macroCopy = [
      ...macroIndicators.flatMap((indicator) => [
        indicator.name,
        indicator.explanationForBeginner,
        indicator.whyItMatters,
        indicator.whatToCheckNext,
        ...indicator.warnings,
      ]),
    ]
      .join(" ")
      .toLowerCase();
    const phrase = (...parts: string[]) => parts.join("");
    const forbiddenTerms = [
      phrase("nên ", "mua"),
      phrase("nên ", "bán"),
      phrase("tín hiệu ", "mua"),
      phrase("tín hiệu ", "bán"),
      phrase("giá ", "mục tiêu"),
      phrase("fair ", "value"),
      phrase("target ", "price"),
      phrase("up", "side"),
      phrase("down", "side"),
      phrase("recommen", "dation"),
    ];

    for (const term of forbiddenTerms) expect(macroCopy).not.toContain(term);
  });

  it("does not mark a concrete value available without source, period, and as-of metadata", () => {
    const incompleteMetric = {
      ...compassMetrics[0],
      value: 5,
      unit: "%",
      status: "available" as const,
    };

    expect(macroCompassMetricCanBeAvailable(incompleteMetric)).toBe(false);
    for (const metric of compassMetrics) {
      if (metric.status === "available") expect(macroCompassMetricCanBeAvailable(metric)).toBe(true);
    }
  });

  it("keeps missing compass values null and never formats them as zero", () => {
    for (const metric of compassMetrics.filter((item) => item.status === "missing")) {
      expect(metric.value).toBeNull();
      expect(formatMacroCompassMetricValue(metric)).toBe(MACRO_COMPASS_MISSING_LABEL);
      expect(formatMacroCompassMetricValue(metric)).not.toContain("0");
    }
  });

  it("keeps non-production data states outside production approval", () => {
    for (const metric of compassMetrics) {
      if (["sample", "research_only", "manual_reviewed", "unavailable"].includes(metric.dataMode) || metric.status !== "available") {
        expect(metric.productionApproved).toBe(false);
      }
    }
  });

  it("provides a warning whenever metric metadata is incomplete", () => {
    for (const metric of compassMetrics) {
      if (!metric.sourceName || (!metric.sourceLabel && !metric.sourceRef) || !metric.period || !metric.asOf) {
        expect(metric.warnings.length).toBeGreaterThan(0);
      }
    }
  });

  it("does not restore legacy mock numbers without metadata", () => {
    const serialized = JSON.stringify(macroCompassData);
    for (const legacyMock of ["6.1%", "51.2", "104.2", "3.4%", "25,450", "3,200 tỷ"]) {
      expect(serialized).not.toContain(legacyMock);
    }
  });

  it("keeps Macro compass copy free of recommendation terms", () => {
    const macroCopy = JSON.stringify(macroCompassData).toLowerCase();
    const phrase = (...parts: string[]) => parts.join("");
    const forbiddenTerms = [
      phrase("nên ", "mua"),
      phrase("nên ", "bán"),
      phrase("nên ", "nắm giữ"),
      phrase("tín hiệu ", "mua"),
      phrase("tín hiệu ", "bán"),
      phrase("điểm ", "mua"),
      phrase("cổ phiếu ", "an toàn"),
      phrase("đáng ", "mua"),
      phrase("giá ", "mục tiêu"),
      phrase("fair ", "value"),
      phrase("target ", "price"),
      phrase("up", "side"),
      phrase("down", "side"),
      phrase("recommen", "dation"),
    ];

    for (const term of forbiddenTerms) expect(macroCopy).not.toContain(term);
  });
});
