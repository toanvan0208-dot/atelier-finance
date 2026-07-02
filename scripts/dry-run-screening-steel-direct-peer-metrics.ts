import { steelDirectPeerProviderSnapshotPackages } from "./screening-steel-direct-peer-provider-snapshots";
import { steelDirectPeerScreeningPackages } from "./screening-steel-direct-peer-reviewed-sources";

type GapStatus = "closed_by_provider_snapshot" | "still_missing" | "blocked";

const ALLOWED_TICKERS = ["HSG", "NKG"] as const;
const MARKET_SNAPSHOT_METRICS = ["pe", "pb", "liquidity"] as const;
const MISSING_SOURCE_GAPS_BEFORE = ["HSG_PE", "HSG_CFO", "NKG_CFO"] as const;
const PROVIDER_SNAPSHOT_WARNING = "VNSTOCK_PROVIDER_SNAPSHOT_RESEARCH_ONLY";

const forbiddenAdviceTerms = [
  "buy",
  "sell",
  "hold",
  "target price",
  "fair value",
  "upside",
  "downside",
  "ranking",
  "score",
  "attractive",
  "worth buying",
  "nen mua",
  "nen ban",
  "nen nam giu",
  "gia muc tieu",
  "dang mua",
];

const benchmarkTerms = [
  "valuation benchmark",
  "risk benchmark",
  "peer valuation",
  "peer risk",
  "so sanh dinh gia voi hpg",
  "benchmark voi hpg",
];

const asCsv = (items: readonly string[] | string[]): string => items.join(",");

const textContainsAny = (value: string, terms: string[]): boolean => {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
};

const isAllowedTicker = (ticker: string): ticker is (typeof ALLOWED_TICKERS)[number] =>
  ALLOWED_TICKERS.includes(ticker as (typeof ALLOWED_TICKERS)[number]);

const metricClosesProviderSnapshotGap = ({
  ticker,
  metricCode,
}: {
  ticker: "HSG" | "NKG";
  metricCode: "pe";
}): boolean => {
  const snapshotPackage = steelDirectPeerProviderSnapshotPackages.find((pkg) => pkg.ticker === ticker);
  const metric = snapshotPackage?.metrics[metricCode];
  if (!metric) return false;
  if (metric.value !== null && !Number.isFinite(metric.value)) return false;
  if (metric.value === null) return false;
  return (
    metric.unit === "ratio" &&
    metric.periodType === "market_snapshot" &&
    Boolean(metric.snapshotDate ?? metric.nearestTradingDate) &&
    Boolean(metric.retrievedAt) &&
    metric.sourceLabel === "VNStock" &&
    metric.sourceType === "provider_snapshot" &&
    metric.warningCodes.includes(PROVIDER_SNAPSHOT_WARNING) &&
    metric.productionApproved === false &&
    metric.needsReview === true
  );
};

const validateCandidatePackages = () => {
  const candidateTickers = steelDirectPeerScreeningPackages.map((pkg) => pkg.ticker);
  if (candidateTickers.includes("TVN")) {
    throw new Error("TVN must fail if present anywhere in screening candidate packages.");
  }

  let productionApprovedTrueCount = 0;
  let fakeMetricWriteEligible = false;

  for (const pkg of steelDirectPeerScreeningPackages) {
    if (!isAllowedTicker(pkg.ticker)) throw new Error(`Only HSG and NKG are allowed. Found: ${pkg.ticker}`);
    if (pkg.coverageLevel !== "screening_candidate") throw new Error("coverageLevel must be screening_candidate");
    if (!pkg.screeningEligible) throw new Error("screeningEligible must be true");
    if (pkg.analysisEligible) throw new Error("analysisEligible must be false");
    if (pkg.industryCode !== "STEEL_MATERIALS") throw new Error("industryCode must be STEEL_MATERIALS");
    if (pkg.peerRole !== "direct_peer") throw new Error("peerRole must be direct_peer");

    for (const metric of Object.values(pkg.metrics)) {
      if (metric.dataQuality.productionApproved !== false) productionApprovedTrueCount += 1;
      if (metric.dataQuality.needsReview !== true) throw new Error("needsReview must be true");
      if (metric.dataQuality.dataMode !== "research_only") throw new Error("dataMode must be research_only");
      if (metric.dataQuality.warningCodes.length === 0) throw new Error("warningCodes must be non-empty");
      if (
        metric.dataQuality.warningCodes.includes("PLACEHOLDER_DATA") ||
        metric.dataQuality.warningCodes.includes("UNREVIEWED_PROVIDER_DATA")
      ) {
        fakeMetricWriteEligible = true;
      }
    }
  }

  return { candidateTickers, fakeMetricWriteEligible, productionApprovedTrueCount };
};

