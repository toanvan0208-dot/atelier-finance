import "dotenv/config";

import { loadFinancialsRuntimeData } from "../src/features/financials/lib/load-financials-runtime-data";
import { loadIndustryTaxonomyRuntimeByTicker } from "../src/features/industry/lib/load-industry-context";
import { prisma } from "../src/lib/database/client";
import { getLatestMarketPrice } from "../src/lib/database/services/market-price-service";

type CoreTicker = "FPT" | "HPG" | "VNM" | "MSN" | "MWG" | "VCB";
type CoverageLevel = "full_analysis_candidate" | "screening_candidate" | "missing_safe";
type MetricCode =
  | "PE"
  | "PB"
  | "CFO"
  | "LIQUIDITY"
  | "CLOSE_PRICE"
  | "EPS"
  | "SHARES_OUTSTANDING"
  | "TOTAL_DEBT";

type PreparedMetric = {
  ticker: CoreTicker;
  metricCode: MetricCode;
  value: number | null;
  unit: string | null;
  period: string | null;
  periodType: string | null;
  providerPeriod: string | null;
  snapshotDate: string | null;
  fiscalYearEnd: string | null;
  sourceType: string;
  sourceLabel: string;
  sourceUrl: string | null;
  extractedQuote: string | null;
  reviewNote: string;
  warningCodes: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
};

type PreparedCandidate = {
  ticker: CoreTicker;
  companyName: string | null;
  industryCode: string | null;
  peerRole: string | null;
  coverageLevel: CoverageLevel;
  screeningEligible: boolean;
  analysisEligible: boolean;
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
  warningCodes: string[];
  caveats: string[];
  metrics: PreparedMetric[];
  missingFields: string[];
};

type BuildMetricInput = Omit<
  PreparedMetric,
  "providerPeriod" | "extractedQuote" | "dataMode" | "needsReview" | "productionApproved" | "snapshotDate" | "fiscalYearEnd" | "sourceUrl"
> & {
  snapshotDate?: string | null;
  fiscalYearEnd?: string | null;
  sourceUrl?: string | null;
};

const phase = "151R";
const coreTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"] as const;
const blockedTickers = ["TVN"] as const;

const forbiddenAdviceTerms = [
  "buy",
  "sell",
  "hold",
  "target price",
  "fair value",
  "upside",
  "downside",
  "attractive",
  "worth buying",
  "stock is good",
  "stock is bad",
  "co phieu tot",
  "co phieu xau",
  "co phieu hap dan",
  "dang mua",
  "mua",
  "ban",
  "nam giu",
  "gia muc tieu",
  "gia tri hop ly",
  "tiem nang tang gia",
];

const blockedBenchmarkTerms = [
  "ranking",
  "scoring",
  "score",
  "peer valuation",
  "peer risk",
  "stock attractiveness",
  "benchmark eligible",
  "used as benchmark",
  "create benchmark",
];

const numberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    const parsed = Number(value.toNumber());
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const dateToIsoDate = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const containsAny = (text: string, terms: string[]): boolean => {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
};

const sourceLabelForMissing = "local_runtime_read_path_missing_safe";

const buildMetric = ({
  ticker,
  metricCode,
  value,
  unit,
  period,
  periodType,
  sourceType,
  sourceLabel,
  sourceUrl = null,
  snapshotDate = null,
  fiscalYearEnd = null,
  reviewNote,
  warningCodes,
}: BuildMetricInput): PreparedMetric => ({
  ticker,
  metricCode,
  value,
  unit,
  period,
  periodType,
  providerPeriod: null,
  snapshotDate,
  fiscalYearEnd,
  sourceType,
  sourceLabel,
  sourceUrl,
  extractedQuote: null,
  reviewNote,
  warningCodes,
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
});

