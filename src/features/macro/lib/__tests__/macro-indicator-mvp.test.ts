import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MacroPage } from "../../components/MacroPage";
import { macroIndicators } from "../../data/macroIndicators.data";
import {
  formatMacroIndicatorValue,
  MACRO_INDICATOR_KEYS,
  MACRO_MISSING_VALUE_LABEL,
  type MacroIndicator,
} from "../macro-indicator-contract";

describe("Macro MVP indicator contract", () => {
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

  it("renders missing values and source metadata gaps safely", () => {
    const html = renderToStaticMarkup(createElement(MacroPage));

    expect(html).toContain("Bước 1 — Bối cảnh vĩ mô");
    expect(html.match(/Chưa đủ dữ liệu/g)?.length).toBeGreaterThanOrEqual(4);
    expect(html).toContain("Nguồn: đang hoàn thiện");
    expect(html).toContain("Kỳ dữ liệu: đang hoàn thiện");
    expect(html).not.toContain(">0<");
  });

  it("does not include recommendation terms in Macro product copy", () => {
    const macroCopy = [
      ...macroIndicators.flatMap((indicator) => [
        indicator.name,
        indicator.explanationForBeginner,
        indicator.whyItMatters,
        indicator.whatToCheckNext,
        ...indicator.warnings,
      ]),
      renderToStaticMarkup(createElement(MacroPage)),
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
});
