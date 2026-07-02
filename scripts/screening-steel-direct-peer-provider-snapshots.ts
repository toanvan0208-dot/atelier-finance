export type ProviderSnapshotMetricCode = "pe" | "pb" | "liquidity" | "closePrice";

export type ProviderSnapshotMetric = {
  ticker: "HSG" | "NKG";
  metricCode: ProviderSnapshotMetricCode;
  value: number | null;
  unit: "ratio" | "vnd" | "shares" | "vnd_trading_value";
  periodType: "market_snapshot";
  snapshotDate: string | null;
  nearestTradingDate: string | null;
  sourceLabel: "VNStock";
  sourceType: "provider_snapshot";
  retrievedAt: string | null;
  providerDefinitionKnown: boolean;
  extractedQuote: null;
  reviewNote: string;
  warningCodes: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
  staleAfterDays: 1 | 7;
  refreshPolicy: "manual_or_provider_refresh";
};

export type ProviderSnapshotPackage = {
  ticker: "HSG" | "NKG";
  coverageLevel: "screening_candidate";
  screeningEligible: true;
  analysisEligible: false;
  providerSnapshotSource: "VNStock";
  metrics: Record<ProviderSnapshotMetricCode, ProviderSnapshotMetric>;
};

const TODAY = "2026-07-02";

const missingProviderSnapshotMetric = ({
  ticker,
  metricCode,
  unit,
  reviewNote,
}: {
  ticker: "HSG" | "NKG";
  metricCode: ProviderSnapshotMetricCode;
  unit: ProviderSnapshotMetric["unit"];
  reviewNote: string;
}): ProviderSnapshotMetric => ({
  ticker,
  metricCode,
  value: null,
  unit,
  periodType: "market_snapshot",
  snapshotDate: null,
  nearestTradingDate: null,
  sourceLabel: "VNStock",
  sourceType: "provider_snapshot",
  retrievedAt: null,
  providerDefinitionKnown: false,
  extractedQuote: null,
  reviewNote,
  warningCodes: [
    "VNSTOCK_PROVIDER_SNAPSHOT_RESEARCH_ONLY",
    "PROVIDER_FETCH_NOT_ATTEMPTED",
    "SNAPSHOT_VALUE_MISSING",
    "NEEDS_MANUAL_REVIEW",
  ],
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
  staleAfterDays: 1,
  refreshPolicy: "manual_or_provider_refresh",
});

const createProviderSnapshotPackage = (ticker: "HSG" | "NKG"): ProviderSnapshotPackage => ({
  ticker,
  coverageLevel: "screening_candidate",
  screeningEligible: true,
  analysisEligible: false,
  providerSnapshotSource: "VNStock",
  metrics: {
    pe: missingProviderSnapshotMetric({
      ticker,
      metricCode: "pe",
      unit: "ratio",
      reviewNote:
        `Phase 151G accepts VNStock P/E only as a dated market snapshot for ${ticker}; no safe HSG/NKG VNStock fetch path was available on ${TODAY}.`,
    }),
    pb: missingProviderSnapshotMetric({
      ticker,
      metricCode: "pb",
      unit: "ratio",
      reviewNote:
        `Phase 151G accepts VNStock P/B only as a dated market snapshot for ${ticker}; no safe HSG/NKG VNStock fetch path was available on ${TODAY}.`,
    }),
    liquidity: missingProviderSnapshotMetric({
      ticker,
      metricCode: "liquidity",
      unit: "vnd_trading_value",
      reviewNote:
        `Phase 151G accepts VNStock liquidity only as a dated market snapshot for ${ticker}; no safe HSG/NKG VNStock fetch path was available on ${TODAY}.`,
    }),
    closePrice: missingProviderSnapshotMetric({
      ticker,
      metricCode: "closePrice",
      unit: "vnd",
      reviewNote:
        `Close price may support provider snapshot metadata for ${ticker}, but no safe HSG/NKG VNStock fetch path was available on ${TODAY}.`,
    }),
  },
});

export const steelDirectPeerProviderSnapshotPackages: ProviderSnapshotPackage[] = [
  createProviderSnapshotPackage("HSG"),
  createProviderSnapshotPackage("NKG"),
];
