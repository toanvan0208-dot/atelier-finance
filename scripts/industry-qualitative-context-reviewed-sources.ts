import {
  REVIEWED_INDUSTRY_CODES,
  REVIEWED_UNSUPPORTED_TICKERS,
} from "../src/features/industry/lib/reviewed-industry-coverage.js";

export type ReviewedQualitativeIndustryCode = (typeof REVIEWED_INDUSTRY_CODES)[number];

export type IndustryQualitativeContextSourceType =
  | "industry_association"
  | "official_statistics"
  | "international_organization"
  | "reviewed_manual_note";

type ResearchOnlyPackagePolicy = {
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
};

export type IndustryQualitativeContextSourcePackage = ResearchOnlyPackagePolicy & {
  industryCode: ReviewedQualitativeIndustryCode;
  overview: string;
  howIndustryMakesMoney: string;
  keyDrivers: string[];
  keyRisks: string[];
  macroSensitivity: string[];
  nextChecks: string[];
  commonMisread: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceType: IndustryQualitativeContextSourceType;
  retrievedAt: string;
  publicationDate: string | null;
  extractedQuote: string | null;
  reviewNote: string;
  warningCodes: string[];
};

export type IndustryQualitativeContextValidation = {
  industryCode: ReviewedQualitativeIndustryCode;
  eligible: boolean;
  blockedReasons: string[];
  warningCodes: string[];
  forbiddenAdviceDetected: boolean;
  numericBenchmarkLanguageDetected: boolean;
  unsupportedTickerContextDetected: boolean;
};

export const QUALITATIVE_CONTEXT_REVIEWED_INDUSTRY_CODES = [
  "STEEL_MATERIALS",
  "RETAIL",
  "CONSUMER_STAPLES_DAIRY",
] as const satisfies readonly ReviewedQualitativeIndustryCode[];

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
  /\bvaluation\s+(multiple|range|comparison)\b/i,
  /\brisk\s+(score|ranking)\b/i,
  /\bpeer\s+(valuation|risk)\b/i,
  /\bP\/E\b/i,
  /\bEV\/EBITDA\b/i,
  /\btarget\s+multiple\b/i,
  /\b\d+(?:\.\d+)?\s?%/,
  /\b\d+(?:\.\d+)?x\b/i,
] as const;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REAL_HTTP_URL_PATTERN = /^https?:\/\/[^\s]+$/i;

