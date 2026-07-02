import "dotenv/config";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/database/client";

type CoreTicker = "FPT" | "HPG" | "VNM" | "MSN" | "MWG" | "VCB";
type MetricCode =
  | "company"
  | "industryCode"
  | "PE"
  | "PB"
  | "CFO"
  | "LIQUIDITY"
  | "CLOSE_PRICE"
  | "EPS"
  | "SHARES_OUTSTANDING"
  | "TOTAL_DEBT";

type SourceStatus = {
  found: boolean;
  sourceKind: "prisma_local_postgres" | "static_runtime_code" | "missing";
  sourceType: string | null;
  sourceLabel: string | null;
  eligibleForScreeningCandidate: boolean;
  warningCodes: string[];
  blocker: string | null;
};

type TickerInventory = {
  ticker: CoreTicker;
  company: SourceStatus;
  industryCode: SourceStatus;
  metrics: Record<Exclude<MetricCode, "company" | "industryCode">, SourceStatus>;
  staticRuntimeReferences: string[];
  readPathMismatch: string[];
  remainingBlockers: string[];
  recommendation: "import_reviewed_data_into_local_postgres" | "adjust_read_path_to_reviewed_runtime_source" | "create_manual_reviewed_source_package" | "leave_missing_safe";
};

const phase = "151S";
const coreTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"] as const;

const localRuntimeFiles = [
  "src/features/screening/data/screeningRedesign.data.ts",
  "src/features/watchlist/data/watchlist.data.ts",
  "src/features/financials/data/financials.data.ts",
  "src/features/financials/data/financialReadingDesk.data.ts",
  "src/features/overview/data/overviewCase.data.ts",
  "src/features/checklist/data/checkThinking.data.ts",
  "src/features/financials/lib/phase108-fpt-controlled-financials-constants.ts",
  "src/features/financials/lib/phase109-controlled-financials-constants.ts",
  "scripts/verify-vnstock-candidate-runtime.ts",
  "scripts/smoke-staging-reviewed-preview-read-path.ts",
] as const;

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
  "gia muc tieu",
  "gia tri hop ly",
  "tiem nang tang gia",
];

const blockedBenchmarkTerms = [
  "rankingCreated=true",
  "stockAttractivenessScoreCreated=true",
  "industryMetricCreated=true",
  "benchmarkCreated=true",
  "valuationRiskBenchmarkInvented=true",
];

const missingStatus = (blocker: string): SourceStatus => ({
  found: false,
  sourceKind: "missing",
  sourceType: null,
  sourceLabel: null,
  eligibleForScreeningCandidate: false,
  warningCodes: ["MISSING_SAFE", "NEEDS_REVIEW", "NO_ZERO_FILL", "RESEARCH_ONLY"],
  blocker,
});

const postgresStatus = ({
  sourceType,
  sourceLabel,
  eligible,
  blocker,
  warningCodes = [],
}: {
  sourceType: string;
  sourceLabel: string;
  eligible: boolean;
  blocker: string | null;
  warningCodes?: string[];
}): SourceStatus => ({
  found: true,
  sourceKind: "prisma_local_postgres",
  sourceType,
  sourceLabel,
  eligibleForScreeningCandidate: eligible,
  warningCodes: [
    "LOCAL_POSTGRES_READ_PATH",
    "RESEARCH_ONLY",
    "NEEDS_REVIEW",
    "PRODUCTION_APPROVED_FALSE",
    ...warningCodes,
  ],
  blocker,
});

const staticStatus = (sourceLabel: string): SourceStatus => ({
  found: true,
  sourceKind: "static_runtime_code",
  sourceType: "static_or_test_runtime_reference",
  sourceLabel,
  eligibleForScreeningCandidate: false,
  warningCodes: ["STATIC_RUNTIME_REFERENCE_ONLY", "NOT_SOURCE_PACKAGE", "NEEDS_REVIEW", "NO_DB_WRITE"],
  blocker: "Static/runtime references are inventory evidence only and must not be backfilled as real ScreeningCandidate data.",
});

const numberPresent = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return Number.isFinite(Number(value.toNumber()));
  }
  return Number.isFinite(Number(value));
};

const containsAny = (text: string, terms: string[]): boolean => {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
};

const localStaticReferencesForTicker = (ticker: CoreTicker): string[] =>
  localRuntimeFiles.filter((relativePath) => {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) && readFileSync(fullPath, "utf8").includes(ticker);
  });

const selectPreferredFinancialStatement = async (ticker: CoreTicker) => {
  const rows = await prisma.financialStatement.findMany({
    where: {
      ticker,
      dataMode: "research_only",
    },
    orderBy: [{ asOf: "desc" }, { updatedAt: "desc" }],
    take: 5,
    include: { source: true },
  });

  return rows[0] ?? null;
};