const missingMetric = (ticker: CoreTicker, metricCode: MetricCode, reason: string): PreparedMetric =>
  buildMetric({
    ticker,
    metricCode,
    value: null,
    unit: null,
    period: null,
    periodType: null,
    sourceType: "missing_safe",
    sourceLabel: sourceLabelForMissing,
    reviewNote: reason,
    warningCodes: ["MISSING_SAFE", "NEEDS_REVIEW", "NO_ZERO_FILL", "RESEARCH_ONLY"],
  });

const metricFromFinancials = ({
  ticker,
  metricCode,
  value,
  unit,
  period,
  periodType,
  fiscalYearEnd,
  sourceLabel,
}: {
  ticker: CoreTicker;
  metricCode: Extract<MetricCode, "CFO" | "EPS" | "SHARES_OUTSTANDING" | "TOTAL_DEBT">;
  value: number | null;
  unit: string;
  period: string | null;
  periodType: string | null;
  fiscalYearEnd: string | null;
  sourceLabel: string;
}): PreparedMetric =>
  value === null
    ? missingMetric(ticker, metricCode, `${metricCode} is not available in the local financials runtime read-path.`)
    : buildMetric({
        ticker,
        metricCode,
        value,
        unit,
        period,
        periodType,
        fiscalYearEnd,
        sourceType: "local_financials_runtime",
        sourceLabel,
        reviewNote: `${metricCode} is prepared from the existing local financials runtime read-path; this remains research_only and needs review.`,
        warningCodes: ["LOCAL_RUNTIME_SOURCE", "RESEARCH_ONLY", "NEEDS_REVIEW", "PRODUCTION_APPROVED_FALSE"],
      });

const missingFieldsForMetrics = (metrics: PreparedMetric[]): string[] =>
  metrics.filter((metric) => metric.value === null).map((metric) => metric.metricCode);

const determineCoverageLevel = ({
  ticker,
  companyFound,
  financialsDbBacked,
  missingFields,
}: {
  ticker: CoreTicker;
  companyFound: boolean;
  financialsDbBacked: boolean;
  missingFields: string[];
}): CoverageLevel => {
  if (ticker === "VCB") return "missing_safe";
  if (companyFound && financialsDbBacked && missingFields.length === 0) return "full_analysis_candidate";
  if (companyFound || financialsDbBacked || missingFields.length < 8) return "screening_candidate";
  return "missing_safe";
};

