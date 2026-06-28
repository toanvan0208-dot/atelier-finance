export type CandidateMetadataOutput = {
  sourceLabel: string;
  providerType: string;
  dataMode: string;
  productionApproved: boolean;
  needsReview: boolean;
  currency: "VND" | null;
  exchange: string | null;
  priceUnit: "vnd_per_share" | null;
  volumeUnit: "shares" | null;
  adjustmentStatus: "needs_review" | "adjusted" | "unadjusted" | "unknown";
  warningCodes: string[];
  evidenceNotes: string[];
};

export function normalizeVnstockCandidateMetadata(ticker: string, originalWarningCodes: string[]): CandidateMetadataOutput {
  const isVn30 = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"].includes(ticker);
  
  // vnstock data for VN30 is reliably on HOSE and in VND, per shares.
  // However, adjustment evidence is NOT returned by the payload clearly for historical splits.
  
  const exchange = isVn30 ? "HOSE" : null;
  const currency = "VND";
  const priceUnit = "vnd_per_share";
  const volumeUnit = "shares";
  
  let newWarnings = [...originalWarningCodes];
  let evidenceNotes: string[] = [];

  if (currency === "VND") {
      newWarnings = newWarnings.filter(w => w !== "MISSING_CURRENCY");
      evidenceNotes.push("Inferred currency as VND based on Vietnam market standard.");
  }
  if (exchange === "HOSE") {
      newWarnings = newWarnings.filter(w => w !== "MISSING_EXCHANGE");
      evidenceNotes.push(`Inferred exchange as HOSE for known ticker ${ticker}.`);
  }
  if (priceUnit === "vnd_per_share") {
      newWarnings = newWarnings.filter(w => w !== "MISSING_PRICE_UNIT");
      evidenceNotes.push("Inferred priceUnit as vnd_per_share based on known provider behavior.");
  }
  if (volumeUnit === "shares") {
      newWarnings = newWarnings.filter(w => w !== "MISSING_VOLUME_UNIT");
      evidenceNotes.push("Inferred volumeUnit as shares based on known provider behavior.");
  }

  // We explicitly do NOT remove MISSING_ADJUSTMENT_EVIDENCE because we don't have proof.
  
  return {
      sourceLabel: "vnstock_market_price_candidate",
      providerType: "undocumented_provider",
      dataMode: "candidate_provider_data",
      productionApproved: false,
      needsReview: true, 
      currency,
      exchange,
      priceUnit,
      volumeUnit,
      adjustmentStatus: "needs_review", // Cannot assume adjusted/unadjusted
      warningCodes: newWarnings,
      evidenceNotes
  };
}