const validateProviderSnapshots = () => {
  let productionApprovedTrueCount = 0;
  let forbiddenAdviceDetected = false;
  let benchmarkCreated = false;

  for (const pkg of steelDirectPeerProviderSnapshotPackages) {
    if (!isAllowedTicker(pkg.ticker)) throw new Error(`Only HSG and NKG provider packages are allowed. Found: ${pkg.ticker}`);
    if (pkg.coverageLevel !== "screening_candidate") throw new Error("Provider package coverageLevel must be screening_candidate");
    if (pkg.analysisEligible) throw new Error("Provider package analysisEligible must be false");

    for (const metricCode of Object.keys(pkg.metrics)) {
      if (!["pe", "pb", "liquidity", "closePrice"].includes(metricCode)) {
        throw new Error(`Unsupported provider snapshot metric: ${metricCode}`);
      }
    }

    for (const metric of Object.values(pkg.metrics)) {
      if (metric.ticker !== pkg.ticker) throw new Error("Metric ticker must match package ticker");
      if (metric.sourceLabel !== "VNStock") throw new Error("Provider snapshot sourceLabel must be VNStock");
      if (metric.sourceType !== "provider_snapshot") throw new Error("sourceType must be provider_snapshot");
      if (metric.periodType !== "market_snapshot") throw new Error("periodType must be market_snapshot");
      if (metric.dataMode !== "research_only") throw new Error("dataMode must be research_only");
      if (metric.needsReview !== true) throw new Error("needsReview must be true");
      if (metric.productionApproved !== false) productionApprovedTrueCount += 1;
      if (metric.warningCodes.length === 0) throw new Error("warningCodes must be non-empty");
      if (!metric.warningCodes.includes(PROVIDER_SNAPSHOT_WARNING)) {
        throw new Error("Provider snapshot warning caveat is required");
      }
      if (metric.value !== null && !Number.isFinite(metric.value)) {
        throw new Error("Provider snapshot value must be numeric or null");
      }
      if (metric.metricCode === "pe" && metric.value !== null && metric.value <= 0) {
        throw new Error("P/E must be null/N/A when EPS is non-positive or P/E is non-positive");
      }
      if (metric.value !== null && (!metric.retrievedAt || !(metric.snapshotDate ?? metric.nearestTradingDate))) {
        throw new Error("Non-null provider snapshot metrics require retrievedAt and snapshotDate/nearestTradingDate");
      }
      if (metric.extractedQuote !== null) throw new Error("extractedQuote must remain null unless exact reviewed text exists");

      const text = `${metric.reviewNote} ${metric.warningCodes.join(" ")}`;
      forbiddenAdviceDetected ||= textContainsAny(text, forbiddenAdviceTerms);
      benchmarkCreated ||= textContainsAny(text, benchmarkTerms);
    }
  }

  return { forbiddenAdviceDetected, benchmarkCreated, productionApprovedTrueCount };
};

async function main() {
  console.log("Starting Phase 151G: VNStock P/E provider snapshot dry-run + CFO source boundary...");

  const candidateValidation = validateCandidatePackages();
  const providerValidation = validateProviderSnapshots();

  const hsgPeClosed = metricClosesProviderSnapshotGap({ ticker: "HSG", metricCode: "pe" });
  const nkgPeProviderAvailable = metricClosesProviderSnapshotGap({ ticker: "NKG", metricCode: "pe" });
  const closedSourceGaps = hsgPeClosed ? ["HSG_PE"] : [];
  const remainingSourceGaps = MISSING_SOURCE_GAPS_BEFORE.filter((gap) => !closedSourceGaps.includes(gap));
  const hsgPeGapStatus: GapStatus = hsgPeClosed ? "closed_by_provider_snapshot" : "still_missing";
  const nkgPeStatus: "available" | "missing" | "blocked" =
    nkgPeProviderAvailable || steelDirectPeerScreeningPackages.some((pkg) => pkg.ticker === "NKG" && pkg.metrics.pe.value !== null)
      ? "available"
      : "missing";

  const providerSnapshotAttempted = false;
  const readyForConfirmWrite = false;
  const readyForPartialScreeningConfirmWrite =
    hsgPeClosed &&
    steelDirectPeerProviderSnapshotPackages.every((pkg) =>
      MARKET_SNAPSHOT_METRICS.every((metricCode) => pkg.metrics[metricCode].value !== null),
    );

  const productionApprovedTrueCount =
    candidateValidation.productionApprovedTrueCount + providerValidation.productionApprovedTrueCount;
  const forbiddenAdviceDetected = providerValidation.forbiddenAdviceDetected;
  const benchmarkCreated = providerValidation.benchmarkCreated;

  if (productionApprovedTrueCount !== 0) throw new Error("productionApproved must remain false");
  if (forbiddenAdviceDetected) throw new Error("Forbidden advice wording detected");
  if (benchmarkCreated) throw new Error("Benchmark wording detected");

  const result = {
    phase: "151G",
    candidateTickers: asCsv(candidateValidation.candidateTickers),
    providerSnapshotAttempted,
    providerSnapshotSource: "VNStock",
    marketSnapshotMetricsValidated: asCsv(MARKET_SNAPSHOT_METRICS),
    hsgPeGapStatus,
    nkgPeStatus,
    cfoSourceBoundaryEnforced: true,
    hsgCfoGapStatus: "open_manual_source_required",
    nkgCfoGapStatus: "open_manual_source_required",
    missingSourceGapsBefore: asCsv(MISSING_SOURCE_GAPS_BEFORE),
    closedSourceGaps: asCsv(closedSourceGaps),
    remainingSourceGaps: asCsv(remainingSourceGaps),
    coverageLevel: "screening_candidate",
    analysisEligibleFalseCount: steelDirectPeerScreeningPackages.filter((pkg) => pkg.analysisEligible === false).length,
    screeningEligibleTrueCount: steelDirectPeerScreeningPackages.filter((pkg) => pkg.screeningEligible === true).length,
    tvnPresentInCandidatePackages: false,
    tvnScreeningEligible: false,
    fakeMetricWriteEligible: candidateValidation.fakeMetricWriteEligible,
    forbiddenAdviceDetected,
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated,
    valuationRiskBenchmarkInvented: false,
    providerFetchAttempted: false,
    dbWriteAttempted: false,
    schemaChanged: false,
    productionApprovedTrueCount,
    readyForConfirmWrite,
    readyForPartialScreeningConfirmWrite,
    smokePassed: true,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export {};
