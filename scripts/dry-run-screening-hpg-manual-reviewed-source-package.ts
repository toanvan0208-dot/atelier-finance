import "dotenv/config";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/database/client";

type MetricCode =
  | "PE"
  | "PB"
  | "CFO"
  | "LIQUIDITY"
  | "CLOSE_PRICE"
  | "EPS"
  | "SHARES_OUTSTANDING"
  | "TOTAL_DEBT";

type FieldPackage = {
  field: "companyName" | "industryCode" | MetricCode;
  value: string | number | null;
  unit: string | null;
  period: string | null;
  periodType: string | null;
  fiscalYearEnd: string | null;
  providerPeriod: string | null;
  sourceType: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  extractedQuote: string | null;
  reviewNote: string;
  warningCodes: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
  eligibleForScreeningCandidate: boolean;
  blocker: string | null;
};

const phase = "151T";
const ticker = "HPG" as const;
const targetIndustryCode = "STEEL_MATERIALS";

const inspectedFiles = [
  "docs/product/evidence/PHASE151S_CORE_TICKER_SCREENING_SOURCE_GAP_CLOSURE_DRY_RUN.md",
  "docs/product/evidence/PHASE151C_INDUSTRY_FINAL_BOUNDARY_HANDOFF.md",
  "docs/product/evidence/PHASE151B_INDUSTRY_TIER4_FULL_QUALITATIVE_CONTEXT_MILESTONE.md",
  "docs/product/evidence/PHASE151A_INDUSTRY_QUALITATIVE_CONTEXT_CONFIRM_WRITE_READ_PATH.md",
  "scripts/smoke-staging-reviewed-preview-read-path.ts",
  "scripts/smoke-staging-market-price-read-path.ts",
  "scripts/smoke-steel-peer-group-read-path.ts",
  "scripts/smoke-product-readiness-six-ticker.ts",
  "src/features/watchlist/data/watchlist.data.ts",
] as const;

const forbiddenAdviceTerms = [
  "recommend to buy",
  "recommend to sell",
  "recommend to hold",
  "target price is",
  "fair value is",
  "upside is",
  "downside is",
  "stock attractiveness score",
  "worth buying",
];

const numberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    const parsed = Number(value.toNumber());
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isoDate = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const fileMentionsHpg = (relativePath: string): boolean => {
  const path = join(process.cwd(), relativePath);
  return existsSync(path) && readFileSync(path, "utf8").includes(ticker);
};

const reviewedSourceReferences = inspectedFiles.filter(fileMentionsHpg);

const blockedField = (field: FieldPackage["field"], blocker: string, reviewNote?: string): FieldPackage => ({
  field,
  value: null,
  unit: null,
  period: null,
  periodType: null,
  fiscalYearEnd: null,
  providerPeriod: null,
  sourceType: null,
  sourceLabel: null,
  sourceUrl: null,
  extractedQuote: null,
  reviewNote: reviewNote ?? blocker,
  warningCodes: ["MISSING_SAFE", "NEEDS_REVIEW", "RESEARCH_ONLY", "NO_ZERO_FILL"],
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
  eligibleForScreeningCandidate: false,
  blocker,
});

const eligibleField = ({
  field,
  value,
  unit,
  period,
  periodType,
  fiscalYearEnd = null,
  providerPeriod = null,
  sourceType,
  sourceLabel,
  sourceUrl = null,
  extractedQuote = null,
  reviewNote,
  warningCodes,
}: Omit<FieldPackage, "dataMode" | "needsReview" | "productionApproved" | "eligibleForScreeningCandidate" | "blocker">): FieldPackage => ({
  field,
  value,
  unit,
  period,
  periodType,
  fiscalYearEnd,
  providerPeriod,
  sourceType,
  sourceLabel,
  sourceUrl,
  extractedQuote,
  reviewNote,
  warningCodes: ["RESEARCH_ONLY", "NEEDS_REVIEW", "PRODUCTION_APPROVED_FALSE", ...warningCodes],
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
  eligibleForScreeningCandidate: true,
  blocker: null,
});

const metricFromFinancialStatement = (
  field: Extract<MetricCode, "CFO" | "EPS" | "SHARES_OUTSTANDING" | "TOTAL_DEBT">,
  value: unknown,
  sourceLabel: string,
  period: string | null,
  periodType: string | null,
  fiscalYearEnd: string | null,
): FieldPackage => {
  const parsed = numberOrNull(value);
  if (parsed === null) {
    return blockedField(field, `${field} is missing from eligible HPG FinancialStatement rows.`);
  }
  if (field === "TOTAL_DEBT" && parsed === 0) {
    return blockedField(field, "TOTAL_DEBT cannot be zero-filled and must not be substituted from total liabilities.");
  }

  return eligibleField({
    field,
    value: parsed,
    unit: field === "EPS" ? "vnd_per_share" : field === "SHARES_OUTSTANDING" ? "shares" : "vnd",
    period,
    periodType,
    fiscalYearEnd,
    providerPeriod: null,
    sourceType: "financial_statement_local_postgres",
    sourceLabel,
    sourceUrl: null,
    extractedQuote: null,
    reviewNote: `${field} is read from eligible local PostgreSQL FinancialStatement rows, not from static UI copy.`,
    warningCodes:
      field === "TOTAL_DEBT"
        ? ["TOTAL_DEBT_SOURCE_REQUIRED_NO_TOTAL_LIABILITIES_SUBSTITUTION"]
        : ["LOCAL_POSTGRES_FINANCIAL_STATEMENT"],
  });
};

