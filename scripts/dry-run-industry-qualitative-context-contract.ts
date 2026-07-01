import {
  REVIEWED_INDUSTRY_CODES,
  REVIEWED_UNSUPPORTED_TICKERS,
} from "../src/features/industry/lib/reviewed-industry-coverage.js";

type ReviewedIndustryCode = (typeof REVIEWED_INDUSTRY_CODES)[number];

type QualitativeContextSourceType =
  | "official"
  | "company_disclosure"
  | "curated_internal"
  | "research_package_pending_review";

type QualitativeContextCandidate = {
  industryCode: ReviewedIndustryCode;
  overview: string;
  howIndustryMakesMoney: string;
  keyDrivers: string[];
  keyRisks: string[];
  macroSensitivity: string[];
  nextChecks: string[];
  commonMisread: string;
  sourceLabel: string;
  sourceUrl: string | null;
  sourceType: QualitativeContextSourceType;
  retrievedAt: string | null;
  publicationDate: string | null;
  extractedQuote: string | null;
  reviewNote: string;
  warningCodes: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
};

type CandidateValidation = {
  industryCode: ReviewedIndustryCode;
  eligible: boolean;
  blockedReasons: string[];
  warningCodes: string[];
  forbiddenAdviceDetected: boolean;
  numericBenchmarkLanguageDetected: boolean;
  unsupportedTickerContextDetected: boolean;
};

const ACCEPTED_INDUSTRY_CODES = [
  "STEEL_MATERIALS",
  "RETAIL",
  "CONSUMER_STAPLES_DAIRY",
] as const satisfies readonly ReviewedIndustryCode[];

const FORBIDDEN_ADVICE_PATTERNS = [
  /\b(buy|sell|hold)\b/i,
  /\btarget\s+price\b/i,
  /\bfair\s+value\b/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /\bworth\s+buying\b/i,
  /\battractive\s+investment\b/i,
  /\binvestment\s+(recommendation|signal|call)\b/i,
  /\btrading\s+signal\b/i,
  /\bshould\s+(buy|sell|hold)\b/i,
  /\bkhuyen\s+nghi\s+(mua|ban)\b/i,
  /\bnam\s+giu\b/i,
  /\bdang\s+mua\b/i,
  /\bhap\s+dan\b/i,
] as const;

const NUMERIC_BENCHMARK_PATTERNS = [
  /\bbenchmark\b/i,
  /\bvaluation\s+(multiple|range|comparison)\b/i,
  /\brisk\s+(score|benchmark|ranking)\b/i,
  /\bpeer\s+(valuation|risk)\b/i,
  /\bP\/E\b/i,
  /\bEV\/EBITDA\b/i,
  /\btarget\s+multiple\b/i,
  /\b\d+(?:\.\d+)?\s?%/,
  /\b\d+(?:\.\d+)?x\b/i,
] as const;