const prepareCandidate = async (ticker: CoreTicker): Promise<PreparedCandidate> => {
  const [company, taxonomy, financials, marketPrice] = await Promise.all([
    prisma.company.findFirst({
      where: {
        ticker,
        dataMode: "research_only",
      },
      orderBy: { updatedAt: "desc" },
    }),
    loadIndustryTaxonomyRuntimeByTicker(ticker),
    loadFinancialsRuntimeData({ ticker, preferDb: true, allowFallback: false }),
    getLatestMarketPrice(ticker, { dataMode: "research_only" }),
  ]);

  const snapshot = financials.statementSnapshot;
  const financialsDbBacked = financials.runtimeStatus === "db_backed" && !financials.source.fallbackUsed && Boolean(snapshot);
  const sourceLabel = financialsDbBacked ? financials.source.sourceLabel : sourceLabelForMissing;
  const period = snapshot?.period ?? financials.source.fiscalYear?.toString() ?? null;
  const periodType = snapshot?.periodType ?? financials.source.periodType ?? null;
  const fiscalYearEnd = financials.source.asOf ? dateToIsoDate(financials.source.asOf) : null;

  const cfo = numberOrNull(snapshot?.operatingCashFlow);
  const eps = numberOrNull(snapshot?.eps);
  const sharesOutstanding = numberOrNull(snapshot?.sharesOutstanding);
  const totalDebt = numberOrNull(snapshot?.totalDebt);
  const bvps = numberOrNull(snapshot?.bvps);
  const closePrice = numberOrNull(marketPrice?.closePrice ?? snapshot?.closePrice);
  const tradingValue = numberOrNull(marketPrice?.tradingValue);

  const canDerivePe = closePrice !== null && eps !== null && eps > 0;
  const canDerivePb = closePrice !== null && bvps !== null && bvps > 0;

  const metrics: PreparedMetric[] = [
    canDerivePe
      ? buildMetric({
          ticker,
          metricCode: "PE",
          value: closePrice / eps,
          unit: "ratio",
          period,
          periodType: "derived_market_snapshot",
          snapshotDate: dateToIsoDate(marketPrice?.tradingDate ?? null),
          sourceType: "derived_from_local_runtime_inputs",
          sourceLabel: `${marketPrice?.sourceLabel ?? "local_market_price"} + ${sourceLabel}`,
          reviewNote: "P/E is derived from existing local close price and EPS read-path inputs; it is not audited financial data and remains needs_review.",
          warningCodes: ["DERIVED_MARKET_RATIO", "RESEARCH_ONLY", "NEEDS_REVIEW", "NOT_AUDITED", "PRODUCTION_APPROVED_FALSE"],
        })
      : missingMetric(ticker, "PE", "P/E is null because close price or positive EPS is missing in local runtime inputs."),
    canDerivePb
      ? buildMetric({
          ticker,
          metricCode: "PB",
          value: closePrice / bvps,
          unit: "ratio",
          period,
          periodType: "derived_market_snapshot",
          snapshotDate: dateToIsoDate(marketPrice?.tradingDate ?? null),
          sourceType: "derived_from_local_runtime_inputs",
          sourceLabel: `${marketPrice?.sourceLabel ?? "local_market_price"} + ${sourceLabel}`,
          reviewNote: "P/B is derived from existing local close price and BVPS read-path inputs; it remains needs_review.",
          warningCodes: ["DERIVED_MARKET_RATIO", "RESEARCH_ONLY", "NEEDS_REVIEW", "PRODUCTION_APPROVED_FALSE"],
        })
      : missingMetric(ticker, "PB", "P/B is null because close price or positive BVPS is missing in local runtime inputs."),
    metricFromFinancials({
      ticker,
      metricCode: "CFO",
      value: cfo,
      unit: "vnd",
      period,
      periodType,
      fiscalYearEnd,
      sourceLabel,
    }),
    tradingValue !== null
      ? buildMetric({
          ticker,
          metricCode: "LIQUIDITY",
          value: tradingValue,
          unit: "vnd_trading_value",
          period: marketPrice?.period ?? null,
          periodType: marketPrice?.periodType ?? "day",
          snapshotDate: dateToIsoDate(marketPrice?.tradingDate ?? null),
          sourceType: "local_market_price_runtime",
          sourceLabel: marketPrice?.sourceLabel ?? "local_market_price",
          reviewNote: "Liquidity uses the local MarketPrice tradingValue field as a snapshot proxy, not as a ranking signal.",
          warningCodes: ["MARKET_PRICE_SNAPSHOT", "LIQUIDITY_PROXY", "RESEARCH_ONLY", "NEEDS_REVIEW", "PRODUCTION_APPROVED_FALSE"],
        })
      : missingMetric(ticker, "LIQUIDITY", "Liquidity is null because no local tradingValue snapshot is available."),
    closePrice !== null
      ? buildMetric({
          ticker,
          metricCode: "CLOSE_PRICE",
          value: closePrice,
          unit: marketPrice?.currency ? `${marketPrice.currency}_per_share` : "vnd_per_share",
          period: marketPrice?.period ?? null,
          periodType: marketPrice?.periodType ?? "day",
          snapshotDate: dateToIsoDate(marketPrice?.tradingDate ?? null),
          sourceType: "local_market_price_runtime",
          sourceLabel: marketPrice?.sourceLabel ?? "local_market_price",
          reviewNote: "Close price is a local market price snapshot and must not be treated as advice.",
          warningCodes: ["MARKET_PRICE_SNAPSHOT", "RESEARCH_ONLY", "NEEDS_REVIEW", "PRODUCTION_APPROVED_FALSE"],
        })
      : missingMetric(ticker, "CLOSE_PRICE", "Close price is null because no local market price snapshot is available."),
    metricFromFinancials({
      ticker,
      metricCode: "EPS",
      value: eps,
      unit: "vnd_per_share",
      period,
      periodType,
      fiscalYearEnd,
      sourceLabel,
    }),
    metricFromFinancials({
      ticker,
      metricCode: "SHARES_OUTSTANDING",
      value: sharesOutstanding,
      unit: "shares",
      period,
      periodType,
      fiscalYearEnd,
      sourceLabel,
    }),
    metricFromFinancials({
      ticker,
      metricCode: "TOTAL_DEBT",
      value: totalDebt,
      unit: "vnd",
      period,
      periodType,
      fiscalYearEnd,
      sourceLabel,
    }),
  ];

  const missingFields = [
    ...(company ? [] : ["company"]),
    ...(taxonomy.status === "available" ? [] : ["industryCode"]),
    ...(financialsDbBacked ? [] : ["financialsRuntime"]),
    ...missingFieldsForMetrics(metrics),
  ];
  const coverageLevel = determineCoverageLevel({
    ticker,
    companyFound: Boolean(company),
    financialsDbBacked,
    missingFields,
  });
  const screeningEligible = coverageLevel !== "missing_safe";
  const analysisEligible = coverageLevel === "full_analysis_candidate";

  return {
    ticker,
    companyName: company?.companyName ?? null,
    industryCode: taxonomy.taxonomySummary.industryCode ?? company?.industryCode ?? null,
    peerRole: null,
    coverageLevel,
    screeningEligible,
    analysisEligible,
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
    warningCodes: [
      "CORE_SCREENING_BACKFILL_DRY_RUN",
      "RESEARCH_ONLY",
      "NEEDS_REVIEW",
      "PRODUCTION_APPROVED_FALSE",
      ...(coverageLevel === "missing_safe" ? ["MISSING_SAFE"] : []),
      ...(analysisEligible ? ["FULL_ANALYSIS_CANDIDATE_REQUIRES_CONFIRM_WRITE"] : ["NOT_FULL_ANALYSIS"]),
    ],
    caveats: [
      "Screening is data-readiness only, not investment advice.",
      "This package is dry-run only and writes no database rows.",
      "Market-derived ratios are research_only and need review.",
      "Missing fields remain null and are not zero-filled.",
      "Prepared candidates are not valuation or risk benchmarks.",
    ],
    metrics,
    missingFields,
  };
};