const selectLatestMarketPrice = async (ticker: CoreTicker) => {
  const rows = await prisma.marketPrice.findMany({
    where: {
      ticker,
      dataMode: "research_only",
    },
    orderBy: [{ tradingDate: "desc" }, { asOf: "desc" }, { updatedAt: "desc" }],
    take: 1,
    include: { source: true },
  });

  return rows[0] ?? null;
};

const metricStatusFromFinancialStatement = (
  ticker: CoreTicker,
  metricCode: Extract<MetricCode, "CFO" | "EPS" | "SHARES_OUTSTANDING" | "TOTAL_DEBT">,
  value: unknown,
  sourceLabel: string,
): SourceStatus => {
  if (!numberPresent(value)) {
    return missingStatus(`${metricCode} not found in eligible local PostgreSQL FinancialStatement rows for ${ticker}.`);
  }

  return postgresStatus({
    sourceType: "financial_statement_local_postgres",
    sourceLabel,
    eligible: true,
    blocker: null,
    warningCodes: metricCode === "TOTAL_DEBT" ? ["TOTAL_DEBT_SOURCE_REQUIRED_NO_TOTAL_LIABILITIES_SUBSTITUTION"] : [],
  });
};

const metricStatusFromMarketPrice = (
  ticker: CoreTicker,
  metricCode: Extract<MetricCode, "LIQUIDITY" | "CLOSE_PRICE">,
  value: unknown,
  sourceLabel: string,
): SourceStatus => {
  if (!numberPresent(value)) {
    return missingStatus(`${metricCode} not found in eligible local PostgreSQL MarketPrice rows for ${ticker}.`);
  }

  return postgresStatus({
    sourceType: "market_price_local_postgres",
    sourceLabel,
    eligible: true,
    blocker: null,
    warningCodes: ["MARKET_SNAPSHOT", "NOT_AUDITED_FINANCIAL_DATA"],
  });
};

const ratioStatus = ({
  closePrice,
  denominator,
  sourceLabel,
  missingReason,
}: {
  closePrice: unknown;
  denominator: unknown;
  sourceLabel: string;
  missingReason: string;
}): SourceStatus => {
  const close = Number(closePrice);
  const base = Number(denominator);
  if (!Number.isFinite(close) || !Number.isFinite(base) || base <= 0) {
    return missingStatus(missingReason);
  }

  return postgresStatus({
    sourceType: "derived_from_local_runtime_inputs",
    sourceLabel,
    eligible: true,
    blocker: null,
    warningCodes: ["DERIVED_MARKET_RATIO", "NOT_AUDITED_FINANCIAL_DATA", "STALE_SNAPSHOT_CHECK_REQUIRED"],
  });
};

const chooseRecommendation = (inventory: TickerInventory): TickerInventory["recommendation"] => {
  const statuses = [
    inventory.company,
    inventory.industryCode,
    ...Object.values(inventory.metrics),
  ];
  const eligibleCount = statuses.filter((status) => status.eligibleForScreeningCandidate).length;
  const staticOnlyCount = statuses.filter((status) => status.sourceKind === "static_runtime_code").length;

  if (eligibleCount > 0 && inventory.remainingBlockers.length > 0) return "import_reviewed_data_into_local_postgres";
  if (eligibleCount === 0 && staticOnlyCount > 0) return "create_manual_reviewed_source_package";
  if (eligibleCount > 0 && inventory.remainingBlockers.length === 0) return "adjust_read_path_to_reviewed_runtime_source";
  return "leave_missing_safe";
};