const candidateContextPackages: QualitativeContextCandidate[] = [
  {
    industryCode: "STEEL_MATERIALS",
    overview:
      "Steel and construction materials are cyclical production businesses linked to construction demand, infrastructure activity, input costs, inventory turns, and working capital.",
    howIndustryMakesMoney:
      "Companies convert raw materials and energy into steel or related materials, then earn revenue through volume, output price, product mix, and distribution efficiency.",
    keyDrivers: [
      "Construction and infrastructure demand",
      "Raw material and energy cost movement",
      "Output price versus input cost spread",
      "Inventory discipline and capacity utilization",
    ],
    keyRisks: [
      "Weak demand cycle",
      "Input cost volatility",
      "Inventory pressure when prices move quickly",
      "Working-capital strain during slow periods",
    ],
    macroSensitivity: [
      "Public investment and construction activity",
      "Credit conditions",
      "Commodity input costs",
      "Exchange-rate movement for imported inputs",
    ],
    nextChecks: [
      "Check company revenue, gross margin, inventory, operating cash flow, and debt trend.",
      "Check whether peer group rows remain context-only and not a valuation or risk comparison.",
    ],
    commonMisread:
      "A taxonomy match or peer list only says the system has reviewed context for this industry lane; it does not rank ticker quality, valuation, risk, or suitability for action.",
    sourceLabel: "Phase 150Y qualitative context package - source pending review",
    sourceUrl: null,
    sourceType: "research_package_pending_review",
    retrievedAt: null,
    publicationDate: null,
    extractedQuote: null,
    reviewNote:
      "Source package is not yet eligible: no reviewed source URL, publication date, retrieved date, or exact reviewed quote is attached in Phase 150Y.",
    warningCodes: [
      "QUALITATIVE_CONTEXT_RESEARCH_ONLY",
      "QUALITATIVE_CONTEXT_NEEDS_REVIEW",
      "SOURCE_PACKAGE_NOT_ELIGIBLE",
      "NOT_INVESTMENT_ADVICE",
      "NOT_VALUATION_OR_RISK_BENCHMARK",
    ],
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
  },
  {
    industryCode: "RETAIL",
    overview:
      "Retail businesses connect suppliers with end customers through store networks, online channels, assortment management, pricing, and service execution.",
    howIndustryMakesMoney:
      "Revenue depends on traffic, order value, store or channel footprint, product mix, supplier terms, and operating cost control.",
    keyDrivers: [
      "Household purchasing power",
      "Inventory turnover",
      "Gross margin and promotion discipline",
      "Store productivity and logistics cost",
    ],
    keyRisks: [
      "Demand slowdown",
      "Inventory mismatch",
      "Price competition",
      "Operating cost pressure",
    ],
    macroSensitivity: [
      "Inflation and disposable income",
      "Consumer credit conditions",
      "Employment and wage pressure",
      "Currency movement for imported products",
    ],
    nextChecks: [
      "Check company revenue quality, gross margin, inventory, commercial expense, finance cost, and operating cash flow.",
      "Keep peer group missing-safe until a reviewed retail peer package exists.",
    ],
    commonMisread:
      "Retail taxonomy coverage is a reviewed classification boundary only; it must not be read as a conclusion about business quality or market action.",
    sourceLabel: "Phase 150Y qualitative context package - source pending review",
    sourceUrl: null,
    sourceType: "research_package_pending_review",
    retrievedAt: null,
    publicationDate: null,
    extractedQuote: null,
    reviewNote:
      "Source package is not yet eligible: no reviewed source URL, publication date, retrieved date, or exact reviewed quote is attached in Phase 150Y.",
    warningCodes: [
      "QUALITATIVE_CONTEXT_RESEARCH_ONLY",
      "QUALITATIVE_CONTEXT_NEEDS_REVIEW",
      "SOURCE_PACKAGE_NOT_ELIGIBLE",
      "RETAIL_PEER_GROUP_MISSING_SAFE",
      "NOT_INVESTMENT_ADVICE",
      "NOT_VALUATION_OR_RISK_BENCHMARK",
    ],
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    overview:
      "Dairy and consumer staples businesses provide repeat-consumption products through brands, distribution reach, manufacturing execution, and input procurement.",
    howIndustryMakesMoney:
      "Revenue depends on product volume, pricing, channel coverage, product mix, brand strength, and cost control across raw materials, packaging, logistics, and commercial activity.",
    keyDrivers: [
      "Repeat household demand",
      "Brand and distribution strength",
      "Raw material and packaging costs",
      "Product mix and commercial expense discipline",
    ],
    keyRisks: [
      "Input cost pressure",
      "Brand competition",
      "Slower consumption growth",
      "Margin pressure from promotion or distribution costs",
    ],
    macroSensitivity: [
      "Household purchasing power",
      "Food inflation",
      "Exchange-rate movement for imported inputs",
      "Logistics and packaging costs",
    ],
    nextChecks: [
      "Check company revenue, gross margin, commercial expense, working capital, cash flow, and debt if present.",
      "Keep dairy or consumer-staples peer group missing-safe until a reviewed peer package exists.",
    ],
    commonMisread:
      "A consumer-staples or dairy label is context for reading the business model; it is not a comparative conclusion about ticker quality, valuation, risk, or suitability for action.",
    sourceLabel: "Phase 150Y qualitative context package - source pending review",
    sourceUrl: null,
    sourceType: "research_package_pending_review",
    retrievedAt: null,
    publicationDate: null,
    extractedQuote: null,
    reviewNote:
      "Source package is not yet eligible: no reviewed source URL, publication date, retrieved date, or exact reviewed quote is attached in Phase 150Y.",
    warningCodes: [
      "QUALITATIVE_CONTEXT_RESEARCH_ONLY",
      "QUALITATIVE_CONTEXT_NEEDS_REVIEW",
      "SOURCE_PACKAGE_NOT_ELIGIBLE",
      "DAIRY_PEER_GROUP_MISSING_SAFE",
      "NOT_INVESTMENT_ADVICE",
      "NOT_VALUATION_OR_RISK_BENCHMARK",
    ],
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
  },
];

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const textForCandidate = (candidate: QualitativeContextCandidate): string =>
  [
    candidate.industryCode,
    candidate.overview,
    candidate.howIndustryMakesMoney,
    ...candidate.keyDrivers,
    ...candidate.keyRisks,
    ...candidate.macroSensitivity,
    ...candidate.nextChecks,
    candidate.commonMisread,
    candidate.sourceLabel,
    candidate.sourceUrl ?? "",
    candidate.sourceType,
    candidate.retrievedAt ?? "",
    candidate.publicationDate ?? "",
    candidate.extractedQuote ?? "",
    candidate.reviewNote,
    ...candidate.warningCodes,
    candidate.dataMode,
  ].join("\n");