const validatePackages = (candidates: PreparedCandidate[]) => {
  if (candidates.length !== coreTickers.length) {
    throw new Error(`Expected ${coreTickers.length} core ticker packages.`);
  }

  const tickers = candidates.map((candidate) => candidate.ticker);
  const tvnPresent = tickers.some((ticker) => blockedTickers.includes(ticker as (typeof blockedTickers)[number]));
  if (tvnPresent) throw new Error("TVN must not be present in core ticker backfill packages.");

  let productionApprovedTrueCount = 0;
  let fakeMetricWriteEligible = false;
  let forbiddenAdviceDetected = false;
  let benchmarkCreated = false;

  for (const candidate of candidates) {
    if (candidate.productionApproved) productionApprovedTrueCount += 1;
    if (candidate.needsReview !== true) throw new Error(`${candidate.ticker} must remain needsReview=true.`);
    if (candidate.dataMode !== "research_only") throw new Error(`${candidate.ticker} must remain research_only.`);
    if (candidate.warningCodes.length === 0 || candidate.caveats.length === 0) {
      throw new Error(`${candidate.ticker} warningCodes/caveats must be non-empty.`);
    }
    if (candidate.coverageLevel === "missing_safe" && candidate.analysisEligible) {
      throw new Error(`${candidate.ticker} missing_safe must not be analysisEligible.`);
    }

    const candidateText = JSON.stringify(candidate);
    forbiddenAdviceDetected ||= containsAny(candidateText, forbiddenAdviceTerms);
    benchmarkCreated ||= containsAny(candidateText, blockedBenchmarkTerms);

    for (const metric of candidate.metrics) {
      if (metric.productionApproved) productionApprovedTrueCount += 1;
      if (metric.value === 0) fakeMetricWriteEligible = true;
      if (metric.value === null && !metric.warningCodes.includes("MISSING_SAFE")) {
        throw new Error(`${candidate.ticker} ${metric.metricCode} missing value must be missing_safe.`);
      }
      if (metric.warningCodes.length === 0) throw new Error(`${candidate.ticker} ${metric.metricCode} warningCodes missing.`);
      if (metric.dataMode !== "research_only" || metric.needsReview !== true) {
        throw new Error(`${candidate.ticker} ${metric.metricCode} must remain research_only/needsReview.`);
      }
    }
  }

  return {
    productionApprovedTrueCount,
    fakeMetricWriteEligible,
    forbiddenAdviceDetected,
    benchmarkCreated,
  };
};