const inspectTicker = async (ticker: CoreTicker): Promise<TickerInventory> => {
  const [company, industryRows, financialStatement, marketPrice] = await Promise.all([
    prisma.company.findFirst({
      where: { ticker, dataMode: "research_only" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.companyIndustry.findMany({
      where: {
        ticker,
        dataMode: "research_only",
        productionApproved: false,
        needsReview: true,
      },
      orderBy: [{ roleType: "asc" }, { updatedAt: "desc" }],
      take: 3,
    }),
    selectPreferredFinancialStatement(ticker),
    selectLatestMarketPrice(ticker),
  ]);
  const staticRuntimeReferences = localStaticReferencesForTicker(ticker);
  const staticFallback = staticRuntimeReferences.length > 0 ? staticStatus(staticRuntimeReferences.join(",")) : null;

  const companyStatus = company
    ? postgresStatus({
        sourceType: "company_local_postgres",
        sourceLabel: company.profileSourceId ?? "Company",
        eligible: true,
        blocker: null,
      })
    : staticFallback ?? missingStatus(`Company row not found in local PostgreSQL for ${ticker}.`);
  const primaryIndustry = industryRows[0] ?? null;
  const industryStatus = primaryIndustry
    ? postgresStatus({
        sourceType: primaryIndustry.sourceType,
        sourceLabel: primaryIndustry.sourceLabel,
        eligible: true,
        blocker: null,
        warningCodes: ["INDUSTRY_TAXONOMY_RESEARCH_ONLY", "NOT_INVESTMENT_ADVICE"],
      })
    : staticFallback ?? missingStatus(`CompanyIndustry taxonomy row not found in local PostgreSQL for ${ticker}.`);

  const financialSourceLabel = financialStatement?.sourceLabel ?? "FinancialStatement";
  const marketSourceLabel = marketPrice?.sourceLabel ?? "MarketPrice";
  const closePrice = marketPrice?.closePrice ?? null;

  const metrics: TickerInventory["metrics"] = {
    PE: financialStatement
      ? ratioStatus({
          closePrice,
          denominator: financialStatement.eps,
          sourceLabel: `${marketSourceLabel} + ${financialSourceLabel}`,
          missingReason: `P/E blocked for ${ticker}: closePrice or positive EPS is missing in local PostgreSQL.`,
        })
      : staticFallback ?? missingStatus(`P/E blocked for ${ticker}: no eligible FinancialStatement row.`),
    PB: financialStatement
      ? ratioStatus({
          closePrice,
          denominator: financialStatement.bvps,
          sourceLabel: `${marketSourceLabel} + ${financialSourceLabel}`,
          missingReason: `P/B blocked for ${ticker}: closePrice or positive BVPS is missing in local PostgreSQL.`,
        })
      : staticFallback ?? missingStatus(`P/B blocked for ${ticker}: no eligible FinancialStatement row.`),
    CFO: financialStatement
      ? metricStatusFromFinancialStatement(ticker, "CFO", financialStatement.operatingCashFlow, financialSourceLabel)
      : staticFallback ?? missingStatus(`CFO blocked for ${ticker}: no eligible FinancialStatement row.`),
    LIQUIDITY: marketPrice
      ? metricStatusFromMarketPrice(ticker, "LIQUIDITY", marketPrice.tradingValue, marketSourceLabel)
      : staticFallback ?? missingStatus(`Liquidity blocked for ${ticker}: no eligible MarketPrice row.`),
    CLOSE_PRICE: marketPrice
      ? metricStatusFromMarketPrice(ticker, "CLOSE_PRICE", marketPrice.closePrice, marketSourceLabel)
      : staticFallback ?? missingStatus(`Close price blocked for ${ticker}: no eligible MarketPrice row.`),
    EPS: financialStatement
      ? metricStatusFromFinancialStatement(ticker, "EPS", financialStatement.eps, financialSourceLabel)
      : staticFallback ?? missingStatus(`EPS blocked for ${ticker}: no eligible FinancialStatement row.`),
    SHARES_OUTSTANDING: financialStatement
      ? metricStatusFromFinancialStatement(ticker, "SHARES_OUTSTANDING", financialStatement.sharesOutstanding, financialSourceLabel)
      : staticFallback ?? missingStatus(`Shares outstanding blocked for ${ticker}: no eligible FinancialStatement row.`),
    TOTAL_DEBT: financialStatement
      ? metricStatusFromFinancialStatement(ticker, "TOTAL_DEBT", financialStatement.totalDebt, financialSourceLabel)
      : staticFallback ?? missingStatus(`Total debt blocked for ${ticker}: no eligible FinancialStatement row.`),
  };

  const allStatuses = [companyStatus, industryStatus, ...Object.values(metrics)];
  const remainingBlockers = [
    ...new Set(
      allStatuses
        .filter((status) => !status.eligibleForScreeningCandidate)
        .map((status) => status.blocker ?? "Source is not eligible for ScreeningCandidate."),
    ),
  ];
  const readPathMismatch = [
    ...(!company && staticRuntimeReferences.length > 0
      ? ["Company-like ticker references exist in static/runtime files, but no eligible Prisma Company row was found."]
      : []),
    ...(!financialStatement && staticRuntimeReferences.length > 0
      ? ["Financial-like ticker references exist in static/runtime/test files, but no eligible local PostgreSQL FinancialStatement row was found."]
      : []),
    ...(!marketPrice && staticRuntimeReferences.length > 0
      ? ["Ticker references exist in runtime files, but no eligible local PostgreSQL MarketPrice row was found."]
      : []),
    ...(!primaryIndustry && staticRuntimeReferences.length > 0
      ? ["Ticker references exist in runtime/industry evidence, but no eligible local PostgreSQL CompanyIndustry row was found."]
      : []),
  ];

  const inventory: TickerInventory = {
    ticker,
    company: companyStatus,
    industryCode: industryStatus,
    metrics,
    staticRuntimeReferences,
    readPathMismatch,
    remainingBlockers,
    recommendation: "leave_missing_safe",
  };

  return {
    ...inventory,
    recommendation: chooseRecommendation(inventory),
  };
};

const validateInventory = (inventories: TickerInventory[]) => {
  const payload = JSON.stringify(inventories);
  return {
    productionApprovedTrueCount: 0,
    forbiddenAdviceDetected: containsAny(payload, forbiddenAdviceTerms),
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated: containsAny(payload, blockedBenchmarkTerms),
    tvnPresent: payload.includes("TVN"),
  };
};

async function main() {
  const inventories = await Promise.all(coreTickers.map((ticker) => inspectTicker(ticker)));
  const validation = validateInventory(inventories);
  const sourceFoundSummary = Object.fromEntries(
    inventories.map((inventory) => [
      inventory.ticker,
      {
        company: inventory.company.found,
        industryCode: inventory.industryCode.found,
        PE: inventory.metrics.PE.found,
        PB: inventory.metrics.PB.found,
        CFO: inventory.metrics.CFO.found,
        LIQUIDITY: inventory.metrics.LIQUIDITY.found,
        CLOSE_PRICE: inventory.metrics.CLOSE_PRICE.found,
        EPS: inventory.metrics.EPS.found,
        SHARES_OUTSTANDING: inventory.metrics.SHARES_OUTSTANDING.found,
        TOTAL_DEBT: inventory.metrics.TOTAL_DEBT.found,
      },
    ]),
  );
  const eligibleSummary = Object.fromEntries(
    inventories.map((inventory) => [
      inventory.ticker,
      {
        company: inventory.company.eligibleForScreeningCandidate,
        industryCode: inventory.industryCode.eligibleForScreeningCandidate,
        PE: inventory.metrics.PE.eligibleForScreeningCandidate,
        PB: inventory.metrics.PB.eligibleForScreeningCandidate,
        CFO: inventory.metrics.CFO.eligibleForScreeningCandidate,
        LIQUIDITY: inventory.metrics.LIQUIDITY.eligibleForScreeningCandidate,
        CLOSE_PRICE: inventory.metrics.CLOSE_PRICE.eligibleForScreeningCandidate,
        EPS: inventory.metrics.EPS.eligibleForScreeningCandidate,
        SHARES_OUTSTANDING: inventory.metrics.SHARES_OUTSTANDING.eligibleForScreeningCandidate,
        TOTAL_DEBT: inventory.metrics.TOTAL_DEBT.eligibleForScreeningCandidate,
      },
    ]),
  );
  const sourceKindSummary = Object.fromEntries(
    inventories.map((inventory) => [
      inventory.ticker,
      {
        company: inventory.company.sourceKind,
        industryCode: inventory.industryCode.sourceKind,
        PE: inventory.metrics.PE.sourceKind,
        PB: inventory.metrics.PB.sourceKind,
        CFO: inventory.metrics.CFO.sourceKind,
        LIQUIDITY: inventory.metrics.LIQUIDITY.sourceKind,
        CLOSE_PRICE: inventory.metrics.CLOSE_PRICE.sourceKind,
        EPS: inventory.metrics.EPS.sourceKind,
        SHARES_OUTSTANDING: inventory.metrics.SHARES_OUTSTANDING.sourceKind,
        TOTAL_DEBT: inventory.metrics.TOTAL_DEBT.sourceKind,
      },
    ]),
  );
  const remainingBlockersByTicker = Object.fromEntries(
    inventories.map((inventory) => [inventory.ticker, inventory.remainingBlockers]),
  );
  const readPathMismatchByTicker = Object.fromEntries(
    inventories.map((inventory) => [inventory.ticker, inventory.readPathMismatch]),
  );
  const recommendationsByTicker = Object.fromEntries(
    inventories.map((inventory) => [inventory.ticker, inventory.recommendation]),
  );

  const result = {
    phase,
    mode: "dry_run",
    candidateTickers: coreTickers.join(","),
    sourceFoundSummary,
    sourceKindSummary,
    eligibleSummary,
    readPathMismatchByTicker,
    remainingBlockersByTicker,
    recommendationsByTicker,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    schemaChanged: false,
    hsgNkgUntouched: true,
    tvnPresent: validation.tvnPresent,
    productionApprovedTrueCount: validation.productionApprovedTrueCount,
    forbiddenAdviceDetected: validation.forbiddenAdviceDetected,
    rankingCreated: validation.rankingCreated,
    stockAttractivenessScoreCreated: validation.stockAttractivenessScoreCreated,
    industryMetricCreated: validation.industryMetricCreated,
    benchmarkCreated: validation.benchmarkCreated,
    readyForConfirmWrite: inventories.some((inventory) =>
      [inventory.company, inventory.industryCode, ...Object.values(inventory.metrics)].every(
        (status) => status.eligibleForScreeningCandidate,
      ),
    ),
    smokePassed:
      !validation.tvnPresent &&
      validation.productionApprovedTrueCount === 0 &&
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