export const industryQualitativeContextSourcePackages: IndustryQualitativeContextSourcePackage[] = [
  {
    industryCode: "STEEL_MATERIALS",
    overview:
      "Steel and construction-material businesses transform iron ore, recycled steel, energy, and other inputs into steel products used across construction, infrastructure, transport, equipment, and household applications.",
    howIndustryMakesMoney:
      "Revenue depends on shipped volume, output price, product mix, plant utilization, and the spread between output prices and input costs.",
    keyDrivers: [
      "Construction and infrastructure demand",
      "Raw material and energy availability",
      "Plant utilization and product mix",
      "Inventory and working-capital discipline",
    ],
    keyRisks: [
      "Weak demand cycles",
      "Input cost volatility",
      "Inventory pressure when output prices move quickly",
      "High fixed-cost pressure when utilization falls",
    ],
    macroSensitivity: [
      "Infrastructure and construction activity",
      "Credit and property-cycle conditions",
      "Iron ore, coal, scrap, electricity, and logistics costs",
      "Exchange-rate movement for imported inputs or export markets",
    ],
    nextChecks: [
      "Check company revenue, gross margin, inventory, operating cash flow, and debt trend.",
      "Check whether any peer group is still context-only and not a valuation or risk comparison.",
    ],
    commonMisread:
      "A steel/materials industry label only frames the business cycle and input-cost exposure; it does not rank ticker quality, valuation, risk, or action suitability.",
    sourceLabel: "World Steel Association - Steel and raw materials fact sheet",
    sourceUrl: "https://worldsteel.org/wp-content/uploads/Fact-sheet-raw-materials-2023-1.pdf",
    sourceType: "industry_association",
    retrievedAt: "2026-07-01",
    publicationDate: null,
    extractedQuote: null,
    reviewNote:
      "The source explains steelmaking input routes and raw material dependence, which supports the package's focus on input costs, utilization, product flow, and working-capital checks. The source page does not provide a reliable exact publication date in the reviewed package, so publicationDate remains null.",
    warningCodes: [
      "QUALITATIVE_CONTEXT_RESEARCH_ONLY",
      "QUALITATIVE_CONTEXT_NEEDS_REVIEW",
      "SOURCE_BACKED_DRY_RUN_ONLY",
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
      "Retail businesses connect merchandise and related services with final consumers through stores, nonstore channels, merchandising, fulfillment, and customer service.",
    howIndustryMakesMoney:
      "Revenue depends on customer traffic, order value, assortment, channel reach, inventory turns, supplier terms, and operating cost control.",
    keyDrivers: [
      "Household purchasing power",
      "Store and online channel productivity",
      "Inventory turnover",
      "Gross margin and promotion discipline",
      "Logistics, rent, labor, and service costs",
    ],
    keyRisks: [
      "Demand slowdown",
      "Inventory mismatch",
      "Price competition",
      "Operating cost pressure",
      "Finance cost pressure when working capital is stretched",
    ],
    macroSensitivity: [
      "Inflation and disposable income",
      "Employment and wage conditions",
      "Consumer credit conditions",
      "Currency movement for imported merchandise",
    ],
    nextChecks: [
      "Check company revenue quality, gross margin, inventory, commercial expense, finance cost, and operating cash flow.",
      "Keep retail peer groups missing-safe until a reviewed peer source package exists.",
    ],
    commonMisread:
      "Retail taxonomy coverage is a reviewed classification boundary only; it must not be read as a conclusion about business quality or market action.",
    sourceLabel: "U.S. Bureau of Labor Statistics - Retail Trade sector profile",
    sourceUrl: "https://www.bls.gov/iag/tgs/iag44-45.htm",
    sourceType: "official_statistics",
    retrievedAt: "2026-07-01",
    publicationDate: null,
    extractedQuote: null,
    reviewNote:
      "The source describes retail trade as establishments that provide merchandise and related incidental services, including store and nonstore channels. That supports the package's focus on final-consumer distribution, traffic, channel productivity, inventory, and operating-cost checks. No reliable page publication date was used, so publicationDate remains null.",
    warningCodes: [
      "QUALITATIVE_CONTEXT_RESEARCH_ONLY",
      "QUALITATIVE_CONTEXT_NEEDS_REVIEW",
      "SOURCE_BACKED_DRY_RUN_ONLY",
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
      "Dairy and consumer-staples businesses provide repeat-consumption food and nutrition products through milk collection, processing, brands, distribution, and retail channels.",
    howIndustryMakesMoney:
      "Revenue depends on volume, product mix, brand reach, pricing, distribution coverage, and control of milk, packaging, logistics, and commercial costs.",
    keyDrivers: [
      "Repeat household consumption",
      "Milk supply and processing reliability",
      "Brand and distribution strength",
      "Raw material, packaging, and logistics costs",
      "Product mix and commercial expense discipline",
    ],
    keyRisks: [
      "Input cost pressure",
      "Supply or quality disruption",
      "Brand competition",
      "Slower consumption growth",
      "Margin pressure from promotion or distribution costs",
    ],
    macroSensitivity: [
      "Household purchasing power",
      "Food inflation",
      "Agricultural input and logistics costs",
      "Exchange-rate movement for imported inputs",
    ],
    nextChecks: [
      "Check company revenue, gross margin, commercial expense, working capital, cash flow, and debt if present.",
      "Keep dairy or consumer-staples peer groups missing-safe until reviewed peer source packages exist.",
    ],
    commonMisread:
      "A dairy or consumer-staples label is context for reading the business model; it is not a comparative conclusion about ticker quality, valuation, risk, or action suitability.",
    sourceLabel: "FAO - Gateway to dairy production and products",
    sourceUrl: "https://www.fao.org/dairy-production-products/en",
    sourceType: "international_organization",
    retrievedAt: "2026-07-01",
    publicationDate: null,
    extractedQuote: null,
    reviewNote:
      "The source frames dairy as milk production and products, food and cash-flow relevance, and a dairy chain with production, products, markets, and trade. That supports the package's focus on repeat consumption, supply, processing, distribution, and input-cost checks. No reliable page publication date was used, so publicationDate remains null.",
    warningCodes: [
      "QUALITATIVE_CONTEXT_RESEARCH_ONLY",
      "QUALITATIVE_CONTEXT_NEEDS_REVIEW",
      "SOURCE_BACKED_DRY_RUN_ONLY",
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

const textForPackage = (sourcePackage: IndustryQualitativeContextSourcePackage): string =>
  [
    sourcePackage.industryCode,
    sourcePackage.overview,
    sourcePackage.howIndustryMakesMoney,
    ...sourcePackage.keyDrivers,
    ...sourcePackage.keyRisks,
    ...sourcePackage.macroSensitivity,
    ...sourcePackage.nextChecks,
    sourcePackage.commonMisread,
    sourcePackage.sourceLabel,
    sourcePackage.sourceUrl,
    sourcePackage.sourceType,
    sourcePackage.retrievedAt,
    sourcePackage.publicationDate ?? "",
    sourcePackage.extractedQuote ?? "",
    sourcePackage.reviewNote,
    ...sourcePackage.warningCodes,
    sourcePackage.dataMode,
  ].join("\n");

const hasPattern = (patterns: readonly RegExp[], value: string): boolean =>
  patterns.some((pattern) => pattern.test(value));

export const validateIndustryQualitativeContextSourcePackage = (
  sourcePackage: IndustryQualitativeContextSourcePackage,
): IndustryQualitativeContextValidation => {
  const packageText = textForPackage(sourcePackage);
  const unsupportedTickerContextDetected = REVIEWED_UNSUPPORTED_TICKERS.some((ticker) =>
    new RegExp(`\\b${ticker}\\b`, "i").test(packageText),
  );
  const forbiddenAdviceDetected = hasPattern(FORBIDDEN_ADVICE_PATTERNS, packageText);
  const numericBenchmarkLanguageDetected = hasPattern(NUMERIC_BENCHMARK_PATTERNS, packageText);
  const publicationDateAllowed =
    sourcePackage.publicationDate !== null ||
    /no reliable .*publication date|publicationDate remains null/i.test(sourcePackage.reviewNote);

  const blockedReasons = unique(
    [
      QUALITATIVE_CONTEXT_REVIEWED_INDUSTRY_CODES.includes(sourcePackage.industryCode)
        ? null
        : "UNSUPPORTED_INDUSTRY_CODE",
      sourcePackage.sourceLabel.trim().length > 0 ? null : "SOURCE_LABEL_MISSING",
      sourcePackage.sourceType ? null : "SOURCE_TYPE_MISSING",
      REAL_HTTP_URL_PATTERN.test(sourcePackage.sourceUrl) ? null : "SOURCE_URL_MISSING_OR_INVALID",
      ISO_DATE_PATTERN.test(sourcePackage.retrievedAt) ? null : "RETRIEVED_AT_MISSING_OR_INVALID",
      publicationDateAllowed ? null : "PUBLICATION_DATE_MISSING_WITHOUT_REVIEW_NOTE",
      sourcePackage.extractedQuote === null ? null : "EXTRACTED_QUOTE_PRESENT_WITHOUT_MANUAL_REVIEW",
      sourcePackage.reviewNote.trim().length > 0 ? null : "REVIEW_NOTE_MISSING",
      sourcePackage.warningCodes.length > 0 ? null : "WARNING_CODES_MISSING",
      sourcePackage.dataMode === "research_only" ? null : "DATA_MODE_NOT_RESEARCH_ONLY",
      sourcePackage.needsReview === true ? null : "NEEDS_REVIEW_FALSE_BLOCKED",
      sourcePackage.productionApproved === false ? null : "PRODUCTION_APPROVED_TRUE_BLOCKED",
      forbiddenAdviceDetected ? "FORBIDDEN_ADVICE_LANGUAGE_DETECTED" : null,
      numericBenchmarkLanguageDetected ? "NUMERIC_BENCHMARK_LANGUAGE_DETECTED" : null,
      unsupportedTickerContextDetected ? "UNSUPPORTED_TICKER_CONTEXT_DETECTED" : null,
    ].filter((reason): reason is string => Boolean(reason)),
  ).sort();

  return {
    industryCode: sourcePackage.industryCode,
    eligible: blockedReasons.length === 0,
    blockedReasons,
    warningCodes: sourcePackage.warningCodes,
    forbiddenAdviceDetected,
    numericBenchmarkLanguageDetected,
    unsupportedTickerContextDetected,
  };
};