async function main() {
  const candidates = await Promise.all(coreTickers.map((ticker) => prepareCandidate(ticker)));
  const validation = validatePackages(candidates);
  const statusByTicker = Object.fromEntries(candidates.map((candidate) => [candidate.ticker, candidate.coverageLevel]));
  const missingFieldsByTicker = Object.fromEntries(
    candidates.map((candidate) => [candidate.ticker, candidate.missingFields.length > 0 ? candidate.missingFields : []]),
  );
  const readyTickers = candidates
    .filter((candidate) => candidate.coverageLevel !== "missing_safe" && !candidate.missingFields.includes("financialsRuntime"))
    .map((candidate) => candidate.ticker);
  const blockedTickersForWrite = candidates
    .filter((candidate) => candidate.coverageLevel === "missing_safe" || candidate.missingFields.includes("financialsRuntime"))
    .map((candidate) => candidate.ticker);
  const metricRowsPrepared = candidates.reduce((sum, candidate) => sum + candidate.metrics.length, 0);
  const readyForConfirmWrite =
    validation.productionApprovedTrueCount === 0 &&
    !validation.fakeMetricWriteEligible &&
    !validation.forbiddenAdviceDetected &&
    !validation.benchmarkCreated &&
    readyTickers.length > 0;

  const result = {
    phase,
    mode: "dry_run",
    candidateTickers: coreTickers.join(","),
    rowsPrepared: candidates.length,
    metricRowsPrepared,
    provenanceRowsPrepared: metricRowsPrepared,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    schemaChanged: false,
    productionApprovedTrueCount: validation.productionApprovedTrueCount,
    fullAnalysisCandidateCount: candidates.filter((candidate) => candidate.coverageLevel === "full_analysis_candidate").length,
    screeningCandidateCount: candidates.filter((candidate) => candidate.coverageLevel === "screening_candidate").length,
    missingSafeCount: candidates.filter((candidate) => candidate.coverageLevel === "missing_safe").length,
    tickersReadyForConfirmWrite: readyTickers,
    tickersBlocked: blockedTickersForWrite,
    missingFieldsByTicker,
    fptStatus: statusByTicker.FPT,
    hpgStatus: statusByTicker.HPG,
    vnmStatus: statusByTicker.VNM,
    msnStatus: statusByTicker.MSN,
    mwgStatus: statusByTicker.MWG,
    vcbStatus: statusByTicker.VCB,
    hsgNkgUntouched: true,
    tvnPresent: false,
    fakeMetricWriteEligible: validation.fakeMetricWriteEligible,
    forbiddenAdviceDetected: validation.forbiddenAdviceDetected,
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated: validation.benchmarkCreated,
    valuationRiskBenchmarkInvented: false,
    readyForConfirmWrite,
    smokePassed:
      validation.productionApprovedTrueCount === 0 &&
      !validation.fakeMetricWriteEligible &&
      !validation.forbiddenAdviceDetected &&
      !validation.benchmarkCreated,
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.smokePassed) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {};
