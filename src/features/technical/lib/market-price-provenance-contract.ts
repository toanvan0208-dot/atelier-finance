export type ProviderType =
  | "official_exchange"
  | "licensed_vendor"
  | "public_provider"
  | "undocumented_provider"
  | "manual_reviewed"
  | "static_editorial"
  | "unsupported";

export type StalenessStatus =
  | "fresh"
  | "provider_delayed"
  | "stale"
  | "missing"
  | "unsupported"
  | "needs_review";

export type AdjustmentStatus =
  | "adjusted"
  | "unadjusted"
  | "unknown"
  | "not_applicable"
  | "needs_review";

export type DataMode =
  | "research_only"
  | "candidate_provider_data"
  | "production_provider_candidate"
  | "production_approved"
  | "sample_fallback";

export type MarketPriceProvenanceMetadataContract = {
  marketPriceId: string;
  providerName: string;
  providerType: ProviderType;
  exchange: string | null;
  stalenessStatus: StalenessStatus;
  adjustmentStatus: AdjustmentStatus;
  fallbackUsed: boolean;
  needsReview: boolean;
  importRunId: string | null;
  rawPayloadChecksum: string | null;
};

export const buildSafeMarketPriceProvenance = (
  input: Partial<MarketPriceProvenanceMetadataContract> = {},
): MarketPriceProvenanceMetadataContract => ({
  marketPriceId: input.marketPriceId ?? "unknown",
  providerName: input.providerName ?? "unknown",
  providerType: input.providerType ?? "undocumented_provider",
  exchange: input.exchange ?? null,
  stalenessStatus: input.stalenessStatus ?? "needs_review",
  adjustmentStatus: input.adjustmentStatus ?? "needs_review",
  fallbackUsed: input.fallbackUsed ?? false,
  needsReview: input.needsReview ?? true,
  importRunId: input.importRunId ?? null,
  rawPayloadChecksum: input.rawPayloadChecksum ?? null,
});
