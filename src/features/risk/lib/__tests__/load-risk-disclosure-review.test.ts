import { describe, expect, it } from "vitest";
import { riskDisclosureReviewsByTicker } from "../../data/riskRedesign.data";
import { loadRiskDisclosureReview } from "../load-risk-disclosure-review";

describe("loadRiskDisclosureReview", () => {
  it("returns missing-source review-only disclosure data for seeded tickers", async () => {
    const result = await loadRiskDisclosureReview("FPT");

    expect(result.ticker).toBe("FPT");
    expect(result.runtimeStatus).toBe("missing_source");
    expect(result.sourceMode).toBe("research_only");
    expect(result.productionApproved).toBe(false);
    expect(result.review.productionApproved).toBe(false);
    expect(result.review.needsReview).toBe(true);
  });

  it("loads partial manual disclosure sources for HPG, VNM, and MWG", async () => {
    for (const ticker of ["HPG", "VNM", "MWG"]) {
      const result = await loadRiskDisclosureReview(ticker);

      expect(result.ticker).toBe(ticker);
      expect(result.runtimeStatus).toBe("partial_disclosure");
      expect(result.sourceMode).toBe("research_only");
      expect(result.review.sourceUrl).toBeTruthy();
      expect(result.review.sourceUrl).toContain("D:/AtelierFinanceFinancialsReview/annual-reports/");
      expect(result.review.sourceUrl).toContain("_annual_report_2025.pdf");
      expect(result.review.sourceUrl).not.toContain("2024");
      expect(result.review.sourceUrl).not.toMatch(/^https?:\/\//);
      expect(result.review.filingStatus).toBe("needs_review");
      expect(result.review.productionApproved).toBe(false);
      expect(result.review.needsReview).toBe(true);
    }
  });

  it("loads reviewed local PDF audit fields where the annual report exposes them", async () => {
    const hpg = await loadRiskDisclosureReview("HPG");
    const mwg = await loadRiskDisclosureReview("MWG");
    const vnm = await loadRiskDisclosureReview("VNM");

    expect(hpg.review.auditor).toContain("Deloitte");
    expect(hpg.review.auditOpinion).toContain("chấp nhận toàn phần");
    expect(hpg.review.reportPublishedDate).toBe("2026-03-24");

    expect(mwg.review.auditor).toContain("Ernst & Young");
    expect(mwg.review.auditOpinion).toContain("chấp nhận toàn phần");
    expect(mwg.review.reportPublishedDate).toBe("2026-03-23");

    expect(vnm.review.auditor).toContain("KPMG");
    expect(vnm.review.auditOpinion).toBeNull();
    expect(vnm.review.reportPublishedDate).toBe("2026-02-27");

    expect(hpg.review.relatedPartyNotes).toBeNull();
    expect(mwg.review.relatedPartyNotes).toBeNull();
    expect(vnm.review.relatedPartyNotes).toBeNull();
  });

  it("returns unavailable missing-source data for unsupported tickers", async () => {
    const result = await loadRiskDisclosureReview("AAA");

    expect(result.ticker).toBe("AAA");
    expect(result.runtimeStatus).toBe("missing_source");
    expect(result.sourceMode).toBe("unavailable");
    expect(result.review.sourceType).toBe("unknown");
    expect(result.review.productionApproved).toBe(false);
  });

  it("classifies partial and available disclosure records without production approval", async () => {
    const original = riskDisclosureReviewsByTicker.FPT;
    riskDisclosureReviewsByTicker.FPT = {
      ...original,
      sourceUrl: "https://example.test/fpt-disclosure.pdf",
      filingStatus: "needs_review",
    };

    const partial = await loadRiskDisclosureReview("FPT");
    expect(partial.runtimeStatus).toBe("partial_disclosure");
    expect(partial.productionApproved).toBe(false);

    riskDisclosureReviewsByTicker.FPT = {
      ...original,
      auditor: "Independent auditor",
      auditOpinion: "Unmodified opinion",
      reportPublishedDate: "2025-03-31",
      filingStatus: "available",
      relatedPartyNotes: "Related-party note reviewed.",
      sourceUrl: "https://example.test/fpt-annual-report.pdf",
    };

    const available = await loadRiskDisclosureReview("FPT");
    expect(available.runtimeStatus).toBe("available");
    expect(available.sourceMode).toBe("research_only");
    expect(available.review.productionApproved).toBe(false);

    riskDisclosureReviewsByTicker.FPT = original;
  });
});
