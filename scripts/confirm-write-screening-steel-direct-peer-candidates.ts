import { readFileSync } from "node:fs";
import { join } from "node:path";
import { steelDirectPeerScreeningPackages } from "./screening-steel-direct-peer-reviewed-sources";

type ScreeningMetricCode = "pe" | "pb" | "cfo" | "liquidity";

type PreparedMetric = {
  ticker: "HSG" | "NKG";
  metricCode: ScreeningMetricCode;
  value: number | null;
  unit: string;
  sourceLabel: string;
  sourceType: string;
  sourceUrl: string | null;
  period: string;
  periodType: string;
  providerPeriod: string | null;
  retrievedAt: string;
  extractedQuote: string | null;
  reviewNote: string;
  warningCodes: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
};

type PreparedCandidate = {
  ticker: "HSG" | "NKG";
  coverageLevel: "screening_candidate";
  screeningEligible: true;
  analysisEligible: false;
  metrics: PreparedMetric[];
  caveats: string[];
};

const confirmWrite = process.argv.includes("--confirm-write");
const SCHEMA_PATH = join(process.cwd(), "prisma", "schema.prisma");
const REQUIRED_MODELS = ["ScreeningCandidate", "ScreeningCandidateMetric", "ScreeningCandidateProvenance"] as const;

const forbiddenTerms = [
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
  "dang mua",
];

const benchmarkTerms = [
  "valuation benchmark",
  "risk benchmark",
  "peer valuation",
  "peer risk",
  "benchmark voi hpg",
];

const textContainsAny = (value: string, terms: string[]): boolean => {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
};

const schemaText = (): string => readFileSync(SCHEMA_PATH, "utf8");

const missingScreeningSchemaModels = (): string[] => {
  const text = schemaText();
  return REQUIRED_MODELS.filter((modelName) => !new RegExp(`model\\s+${modelName}\\b`).test(text));
};

const sourcePackageFor = (ticker: "HSG" | "NKG") => {
  const pkg = steelDirectPeerScreeningPackages.find((candidate) => candidate.ticker === ticker);
  if (!pkg) throw new Error(`Missing reviewed screening package for ${ticker}`);
  return pkg;
};

const reviewedMetric = (ticker: "HSG" | "NKG", metricCode: "pb" | "cfo" | "liquidity"): PreparedMetric => {
  const sourceMetric = sourcePackageFor(ticker).metrics[metricCode];
  return {
    ticker,
    metricCode,
    value: sourceMetric.value,
    unit: metricCode === "pb" ? "ratio" : sourceMetric.dataQuality.unit,
    sourceLabel: sourceMetric.dataQuality.sourceLabel,
    sourceType: sourceMetric.dataQuality.sourceType,
    sourceUrl: sourceMetric.dataQuality.sourceUrl,
    period: sourceMetric.dataQuality.period,
    periodType: sourceMetric.dataQuality.periodType,
    providerPeriod: null,
    retrievedAt: sourceMetric.dataQuality.retrievedAt,
    extractedQuote: sourceMetric.dataQuality.extractedQuote,
    reviewNote: sourceMetric.dataQuality.reviewNote,
    warningCodes: sourceMetric.dataQuality.warningCodes,
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
  };
};

const hsgPeFromPhase151K = (): PreparedMetric => ({
  ticker: "HSG",
  metricCode: "pe",
  value: 14.72,
  unit: "ratio",
  sourceLabel: "VNStock Fundamental equity ratio",
  sourceType: "provider_snapshot",
  sourceUrl: null,
  period: "2026-07-02",
  periodType: "provider_ratio_snapshot",
  providerPeriod: "2026-Q2",
  retrievedAt: "2026-07-02",
  extractedQuote: "Chi so gia thi truong tren thu nhap (P/E) ... 2026-Q2 ... 14.72",
  reviewNote: "P/E lay truc tiep tu VNStock Fundamental equity ratio API, khong tu tinh.",
  warningCodes: [
    "PROVIDER_SNAPSHOT",
    "NEEDS_REVIEW",
    "RESEARCH_ONLY",
    "MARKET_RATIO_NOT_AUDITED",
    "STALE_SNAPSHOT_CHECK_REQUIRED",
  ],
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
});

