import {
  buildSteelDirectPeerProviderSnapshotPackages,
  type ProviderSnapshotMetric,
  type ProviderSnapshotMetricCode,
  type ProviderSnapshotPackage,
  type ScreeningSnapshotTicker,
} from "./screening-steel-direct-peer-provider-snapshots";
import { steelDirectPeerScreeningPackages } from "./screening-steel-direct-peer-reviewed-sources";

type HsgPeGapStatus = "closed_by_vnstock_fundamental_ratio_snapshot" | "still_missing" | "blocked";
type MetricAvailabilityStatus = "available" | "closed_by_provider_snapshot" | "missing" | "blocked";

const ALLOWED_TICKERS = ["HSG", "NKG"] as const;
const MARKET_SNAPSHOT_METRICS = ["pe", "pb", "liquidity"] as const;
const MISSING_SOURCE_GAPS_BEFORE = ["HSG_PE"] as const;
const PROVIDER_SNAPSHOT_WARNING = "VNSTOCK_PROVIDER_SNAPSHOT_RESEARCH_ONLY";
const FUNDAMENTAL_RATIO_PROVIDER_WARNING = "PROVIDER_SNAPSHOT";

const forbiddenAdviceTerms = [
  "buy",
  "sell",
  "hold",
  "target price",
  "fair value",
  "upside",
  "downside",
  "ranking",
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

const isAllowedTicker = (ticker: string): ticker is ScreeningSnapshotTicker =>
  ALLOWED_TICKERS.includes(ticker as ScreeningSnapshotTicker);

const providerMetricFor = (
  packages: ProviderSnapshotPackage[],
  ticker: ScreeningSnapshotTicker,
  metricCode: ProviderSnapshotMetricCode,
): ProviderSnapshotMetric | null => packages.find((pkg) => pkg.ticker === ticker)?.metrics[metricCode] ?? null;

const providerMetricHasWriteEligibleMetadata = (metric: ProviderSnapshotMetric): boolean =>
  metric.value !== null &&
  Number.isFinite(metric.value) &&
  (metric.periodType === "market_snapshot" || metric.periodType === "provider_ratio_snapshot") &&
  Boolean(metric.snapshotDate ?? metric.nearestTradingDate ?? metric.providerPeriod) &&
  Boolean(metric.retrievedAt) &&
  (metric.sourceLabel === "VNStock" || metric.sourceLabel === "VNStock Fundamental equity ratio") &&
  metric.sourceType === "provider_snapshot" &&
  (metric.warningCodes.includes(PROVIDER_SNAPSHOT_WARNING) ||
    metric.warningCodes.includes(FUNDAMENTAL_RATIO_PROVIDER_WARNING)) &&
  metric.productionApproved === false &&
  metric.needsReview === true;

const providerMetricClosesMarketSnapshotGap = (metric: ProviderSnapshotMetric | null): boolean => {
  if (!metric) return false;
  if (!providerMetricHasWriteEligibleMetadata(metric)) return false;
  if (metric.metricCode === "pe" && metric.unit !== "ratio") return false;
  if (metric.metricCode === "pb" && metric.unit !== "ratio") return false;
  if (metric.metricCode === "liquidity" && metric.unit !== "shares" && metric.unit !== "vnd_trading_value") {
    return false;
  }
  return true;
};

const reviewedMetricAvailable = (
  ticker: ScreeningSnapshotTicker,
  metricCode: keyof (typeof steelDirectPeerScreeningPackages)[number]["metrics"],
): boolean =>
  steelDirectPeerScreeningPackages.some((pkg) => pkg.ticker === ticker && pkg.metrics[metricCode].value !== null);

const metricStatus = ({
  ticker,
  metricCode,
  packages,
}: {
  ticker: ScreeningSnapshotTicker;
  metricCode: "pe" | "pb" | "liquidity";
  packages: ProviderSnapshotPackage[];
}): MetricAvailabilityStatus => {
  const providerMetric = providerMetricFor(packages, ticker, metricCode);
  if (providerMetricClosesMarketSnapshotGap(providerMetric)) return "closed_by_provider_snapshot";
  if (reviewedMetricAvailable(ticker, metricCode)) return "available";
  return "missing";
};

const metricPresenceSummary = (metric: ProviderSnapshotMetric | null) => ({
  valuePresent: metric?.value !== null && metric?.value !== undefined,
  unit: metric?.unit ?? null,
  snapshotDate: metric?.snapshotDate ?? null,
  nearestTradingDate: metric?.nearestTradingDate ?? null,
  providerDefinitionKnown: metric?.providerDefinitionKnown ?? false,
  warningCodes: metric?.warningCodes ?? [],
  providerPeriod: metric?.providerPeriod ?? null,
  sourceLabel: metric?.sourceLabel ?? null,
  value: metric?.value ?? null,
});

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

const validateProviderSnapshots = (packages: ProviderSnapshotPackage[]) => {
  let productionApprovedTrueCount = 0;
  let forbiddenAdviceDetected = false;
  let benchmarkCreated = false;

  if (packages.length !== 2) throw new Error("Expected exactly HSG and NKG provider snapshot packages.");

  for (const pkg of packages) {
    if (!isAllowedTicker(pkg.ticker)) throw new Error(`Only HSG and NKG provider packages are allowed. Found: ${pkg.ticker}`);
    if (pkg.coverageLevel !== "screening_candidate") throw new Error("Provider package coverageLevel must be screening_candidate");
    if (!pkg.screeningEligible) throw new Error("Provider package screeningEligible must be true");
    if (pkg.analysisEligible) throw new Error("Provider package analysisEligible must be false");

    for (const metricCode of Object.keys(pkg.metrics)) {
      if (!["pe", "pb", "liquidity", "closePrice"].includes(metricCode)) {
        throw new Error(`Unsupported provider snapshot metric: ${metricCode}`);
      }
    }

    for (const metric of Object.values(pkg.metrics)) {
      if (metric.ticker !== pkg.ticker) throw new Error("Metric ticker must match package ticker");
      if (metric.sourceLabel !== "VNStock" && metric.sourceLabel !== "VNStock Fundamental equity ratio") {
        throw new Error("Provider snapshot sourceLabel must be VNStock or VNStock Fundamental equity ratio");
      }
      if (metric.sourceType !== "provider_snapshot") throw new Error("sourceType must be provider_snapshot");
      if (metric.periodType !== "market_snapshot" && metric.periodType !== "provider_ratio_snapshot") {
        throw new Error("periodType must be market_snapshot or provider_ratio_snapshot");
      }
      if (metric.dataMode !== "research_only") throw new Error("dataMode must be research_only");
      if (metric.needsReview !== true) throw new Error("needsReview must be true");
      if (metric.productionApproved !== false) productionApprovedTrueCount += 1;
      if (metric.warningCodes.length === 0) throw new Error("warningCodes must be non-empty");
      if (
        !metric.warningCodes.includes(PROVIDER_SNAPSHOT_WARNING) &&
        !metric.warningCodes.includes(FUNDAMENTAL_RATIO_PROVIDER_WARNING)
      ) {
        throw new Error("Provider snapshot warning caveat is required");
      }
      if (metric.value !== null && !Number.isFinite(metric.value)) {
        throw new Error("Provider snapshot value must be numeric or null");
      }
      if (metric.metricCode === "pe" && metric.value !== null && metric.value <= 0) {
        throw new Error("P/E must be null/N/A when EPS is non-positive or P/E is non-positive");
      }
      if (metric.value !== null && (!metric.retrievedAt || !(metric.snapshotDate ?? metric.nearestTradingDate ?? metric.providerPeriod))) {
        throw new Error("Non-null provider snapshot metrics require retrievedAt and snapshotDate/nearestTradingDate/providerPeriod");
      }
      if (metric.metricCode === "pe" && metric.value !== null && metric.unit !== "ratio") {
        throw new Error("P/E unit must be ratio");
      }
      if (metric.metricCode === "pb" && metric.value !== null && metric.unit !== "ratio") {
        throw new Error("P/B unit must be ratio");
      }
      if (metric.metricCode !== "pe" && metric.extractedQuote !== null) {
        throw new Error("extractedQuote must remain null unless exact reviewed text exists");
      }

      const text = `${metric.reviewNote} ${metric.warningCodes.join(" ")}`;
      forbiddenAdviceDetected ||= textContainsAny(text, forbiddenAdviceTerms);
      benchmarkCreated ||= textContainsAny(text, benchmarkTerms);
    }
  }

  return { forbiddenAdviceDetected, benchmarkCreated, productionApprovedTrueCount };
};

async function main() {
  console.log("Starting Phase 151K: HSG_PE VNStock Fundamental Ratio Snapshot Closure Dry Run...");

  const { packages, fetchResults, ratioFetchResults } = await buildSteelDirectPeerProviderSnapshotPackages();
  const candidateValidation = validateCandidatePackages();
  const providerValidation = validateProviderSnapshots(packages);

  const cfoHasWriteEligibleMetadata = (ticker: string) => {
    const pkg = steelDirectPeerScreeningPackages.find((p) => p.ticker === ticker);
    if (!pkg) return false;
    const cfo = pkg.metrics.cfo;
    if (cfo.value === null) return false;
    if (cfo.dataQuality.dataMode !== "research_only") return false;
    if (cfo.dataQuality.needsReview !== true) return false;
    if (cfo.dataQuality.productionApproved !== false) return false;
    if (cfo.dataQuality.sourceType !== "user_uploaded_consolidated_financial_statement" && cfo.dataQuality.sourceType !== "user_uploaded_annual_report") return false;
    if (!cfo.dataQuality.warningCodes.includes("CONSOLIDATED_CASH_FLOW")) return false;
    return true;
  };

  const providerFetchAttempted = fetchResults.some((result) => result.attempted);
  const providerFetchSucceeded = fetchResults.some((result) => result.succeeded);
  const fundamentalRatioFetchAttempted = ratioFetchResults.some((result) => result.attempted);
  const fundamentalRatioFetchSucceeded = ratioFetchResults.some((result) => result.succeeded);
  const hsgPeClosed = providerMetricClosesMarketSnapshotGap(providerMetricFor(packages, "HSG", "pe"));
  const hsgPeMetric = providerMetricFor(packages, "HSG", "pe");
  const hsgPeGapStatus: HsgPeGapStatus = hsgPeClosed ? "closed_by_vnstock_fundamental_ratio_snapshot" : "still_missing";
  const nkgPeStatus = metricStatus({ ticker: "NKG", metricCode: "pe", packages });
  const hsgPbStatus = metricStatus({ ticker: "HSG", metricCode: "pb", packages });
  const nkgPbStatus = metricStatus({ ticker: "NKG", metricCode: "pb", packages });
  const hsgLiquidityStatus = metricStatus({ ticker: "HSG", metricCode: "liquidity", packages });
  const nkgLiquidityStatus = metricStatus({ ticker: "NKG", metricCode: "liquidity", packages });
  
  const hsgCfoClosed = cfoHasWriteEligibleMetadata("HSG");
  const nkgCfoClosed = cfoHasWriteEligibleMetadata("NKG");
  const hsgCfoGapStatus = hsgCfoClosed ? "closed_by_manual_consolidated_source" : "open_manual_source_required";
  const nkgCfoGapStatus = nkgCfoClosed ? "closed_by_manual_consolidated_source" : "open_manual_source_required";

  const closedSourceGaps = hsgPeClosed ? ["HSG_PE"] : [];
  const remainingSourceGaps = MISSING_SOURCE_GAPS_BEFORE.filter((gap) => !closedSourceGaps.includes(gap));
  const readyForConfirmWrite = false;
  const readyForPartialScreeningConfirmWrite =
    hsgPeClosed &&
    hsgCfoClosed &&
    nkgCfoClosed &&
    (nkgPeStatus === "available" || nkgPeStatus === "closed_by_provider_snapshot") &&
    hsgPbStatus !== "missing" &&
    nkgPbStatus !== "missing" &&
    hsgLiquidityStatus !== "missing" &&
    nkgLiquidityStatus !== "missing";

  const productionApprovedTrueCount =
    candidateValidation.productionApprovedTrueCount + providerValidation.productionApprovedTrueCount;
  const forbiddenAdviceDetected = providerValidation.forbiddenAdviceDetected;
  const benchmarkCreated = providerValidation.benchmarkCreated;

  if (productionApprovedTrueCount !== 0) throw new Error("productionApproved must remain false");
  if (forbiddenAdviceDetected) throw new Error("Forbidden advice wording detected");
  if (benchmarkCreated) throw new Error("Benchmark wording detected");

  const result = {
    phase: "151K",
    candidateTickers: asCsv(candidateValidation.candidateTickers),
    fundamentalRatioFetchAttempted,
    fundamentalRatioFetchSucceeded,
    fundamentalRatioFetchErrorSummaries: ratioFetchResults
      .filter((result) => result.errorSummary)
      .map((result) => `${result.ticker}:${result.errorSummary}`)
      .join(";"),
    providerFetchAttempted,
    providerFetchSucceeded,
    providerFetchErrorSummaries: fetchResults
      .filter((result) => result.errorSummary)
      .map((result) => `${result.ticker}:${result.errorSummary}`)
      .join(";"),
    providerSnapshotSource: "VNStock Fundamental equity ratio",
    hsgPeSourceLoaded: hsgPeClosed,
    hsgPeValue: hsgPeMetric?.value ?? null,
    hsgPeProviderPeriod: hsgPeMetric?.providerPeriod ?? null,
    marketSnapshotMetricsValidated: asCsv(MARKET_SNAPSHOT_METRICS),
    providerSnapshotMetricSummary: {
      HSG: {
        pe: metricPresenceSummary(providerMetricFor(packages, "HSG", "pe")),
        pb: metricPresenceSummary(providerMetricFor(packages, "HSG", "pb")),
        liquidity: metricPresenceSummary(providerMetricFor(packages, "HSG", "liquidity")),
        closePrice: metricPresenceSummary(providerMetricFor(packages, "HSG", "closePrice")),
      },
      NKG: {
        pe: metricPresenceSummary(providerMetricFor(packages, "NKG", "pe")),
        pb: metricPresenceSummary(providerMetricFor(packages, "NKG", "pb")),
        liquidity: metricPresenceSummary(providerMetricFor(packages, "NKG", "liquidity")),
        closePrice: metricPresenceSummary(providerMetricFor(packages, "NKG", "closePrice")),
      },
    },
    hsgPeGapStatus,
    nkgPeStatus,
    hsgPbStatus,
    nkgPbStatus,
    hsgLiquidityStatus,
    nkgLiquidityStatus,
    cfoSourceBoundaryEnforced: true,
    hsgCfoGapStatus,
    nkgCfoGapStatus,
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