const metricFromMarketPrice = (
  field: Extract<MetricCode, "LIQUIDITY" | "CLOSE_PRICE">,
  value: unknown,
  sourceLabel: string,
  snapshotDate: string | null,
): FieldPackage => {
  const parsed = numberOrNull(value);
  if (parsed === null) {
    return blockedField(field, `${field} is missing from eligible HPG MarketPrice rows.`);
  }

  return eligibleField({
    field,
    value: parsed,
    unit: field === "CLOSE_PRICE" ? "vnd_per_share" : "vnd_trading_value",
    period: snapshotDate,
    periodType: "market_snapshot",
    fiscalYearEnd: null,
    providerPeriod: null,
    sourceType: "market_price_local_postgres",
    sourceLabel,
    sourceUrl: null,
    extractedQuote: null,
    reviewNote: `${field} is a local market snapshot field and must not be used as ranking or advice.`,
    warningCodes: ["MARKET_SNAPSHOT", "NOT_AUDITED_FINANCIAL_DATA", "STALE_SNAPSHOT_CHECK_REQUIRED"],
  });
};

const ratioMetric = (
  field: Extract<MetricCode, "PE" | "PB">,
  numerator: unknown,
  denominator: unknown,
  sourceLabel: string,
  snapshotDate: string | null,
): FieldPackage => {
  const price = numberOrNull(numerator);
  const base = numberOrNull(denominator);
  if (price === null || base === null || base <= 0) {
    return blockedField(field, `${field} is blocked because close price or denominator is missing/non-positive.`);
  }

  return eligibleField({
    field,
    value: price / base,
    unit: "ratio",
    period: snapshotDate,
    periodType: "derived_market_snapshot",
    fiscalYearEnd: null,
    providerPeriod: null,
    sourceType: "derived_from_local_postgres_inputs",
    sourceLabel,
    sourceUrl: null,
    extractedQuote: null,
    reviewNote: `${field} is derived only from eligible local close price and accounting denominator; it remains research_only and needsReview.`,
    warningCodes: ["DERIVED_MARKET_RATIO", "NOT_AUDITED_FINANCIAL_DATA", "STALE_SNAPSHOT_CHECK_REQUIRED"],
  });
};

const containsForbiddenAdvice = (payload: unknown): boolean => {
  const text = JSON.stringify(payload).toLowerCase();
  return forbiddenAdviceTerms.some((term) => text.includes(term));
};