const hasPattern = (patterns: readonly RegExp[], value: string): boolean =>
  patterns.some((pattern) => pattern.test(value));

const validateCandidate = (candidate: QualitativeContextCandidate): CandidateValidation => {
  const candidateText = textForCandidate(candidate);
  const unsupportedTickerContextDetected = REVIEWED_UNSUPPORTED_TICKERS.some((ticker) =>
    new RegExp(`\\b${ticker}\\b`, "i").test(candidateText),
  );
  const forbiddenAdviceDetected = hasPattern(FORBIDDEN_ADVICE_PATTERNS, candidateText);
  const numericBenchmarkLanguageDetected = hasPattern(NUMERIC_BENCHMARK_PATTERNS, candidateText);
  const sourceUrlMissingButExplained =
    candidate.sourceUrl === null &&
    /not yet eligible|source package is not yet eligible/i.test(candidate.reviewNote);
  const sourceComplete = Boolean(candidate.sourceUrl && candidate.retrievedAt && candidate.publicationDate);

  const blockedReasons = unique(
    [
      ACCEPTED_INDUSTRY_CODES.includes(candidate.industryCode)
        ? null
        : "UNSUPPORTED_INDUSTRY_CODE",
      candidate.dataMode === "research_only" ? null : "DATA_MODE_NOT_RESEARCH_ONLY",
      candidate.productionApproved === false ? null : "PRODUCTION_APPROVED_TRUE_BLOCKED",
      candidate.needsReview === true ? null : "NEEDS_REVIEW_FALSE_BLOCKED",
      candidate.warningCodes.length > 0 ? null : "WARNING_CODES_MISSING",
      candidate.sourceLabel.trim().length > 0 ? null : "SOURCE_LABEL_MISSING",
      candidate.sourceType ? null : "SOURCE_TYPE_MISSING",
      candidate.sourceUrl || sourceUrlMissingButExplained ? null : "SOURCE_URL_MISSING_WITHOUT_REVIEW_NOTE",
      candidate.sourceUrl ? null : "SOURCE_URL_MISSING_BLOCKS_WRITE_READINESS",
      sourceComplete ? null : "SOURCE_PACKAGE_INCOMPLETE_BLOCKS_WRITE_READINESS",
      candidate.extractedQuote === null ? null : "EXTRACTED_QUOTE_PRESENT_WITHOUT_EXACT_REVIEW",
      forbiddenAdviceDetected ? "FORBIDDEN_ADVICE_LANGUAGE_DETECTED" : null,
      numericBenchmarkLanguageDetected ? "NUMERIC_BENCHMARK_LANGUAGE_DETECTED" : null,
      unsupportedTickerContextDetected ? "UNSUPPORTED_TICKER_CONTEXT_DETECTED" : null,
    ].filter((reason): reason is string => Boolean(reason)),
  ).sort();

  return {
    industryCode: candidate.industryCode,
    eligible: blockedReasons.length === 0,
    blockedReasons,
    warningCodes: candidate.warningCodes,
    forbiddenAdviceDetected,
    numericBenchmarkLanguageDetected,
    unsupportedTickerContextDetected,
  };
};