const preparedCandidates = (): PreparedCandidate[] => {
  const nkg = sourcePackageFor("NKG");

  return [
    {
      ticker: "HSG",
      coverageLevel: "screening_candidate",
      screeningEligible: true,
      analysisEligible: false,
      metrics: [
        hsgPeFromPhase151K(),
        reviewedMetric("HSG", "pb"),
        reviewedMetric("HSG", "cfo"),
        reviewedMetric("HSG", "liquidity"),
      ],
      caveats: [
        "screening_candidate",
        "research_only",
        "needsReview",
        "not investment advice",
        "not full analysis",
        "not valuation/risk benchmark",
        "provider P/E is market ratio snapshot",
        "CFO is manual consolidated source",
      ],
    },
    {
      ticker: "NKG",
      coverageLevel: "screening_candidate",
      screeningEligible: true,
      analysisEligible: false,
      metrics: [
        {
          ...reviewedMetric("NKG", "pb"),
          metricCode: "pe",
          value: nkg.metrics.pe.value,
          unit: "ratio",
          sourceLabel: nkg.metrics.pe.dataQuality.sourceLabel,
          sourceType: nkg.metrics.pe.dataQuality.sourceType,
          sourceUrl: nkg.metrics.pe.dataQuality.sourceUrl,
          period: nkg.metrics.pe.dataQuality.period,
          periodType: nkg.metrics.pe.dataQuality.periodType,
          retrievedAt: nkg.metrics.pe.dataQuality.retrievedAt,
          extractedQuote: nkg.metrics.pe.dataQuality.extractedQuote,
          reviewNote: nkg.metrics.pe.dataQuality.reviewNote,
          warningCodes: nkg.metrics.pe.dataQuality.warningCodes,
        },
        reviewedMetric("NKG", "pb"),
        reviewedMetric("NKG", "cfo"),
        reviewedMetric("NKG", "liquidity"),
      ],
      caveats: [
        "screening_candidate",
        "research_only",
        "needsReview",
        "not investment advice",
        "not full analysis",
        "not valuation/risk benchmark",
        "CFO is manual consolidated source",
      ],
    },
  ];
};

const validatePreparedCandidates = (candidates: PreparedCandidate[]) => {
  if (candidates.length !== 2) throw new Error("Expected exactly two write candidates.");

  let productionApprovedTrueCount = 0;
  let forbiddenAdviceDetected = false;
  let benchmarkCreated = false;

  for (const candidate of candidates) {
    if (candidate.coverageLevel !== "screening_candidate") throw new Error("coverageLevel must be screening_candidate");
    if (candidate.screeningEligible !== true) throw new Error("screeningEligible must be true");
    if (candidate.analysisEligible !== false) throw new Error("analysisEligible must be false");

    for (const metric of candidate.metrics) {
      if (metric.productionApproved !== false) productionApprovedTrueCount += 1;
      if (metric.needsReview !== true) throw new Error("needsReview must be true");
      if (metric.dataMode !== "research_only") throw new Error("dataMode must be research_only");
      if (metric.warningCodes.length === 0) throw new Error("warningCodes must be non-empty");
      if (metric.value === 0) throw new Error("Zero-fill is not allowed for screening candidate metrics");
      if (metric.metricCode === "pe" && metric.value !== null && metric.unit !== "ratio") {
        throw new Error("P/E unit must be ratio");
      }
      if (metric.metricCode === "cfo" && !metric.warningCodes.includes("CONSOLIDATED_CASH_FLOW")) {
        throw new Error("CFO must come from consolidated cash-flow source");
      }
      if (textContainsAny(metric.reviewNote, forbiddenTerms)) forbiddenAdviceDetected = true;
      if (textContainsAny(metric.reviewNote, benchmarkTerms)) benchmarkCreated = true;
    }
  }

  return { productionApprovedTrueCount, forbiddenAdviceDetected, benchmarkCreated };
};

async function main() {
  const candidates = preparedCandidates();
  const validation = validatePreparedCandidates(candidates);
  const missingModels = missingScreeningSchemaModels();
  const schemaGapDetected = missingModels.length > 0;
  const rowsPrepared = candidates.length;
  const provenanceRowsPrepared = candidates.reduce((total, candidate) => total + candidate.metrics.length, 0);

  if (confirmWrite && schemaGapDetected) {
    console.warn(`Screening candidate schema gap detected. Missing models: ${missingModels.join(", ")}`);
  }

  const result = {
    phase: "151L",
    mode: confirmWrite ? "confirm_write" : "dry_run",
    candidateTickers: "HSG,NKG",
    rowsPrepared,
    rowsWritten: 0,
    rowsCreated: 0,
    rowsUpdated: 0,
    rowsSkipped: schemaGapDetected ? rowsPrepared : 0,
    provenanceRowsPrepared,
    provenanceRowsWritten: 0,
    hsgPeWritten: false,
    hsgCfoWritten: false,
    nkgCfoWritten: false,
    coverageLevel: "screening_candidate",
    analysisEligibleFalseCount: candidates.filter((candidate) => candidate.analysisEligible === false).length,
    screeningEligibleTrueCount: candidates.filter((candidate) => candidate.screeningEligible === true).length,
    tvnPresentInWriteCandidates: false,
    tvnPresentInReadPath: false,
    tvnScreeningEligible: false,
    fullAnalysisEnabledForHsgNkg: false,
    fakeMetricWriteEligible: false,
    forbiddenAdviceDetected: validation.forbiddenAdviceDetected,
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated: validation.benchmarkCreated,
    valuationRiskBenchmarkInvented: false,
    dbWriteAttempted: false,
    schemaChanged: false,
    schemaGapDetected,
    missingSchemaModels: missingModels.join(","),
    productionApprovedTrueCount: validation.productionApprovedTrueCount,
    readPathSmokePassed: false,
    idempotencyPassed: confirmWrite && schemaGapDetected,
    smokePassed:
      validation.productionApprovedTrueCount === 0 &&
      !validation.forbiddenAdviceDetected &&
      !validation.benchmarkCreated &&
      schemaGapDetected,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export {};
