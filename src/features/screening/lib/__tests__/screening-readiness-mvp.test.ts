import { describe, expect, it } from "vitest";
import { screeningRedesignData } from "../../data/screeningRedesign.data";
import { buildScreeningReadinessBooleans } from "../screening-readiness";

const expectedTickers = ["FPT", "MWG", "VNM"];
const forbiddenPositiveTerms = [
  "nên mua",
  "nên bán",
  "nên nắm giữ",
  "tín hiệu mua",
  "tín hiệu bán",
  "điểm mua",
  "cổ phiếu an toàn",
  "đáng mua",
  "giá mục tiêu",
  "fair value",
  "target price",
  "upside",
  "downside",
  "recommendation",
  "top cổ phiếu",
  "cổ phiếu tốt nhất",
  "điểm đầu tư",
  "điểm hấp dẫn",
];

function normalizeText(value: unknown) {
  return JSON.stringify(value).normalize("NFC").toLowerCase().replace(/\s+/g, " ");
}

function contextsFor(text: string, term: string) {
  const contexts: string[] = [];
  let index = text.indexOf(term);

  while (index !== -1) {
    contexts.push(text.slice(Math.max(0, index - 80), index + term.length + 80));
    index = text.indexOf(term, index + term.length);
  }

  return contexts;
}

describe("screening readiness MVP", () => {
  it("contains exactly the three focused candidates", () => {
    expect(screeningRedesignData.candidates.map((candidate) => candidate.ticker)).toEqual(expectedTickers);
  });

  it("requires every candidate to carry the screening readiness contract", () => {
    for (const candidate of screeningRedesignData.candidates) {
      expect(candidate.ticker).toBeTruthy();
      expect(candidate.dataStatus).toBe("ready");
      expect(candidate.availableFields.length).toBeGreaterThan(0);
      expect(candidate.missingFields.length).toBeGreaterThan(0);
      expect(candidate.readinessChecks.length).toBeGreaterThanOrEqual(10);
      expect(candidate.productionApproved).toBe(false);
      expect(candidate.readinessScoreLabel).toBe("Mức đủ dữ liệu");
    }
  });

  it("keeps missing values missing rather than replacing them with zero", () => {
    for (const candidate of screeningRedesignData.candidates) {
      expect(candidate.missingFields).not.toContain("0");
      expect(candidate.sourceAsOf).not.toBe("0");
      expect(candidate.productionApproved).toBe(false);
    }
  });

  it("locks P/E when EPS is missing or non-positive", () => {
    expect(
      buildScreeningReadinessBooleans({
        eps: null,
        sharesOutstanding: 100,
        equity: 1_000,
        totalDebt: 10,
        hasRiskReadiness: true,
        hasSourceStatusAsOf: true,
      }).canCalculatePE
    ).toBe(false);

    expect(
      buildScreeningReadinessBooleans({
        eps: 0,
        sharesOutstanding: 100,
        equity: 1_000,
        totalDebt: 10,
        hasRiskReadiness: true,
        hasSourceStatusAsOf: true,
      }).canCalculatePE
    ).toBe(false);
  });

  it("locks share metrics when sharesOutstanding is missing or invalid", () => {
    for (const sharesOutstanding of [null, 0, -1]) {
      const result = buildScreeningReadinessBooleans({
        eps: 100,
        sharesOutstanding,
        equity: 1_000,
        totalDebt: 10,
        hasRiskReadiness: true,
        hasSourceStatusAsOf: true,
      });

      expect(result.canCalculateShareMetrics).toBe(false);
      expect(result.canCalculatePB).toBe(false);
    }
  });

  it("locks P/B when equity is missing or invalid", () => {
    for (const equity of [null, 0, -1]) {
      const result = buildScreeningReadinessBooleans({
        eps: 100,
        sharesOutstanding: 100,
        equity,
        totalDebt: 10,
        hasRiskReadiness: true,
        hasSourceStatusAsOf: true,
      });

      expect(result.canCalculatePB).toBe(false);
    }
  });

  it("locks debt and risk readiness when totalDebt is missing", () => {
    const result = buildScreeningReadinessBooleans({
      eps: 100,
      sharesOutstanding: 100,
      equity: 1_000,
      totalDebt: null,
      hasRiskReadiness: true,
      hasSourceStatusAsOf: true,
    });

    expect(result.canAssessDebt).toBe(false);
    expect(result.canAssessRisk).toBe(false);
  });

  it("adds a warning when source/status/asOf metadata is missing", () => {
    const result = buildScreeningReadinessBooleans({
      eps: 100,
      sharesOutstanding: 100,
      equity: 1_000,
      totalDebt: 10,
      hasRiskReadiness: true,
      hasSourceStatusAsOf: false,
    });

    expect(result.warnings.join(" ")).toContain("source/status/asOf metadata missing");
  });

  it("does not use recommendation terms as positive screener copy", () => {
    const text = normalizeText(screeningRedesignData);

    for (const term of forbiddenPositiveTerms) {
      const unsafe = contextsFor(text, term).filter((context) => !context.includes("không"));
      expect(unsafe).toEqual([]);
    }
  });

  it("uses readiness wording rather than investment-score wording", () => {
    const text = normalizeText(screeningRedesignData);

    expect(text).toContain("mức đủ dữ liệu");
    expect(text).not.toContain("điểm đầu tư");
    expect(text).not.toContain("điểm hấp dẫn");
  });
});
