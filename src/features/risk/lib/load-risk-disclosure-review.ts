import { riskDisclosureReviewsByTicker } from "../data/riskRedesign.data";
import type { RiskDisclosureReview } from "../types";

export type RiskDisclosureReviewRuntime = {
  ticker: string;
  review: RiskDisclosureReview;
  runtimeStatus: "available" | "missing_source" | "partial_disclosure";
  sourceMode: "research_only" | "unavailable";
  productionApproved: false;
};

const normalizeTicker = (ticker: string | null | undefined): string => {
  const normalized = ticker?.trim().toUpperCase();
  return normalized || "FPT";
};

const unavailableReview = (ticker: string): RiskDisclosureReview => ({
  ticker,
  auditor: null,
  auditOpinion: null,
  reportPublishedDate: null,
  filingStatus: "unknown",
  relatedPartyNotes: null,
  sourceUrl: null,
  sourceType: "unknown",
  needsReview: true,
  productionApproved: false,
});

const hasAnyDisclosureField = (review: RiskDisclosureReview): boolean =>
  Boolean(
    review.auditor ||
      review.auditOpinion ||
      review.reportPublishedDate ||
      review.relatedPartyNotes ||
      review.sourceUrl,
  );

const resolveRuntimeStatus = (review: RiskDisclosureReview): RiskDisclosureReviewRuntime["runtimeStatus"] => {
  if (!review.sourceUrl) return "missing_source";
  if (review.filingStatus === "available" && hasAnyDisclosureField(review)) return "available";
  return "partial_disclosure";
};

export async function loadRiskDisclosureReview(
  tickerInput?: string | null,
): Promise<RiskDisclosureReviewRuntime> {
  const ticker = normalizeTicker(tickerInput);
  const review = riskDisclosureReviewsByTicker[ticker] ?? unavailableReview(ticker);

  return {
    ticker,
    review: {
      ...review,
      ticker,
      needsReview: true,
      productionApproved: false,
    },
    runtimeStatus: resolveRuntimeStatus(review),
    sourceMode: review.sourceType === "unknown" ? "unavailable" : "research_only",
    productionApproved: false,
  };
}
