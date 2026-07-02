import "dotenv/config";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "../src/lib/database/client";

type CoreTicker = "FPT" | "HPG" | "VNM" | "MSN" | "MWG" | "VCB";
type MarketPriceCandidate = {
  ticker: CoreTicker;
  closePrice: number | null;
  priceDate: string | null;
  providerPeriod: string | null;
  currency: string | null;
  exchange: string | null;
  volume: number | null;
  liquidity: number | null;
  averageTradingValue: number | null;
  sourceType: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  reviewNote: string;
  warningCodes: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
  eligibleForMarketPriceConfirmWrite: boolean;
  blocker: string | null;
  sourceDecision: string;
};

type InspectedSource = {
  path: string;
  found: boolean;
  decision: string;
};

const phase = "151Z";
const targetTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"] as const;

const inspectedSourcePaths = [
  "prisma/schema.prisma",
  "scripts/smoke-staging-market-price-read-path.ts",
  "scripts/dry-run-staging-market-price-seed.ts",
  "scripts/import-vnstock-market-pvt-controlled.ts",
  "scripts/dry-run-market-price-daily-provider-refresh.ts",
  "scripts/confirm-write-market-price-daily-provider-refresh.ts",
  "src/lib/data-sources/vnstock-market-pvt-controlled-ingestion.ts",
  "docs/product/evidence/PHASE138C_DATA_SOURCE_REPRODUCIBILITY_AUDIT.md",
  "docs/product/evidence/PHASE146F_STAGING_SCHEDULED_REFRESH_PROVIDER_PROFILE_ADJUSTMENT_EVIDENCE.md",
] as const;

const forbiddenAdvicePatterns = [
  /\b(buy|sell|hold)\b/i,
  /\btarget\s+price\b/i,
  /\bfair\s+value\b/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /\battractive\b/i,
  /\bworth\s+buying\b/i,
  /\branking\b/i,
  /\bscoring\b/i,
  /\bscore\b/i,
] as const;

const inspectedSources: InspectedSource[] = inspectedSourcePaths.map((relativePath) => {
  const fullPath = join(process.cwd(), relativePath);
  if (!existsSync(fullPath)) {
    return {
      path: relativePath,
      found: false,
      decision: "not_found",
    };
  }

  const content = readFileSync(fullPath, "utf-8");
  const lower = content.toLowerCase();
  const providerFetch =
    lower.includes("fetchlocalpythonvnstockhistory") ||
    lower.includes("runcontrolledvnstockmarketpvtingestionbatch") ||
    lower.includes("vnstock");
  const stagingOnly = lower.includes("staging") || lower.includes("supabase");
  const testOrFixture = lower.includes("test fixture") || lower.includes("__tests__");

  return {
    path: relativePath,
    found: true,
    decision: providerFetch
      ? "blocked_provider_or_fetch_path_not_used_in_151z"
      : stagingOnly
        ? "blocked_staging_only_not_local_reviewed_package"
        : testOrFixture
          ? "blocked_test_fixture_not_source_package"
          : "inspected_no_eligible_market_price_package_found",
  };
});

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    const parsed = value.toNumber() as unknown;
    return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildBlockedCandidate = (
  ticker: CoreTicker,
  existingRows: number,
  latestExistingSummary: {
    closePrice: number | null;
    priceDate: string | null;
    sourceLabel: string | null;
    dataMode: string | null;
  } | null,
): MarketPriceCandidate => ({
  ticker,
  closePrice: null,
  priceDate: null,
  providerPeriod: null,
  currency: null,
  exchange: null,
  volume: null,
  liquidity: null,
  averageTradingValue: null,
  sourceType: null,
  sourceLabel: null,
  sourceUrl: null,
  reviewNote:
    existingRows > 0
      ? "Existing local MarketPrice rows were found, but this dry-run did not find a reviewed source package proving they are eligible for ScreeningCandidate backfill."
      : "No eligible local reviewed MarketPrice source package was found. VNStock/staging scripts require provider fetch or staging context and are not used in Phase 151Z.",
  warningCodes: [
    "MARKET_PRICE_SOURCE_MISSING",
    "NO_PROVIDER_FETCH",
    "NEEDS_REVIEW",
    "RESEARCH_ONLY",
  ],
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
  eligibleForMarketPriceConfirmWrite: false,
  blocker:
    existingRows > 0
      ? "existing_market_price_rows_missing_reviewed_source_package"
      : "reviewed_market_price_source_package_missing",
  sourceDecision:
    existingRows > 0
      ? `blocked: local rows exist (${existingRows}) but reviewed MarketPrice source package is not established. Latest observed source=${latestExistingSummary?.sourceLabel ?? "unknown"}.`
      : "blocked: no reviewed/local MarketPrice source package with closePrice, priceDate, and source metadata was found without provider fetch.",
});

