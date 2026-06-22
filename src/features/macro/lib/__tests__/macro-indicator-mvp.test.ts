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
    for (const indicator of macroIndicators) {
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

  it("keeps missing, sample, and research records outside production approval", () => {
    for (const indicator of macroIndicators) {
      expect(indicator.productionApproved).toBe(false);
      expect(indicator.status).toBe("missing");
      expect(indicator.dataMode).toBe("missing");
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
    for (const metric of compassMetrics) {
      expect(metric.value).toBeNull();
      expect(formatMacroCompassMetricValue(metric)).toBe(MACRO_COMPASS_MISSING_LABEL);
      expect(formatMacroCompassMetricValue(metric)).not.toContain("0");
    }
  });

  it("keeps non-production data states outside production approval", () => {
    for (const metric of compassMetrics) {
      if (["sample", "research_only", "unavailable"].includes(metric.dataMode) || metric.status !== "available") {
        expect(metric.productionApproved).toBe(false);
      }
    }
  });

  it("provides a warning whenever metric metadata is incomplete", () => {
    for (const metric of compassMetrics) {
      if (!metric.sourceName || !metric.sourceLabel || !metric.period || !metric.asOf) {
        expect(metric.warnings.length).toBeGreaterThan(0);
      }
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