const validateCandidateSet = (candidates: QualitativeContextCandidate[]) => {
  const validations = candidates.map(validateCandidate);
  const acceptedIndustryCodes = candidates.map((candidate) => candidate.industryCode);
  const eligibleContextPackages = validations.filter((validation) => validation.eligible);
  const blockedContextPackages = validations.filter((validation) => !validation.eligible);
  const warningCodesPresent = unique(validations.flatMap((validation) => validation.warningCodes)).sort();
  const productionApprovedTrueCount = candidates.filter((candidate) => candidate.productionApproved).length;
  const exactAcceptedIndustrySet =
    acceptedIndustryCodes.length === ACCEPTED_INDUSTRY_CODES.length &&
    ACCEPTED_INDUSTRY_CODES.every((industryCode) => acceptedIndustryCodes.includes(industryCode));

  const result = {
    phase: "150Y",
    dbReadAttempted: false,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    reviewedIndustryCount: ACCEPTED_INDUSTRY_CODES.length,
    candidateContextPackages: candidates.length,
    eligibleContextPackages: eligibleContextPackages.length,
    blockedContextPackages: blockedContextPackages.length,
    acceptedIndustryCodes,
    acceptedIndustryCodesExactly: exactAcceptedIndustrySet,
    blockedIndustryCodes: blockedContextPackages.map((validation) => validation.industryCode),
    warningCodesPresent,
    blockedReasons: unique(blockedContextPackages.flatMap((validation) => validation.blockedReasons)).sort(),
    forbiddenAdviceDetected: validations.some((validation) => validation.forbiddenAdviceDetected),
    numericBenchmarkLanguageDetected: validations.some(
      (validation) => validation.numericBenchmarkLanguageDetected,
    ),
    unsupportedTickerContextDetected: validations.some(
      (validation) => validation.unsupportedTickerContextDetected,
    ),
    unsupportedTickersRemainMissingSafe: [...REVIEWED_UNSUPPORTED_TICKERS],
    industryMetricCreated: false,
    benchmarkCreated: false,
    valuationRiskBenchmarkInvented: false,
    productionApprovedTrueCount,
    staticGuidanceTreatedAsReviewedQualitativeContext: false,
    missingDataZeroFilled: false,
    readyForConfirmWrite: eligibleContextPackages.length === candidates.length,
    candidateValidations: validations,
    recommendedNextPhase:
      "Phase 150Z - add/write reviewed qualitative context source packages for the 3 industries only, if eligible.",
  };

  const smokePassed =
    result.phase === "150Y" &&
    !result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.reviewedIndustryCount === 3 &&
    result.candidateContextPackages === 3 &&
    result.eligibleContextPackages === 0 &&
    result.blockedContextPackages === 3 &&
    result.acceptedIndustryCodesExactly &&
    result.blockedIndustryCodes.length === 3 &&
    result.warningCodesPresent.length > 0 &&
    !result.forbiddenAdviceDetected &&
    !result.numericBenchmarkLanguageDetected &&
    !result.unsupportedTickerContextDetected &&
    !result.industryMetricCreated &&
    !result.benchmarkCreated &&
    !result.valuationRiskBenchmarkInvented &&
    result.productionApprovedTrueCount === 0 &&
    !result.staticGuidanceTreatedAsReviewedQualitativeContext &&
    !result.missingDataZeroFilled &&
    !result.readyForConfirmWrite;

  return {
    ...result,
    smokePassed,
  };
};

const result = validateCandidateSet(candidateContextPackages);

console.log(JSON.stringify(result, null, 2));

if (!result.smokePassed) {
  process.exitCode = 1;
}