async function main() {
  const [company, companyIndustry, financialStatement, marketPrice] = await Promise.all([
    prisma.company.findFirst({
      where: { ticker, dataMode: "research_only" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.companyIndustry.findFirst({
      where: {
        ticker,
        industryCode: targetIndustryCode,
        dataMode: "research_only",
        productionApproved: false,
        needsReview: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.financialStatement.findFirst({
      where: {
        ticker,
        dataMode: "research_only",
      },
      orderBy: [{ asOf: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.marketPrice.findFirst({
      where: {
        ticker,
        dataMode: "research_only",
      },
      orderBy: [{ tradingDate: "desc" }, { asOf: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  const companyField = company
    ? eligibleField({
        field: "companyName",
        value: company.companyName,
        unit: null,
        period: isoDate(company.profileAsOf),
        periodType: "company_profile",
        fiscalYearEnd: null,
        providerPeriod: null,
        sourceType: "company_local_postgres",
        sourceLabel: company.profileSourceId ?? "Company",
        sourceUrl: null,
        extractedQuote: null,
        reviewNote: "Company metadata is read from local PostgreSQL Company row.",
        warningCodes: ["LOCAL_POSTGRES_COMPANY"],
      })
    : blockedField(
        "companyName",
        "HPG Company row is missing from local PostgreSQL.",
        "HPG appears in prior evidence/runtime files, but static references are not eligible company metadata.",
      );

  const industryField = companyIndustry
    ? eligibleField({
        field: "industryCode",
        value: companyIndustry.industryCode,
        unit: null,
        period: isoDate(companyIndustry.retrievedAt),
        periodType: "industry_taxonomy",
        fiscalYearEnd: null,
        providerPeriod: null,
        sourceType: companyIndustry.sourceType,
        sourceLabel: companyIndustry.sourceLabel,
        sourceUrl: companyIndustry.sourceUrl,
        extractedQuote: companyIndustry.extractedQuote,
        reviewNote: companyIndustry.reviewNote ?? "HPG industry mapping read from local PostgreSQL CompanyIndustry row.",
        warningCodes: ["INDUSTRY_TAXONOMY_RESEARCH_ONLY", "NOT_INVESTMENT_ADVICE"],
      })
    : blockedField(
        "industryCode",
        "HPG CompanyIndustry row for STEEL_MATERIALS is missing from local PostgreSQL.",
        "Prior Industry evidence identifies HPG as STEEL_MATERIALS lane ticker, but evidence text alone is not a write-ready Screening source package.",
      );

  const financialSourceLabel = financialStatement?.sourceLabel ?? "FinancialStatement";
  const marketSourceLabel = marketPrice?.sourceLabel ?? "MarketPrice";
  const fiscalYearEnd = isoDate(financialStatement?.asOf);
  const marketDate = isoDate(marketPrice?.tradingDate);
  const closePrice = marketPrice?.closePrice ?? null;

  const metrics: FieldPackage[] = [
    ratioMetric("PE", closePrice, financialStatement?.eps, `${marketSourceLabel} + ${financialSourceLabel}`, marketDate),
    ratioMetric("PB", closePrice, financialStatement?.bvps, `${marketSourceLabel} + ${financialSourceLabel}`, marketDate),
    metricFromFinancialStatement("CFO", financialStatement?.operatingCashFlow, financialSourceLabel, financialStatement?.period ?? null, financialStatement?.periodType ?? null, fiscalYearEnd),
    metricFromMarketPrice("LIQUIDITY", marketPrice?.tradingValue, marketSourceLabel, marketDate),
    metricFromMarketPrice("CLOSE_PRICE", closePrice, marketSourceLabel, marketDate),
    metricFromFinancialStatement("EPS", financialStatement?.eps, financialSourceLabel, financialStatement?.period ?? null, financialStatement?.periodType ?? null, fiscalYearEnd),
    metricFromFinancialStatement("SHARES_OUTSTANDING", financialStatement?.sharesOutstanding, financialSourceLabel, financialStatement?.period ?? null, financialStatement?.periodType ?? null, fiscalYearEnd),
    metricFromFinancialStatement("TOTAL_DEBT", financialStatement?.totalDebt, financialSourceLabel, financialStatement?.period ?? null, financialStatement?.periodType ?? null, fiscalYearEnd),
  ];

  const fields = [companyField, industryField, ...metrics];
  const eligibleFields = fields.filter((field) => field.eligibleForScreeningCandidate).map((field) => field.field);
  const blockedFields = fields.filter((field) => !field.eligibleForScreeningCandidate).map((field) => field.field);
  const missingFields = blockedFields;
  const allRequiredEligible = fields.every((field) => field.eligibleForScreeningCandidate);
  const productionApprovedTrueCount = fields.filter((field) => field.productionApproved).length;
  const forbiddenAdviceDetected = containsForbiddenAdvice(fields);
  const candidatePrepared = fields.length === 10;
  const coverageLevel = allRequiredEligible ? "full_analysis_candidate" : "missing_safe";
  const readyForConfirmWrite = candidatePrepared && allRequiredEligible && productionApprovedTrueCount === 0 && !forbiddenAdviceDetected;

  const result = {
    phase,
    mode: "dry_run",
    ticker,
    candidatePrepared,
    coverageLevel,
    screeningEligible: readyForConfirmWrite,
    analysisEligible: readyForConfirmWrite,
    metricsPreparedCount: metrics.length,
    provenanceRowsPreparedCount: fields.filter((field) => field.eligibleForScreeningCandidate).length,
    missingFields,
    blockedFields,
    eligibleFields,
    sourceReferencesInspected: inspectedFiles,
    reviewedSourceReferencesFound: reviewedSourceReferences,
    fieldPackages: Object.fromEntries(
      fields.map((field) => [
        field.field,
        {
          value: field.value,
          unit: field.unit,
          period: field.period,
          periodType: field.periodType,
          fiscalYearEnd: field.fiscalYearEnd,
          providerPeriod: field.providerPeriod,
          sourceType: field.sourceType,
          sourceLabel: field.sourceLabel,
          sourceUrl: field.sourceUrl,
          extractedQuote: field.extractedQuote,
          reviewNote: field.reviewNote,
          warningCodes: field.warningCodes,
          dataMode: field.dataMode,
          needsReview: field.needsReview,
          productionApproved: field.productionApproved,
          eligibleForScreeningCandidate: field.eligibleForScreeningCandidate,
          blocker: field.blocker,
        },
      ]),
    ),
    readyForConfirmWrite,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    schemaChanged: false,
    uiChanged: false,
    assistantChanged: false,
    productionApprovedTrueCount,
    hsgNkgUntouched: true,
    tvnPresent: false,
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated: false,
    forbiddenAdviceDetected,
    smokePassed:
      candidatePrepared &&
      productionApprovedTrueCount === 0 &&
      !forbiddenAdviceDetected &&
      !readyForConfirmWrite,
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