async function run() {
  const existingMarketRows = await prisma.marketPrice.findMany({
    where: { ticker: { in: [...targetTickers] } },
    orderBy: [{ ticker: "asc" }, { tradingDate: "desc" }],
    select: {
      ticker: true,
      closePrice: true,
      tradingDate: true,
      sourceLabel: true,
      dataMode: true,
    },
  });

  const existingByTicker = new Map<CoreTicker, typeof existingMarketRows>();
  for (const ticker of targetTickers) {
    existingByTicker.set(
      ticker,
      existingMarketRows.filter((row) => row.ticker === ticker),
    );
  }

  const candidates: MarketPriceCandidate[] = targetTickers.map((ticker) => {
    const rows = existingByTicker.get(ticker) ?? [];
    const latest = rows[0];
    return buildBlockedCandidate(
      ticker,
      rows.length,
      latest
        ? {
            closePrice: toNumber(latest.closePrice),
            priceDate: latest.tradingDate.toISOString().slice(0, 10),
            sourceLabel: latest.sourceLabel,
            dataMode: latest.dataMode,
          }
        : null,
    );
  });

  const scannedCandidateText = JSON.stringify(candidates);
  const forbiddenAdviceDetected = forbiddenAdvicePatterns.some((pattern) => pattern.test(scannedCandidateText));
  const eligibleMarketPriceCandidates = candidates.filter(
    (candidate) => candidate.eligibleForMarketPriceConfirmWrite,
  ).length;
  const blockedMarketPriceCandidates = candidates.length - eligibleMarketPriceCandidates;

  const summary = {
    phase,
    mode: "dry_run",
    targetTickers,
    marketPriceCandidatesPrepared: candidates.length,
    eligibleMarketPriceCandidates,
    blockedMarketPriceCandidates,
    readyForMarketPriceConfirmWriteByTicker: Object.fromEntries(
      candidates.map((candidate) => [candidate.ticker, candidate.eligibleForMarketPriceConfirmWrite]),
    ),
    tickersReadyForMarketPriceConfirmWrite: candidates
      .filter((candidate) => candidate.eligibleForMarketPriceConfirmWrite)
      .map((candidate) => candidate.ticker),
    tickersBlocked: candidates
      .filter((candidate) => !candidate.eligibleForMarketPriceConfirmWrite)
      .map((candidate) => candidate.ticker),
    missingMarketPriceFieldsByTicker: Object.fromEntries(
      candidates.map((candidate) => [
        candidate.ticker,
        [
          ...(candidate.closePrice === null ? ["closePrice"] : []),
          ...(candidate.priceDate === null && candidate.providerPeriod === null ? ["priceDate_or_providerPeriod"] : []),
          ...(candidate.currency === null ? ["currency"] : []),
          ...(candidate.sourceType === null ? ["sourceType"] : []),
          ...(candidate.sourceLabel === null ? ["sourceLabel"] : []),
          ...(candidate.volume === null ? ["volume"] : []),
          ...(candidate.liquidity === null ? ["liquidity"] : []),
        ],
      ]),
    ),
    sourceDecisionByTicker: Object.fromEntries(
      candidates.map((candidate) => [candidate.ticker, candidate.sourceDecision]),
    ),
    wouldClose151UMarketPriceBlockerByTicker: Object.fromEntries(
      candidates.map((candidate) => [candidate.ticker, candidate.eligibleForMarketPriceConfirmWrite]),
    ),
    existingLocalMarketPriceRowsByTicker: Object.fromEntries(
      targetTickers.map((ticker) => [ticker, existingByTicker.get(ticker)?.length ?? 0]),
    ),
    inspectedSources,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    uiChanged: false,
    assistantChanged: false,
    screeningCandidateWriteAttempted: false,
    financialStatementWriteAttempted: false,
    companyIndustryWriteAttempted: false,
    productionApprovedTrueCount: candidates.filter((candidate) => candidate.productionApproved).length,
    hsgNkgUntouched: true,
    tvnPresent: scannedCandidateText.includes("TVN"),
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated: false,
    forbiddenAdviceDetected,
    smokePassed:
      eligibleMarketPriceCandidates === 0 &&
      blockedMarketPriceCandidates === targetTickers.length &&
      !forbiddenAdviceDetected &&
      !scannedCandidateText.includes("TVN"),
  };

  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();

  if (!summary.smokePassed) {
    process.exitCode = 1;
  }
}

run().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
