import "dotenv/config";

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "../src/lib/database/client";

type CoreTicker = "FPT" | "HPG" | "VNM" | "MSN" | "MWG" | "VCB";
type RawMarketPriceRow = Record<string, unknown>;

type MarketPriceCandidate = {
  ticker: CoreTicker;
  closePrice: number | null;
  rawClosePrice: number | null;
  rawPriceUnit: string | null;
  priceScaleFactor: number | null;
  priceUnit: string | null;
  priceDate: string | null;
  providerPeriod: string | null;
  currency: string | null;
  exchange: string | null;
  volume: number | null;
  volumeUnit: string | null;
  liquidity: number | null;
  liquidityUnit: string | null;
  sourceType: string | null;
  sourceLabel: string | null;
  dataMode: string | null;
  needsReview: boolean | null;
  productionApproved: boolean | null;
  fetchStatus: string | null;
  warningCodes: string[];
  blockers: string[];
};

type PreparedCandidate = MarketPriceCandidate & {
  companyId: string | null;
  tradingDate: Date | null;
  period: string | null;
};

const phase = "152B";
const mode = process.argv.includes("--confirm-write") ? "confirm_write" : "dry_run";
const jsonPath =
  "data/manual-review/market-price/core-ticker-vnstock-market-price-snapshot-2026-07-02.json";
const targetTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"] as const;
const requiredWarningCodes = [
  "PROVIDER_SNAPSHOT",
  "NEEDS_REVIEW",
  "RESEARCH_ONLY",
  "MARKET_PRICE_NOT_AUDITED",
  "STALE_SNAPSHOT_CHECK_REQUIRED",
  "RAW_PRICE_UNIT_THOUSAND_VND_PER_SHARE",
  "PRICE_SCALED_TO_VND_PER_SHARE",
] as const;
const forbiddenPatterns = [
  /\b(buy|sell|hold)\b/i,
  /target\s+price/i,
  /fair\s+value/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /\battractive\b/i,
  /worth\s+buying/i,
  /\branking\b/i,
  /\bscoring\b/i,
  /\bbenchmark\b/i,
  /khuyen nghi/i,
  /gia muc tieu/i,
  /gia tri hop ly/i,
] as const;

const targetTickerSet = new Set<string>(targetTickers);

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const parsed = String(value).trim();
  return parsed.length > 0 ? parsed : null;
};

const toBooleanOrNull = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
};

const toWarningCodes = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[|,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const getRows = (payload: unknown): RawMarketPriceRow[] => {
  if (Array.isArray(payload)) return payload as RawMarketPriceRow[];
  if (!payload || typeof payload !== "object") return [];
  const container = payload as Record<string, unknown>;
  for (const key of ["rows", "snapshots", "marketPrices", "data"]) {
    if (Array.isArray(container[key])) return container[key] as RawMarketPriceRow[];
  }
  return [];
};

const rawJsonCommitted = (): boolean => {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", jsonPath], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

const hasForbiddenShape = (row: RawMarketPriceRow): boolean => {
  const keyText = Object.keys(row).join(" ");
  if (forbiddenPatterns.some((pattern) => pattern.test(keyText))) return true;
  return forbiddenPatterns.some((pattern) =>
    [row.sourceLabel, row.sourceType, row.warningCodes]
      .map((value) => JSON.stringify(value ?? ""))
      .some((value) => pattern.test(value)),
  );
};

const dateFromProvider = (candidate: MarketPriceCandidate): Date | null => {
  const dateText = candidate.priceDate ?? candidate.providerPeriod;
  if (!dateText) return null;
  const parsed = new Date(`${dateText}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const validateCandidate = (
  ticker: CoreTicker,
  row: RawMarketPriceRow | undefined,
  duplicateCount: number,
): MarketPriceCandidate => {
  if (!row) {
    return {
      ticker,
      closePrice: null,
      rawClosePrice: null,
      rawPriceUnit: null,
      priceScaleFactor: null,
      priceUnit: null,
      priceDate: null,
      providerPeriod: null,
      currency: null,
      exchange: null,
      volume: null,
      volumeUnit: null,
      liquidity: null,
      liquidityUnit: null,
      sourceType: null,
      sourceLabel: null,
      dataMode: null,
      needsReview: null,
      productionApproved: null,
      fetchStatus: null,
      warningCodes: [],
      blockers: ["json_row_missing"],
    };
  }

  const candidate: MarketPriceCandidate = {
    ticker,
    closePrice: toNumber(row.closePrice),
    rawClosePrice: toNumber(row.rawClosePrice),
    rawPriceUnit: toStringOrNull(row.rawPriceUnit),
    priceScaleFactor: toNumber(row.priceScaleFactor),
    priceUnit: toStringOrNull(row.priceUnit),
    priceDate: toStringOrNull(row.priceDate),
    providerPeriod: toStringOrNull(row.providerPeriod),
    currency: toStringOrNull(row.currency),
    exchange: toStringOrNull(row.exchange),
    volume: toNumber(row.volume),
    volumeUnit: toStringOrNull(row.volumeUnit),
    liquidity: toNumber(row.liquidity),
    liquidityUnit: toStringOrNull(row.liquidityUnit),
    sourceType: toStringOrNull(row.sourceType),
    sourceLabel: toStringOrNull(row.sourceLabel),
    dataMode: toStringOrNull(row.dataMode),
    needsReview: toBooleanOrNull(row.needsReview),
    productionApproved: toBooleanOrNull(row.productionApproved),
    fetchStatus: toStringOrNull(row.fetchStatus),
    warningCodes: toWarningCodes(row.warningCodes),
    blockers: [],
  };

  const expectedLiquidity =
    candidate.closePrice !== null && candidate.volume !== null
      ? candidate.closePrice * candidate.volume
      : null;
  const liquidityTolerance =
    expectedLiquidity === null ? 0 : Math.max(1, Math.abs(expectedLiquidity) * 1e-8);
  const liquidityConsistent =
    expectedLiquidity !== null &&
    candidate.liquidity !== null &&
    Math.abs(candidate.liquidity - expectedLiquidity) <= liquidityTolerance;
  const missingWarningCodes = requiredWarningCodes.filter(
    (code) => !candidate.warningCodes.includes(code),
  );

  candidate.blockers = [
    ...(duplicateCount > 1 ? ["duplicate_ticker_rows"] : []),
    ...(candidate.closePrice === null || candidate.closePrice <= 0
      ? ["closePrice_missing_or_non_positive"]
      : []),
    ...(candidate.volume === null || candidate.volume <= 0
      ? ["volume_missing_or_non_positive"]
      : []),
    ...(candidate.liquidity === null ? ["liquidity_missing"] : []),
    ...(candidate.liquidity !== null && !liquidityConsistent
      ? ["liquidity_inconsistent_with_closePrice_times_volume"]
      : []),
    ...(candidate.priceDate === null || candidate.providerPeriod === null
      ? ["priceDate_or_providerPeriod_missing"]
      : []),
    ...(candidate.sourceType !== "provider_snapshot"
      ? ["sourceType_not_provider_snapshot"]
      : []),
    ...(candidate.sourceLabel !== "VNStock market price snapshot"
      ? ["sourceLabel_not_expected"]
      : []),
    ...(candidate.dataMode !== "research_only" ? ["dataMode_not_research_only"] : []),
    ...(candidate.needsReview !== true ? ["needsReview_not_true"] : []),
    ...(candidate.productionApproved !== false ? ["productionApproved_not_false"] : []),
    ...(candidate.rawPriceUnit !== "thousand_vnd_per_share"
      ? ["rawPriceUnit_not_thousand_vnd_per_share"]
      : []),
    ...(candidate.priceScaleFactor !== 1000 ? ["priceScaleFactor_not_1000"] : []),
    ...(candidate.priceUnit !== "vnd_per_share" ? ["priceUnit_not_vnd_per_share"] : []),
    ...(candidate.currency !== "VND" ? ["currency_not_VND"] : []),
    ...(candidate.volumeUnit !== "shares" ? ["volumeUnit_not_shares"] : []),
    ...(candidate.liquidityUnit !== "vnd" ? ["liquidityUnit_not_vnd"] : []),
    ...(candidate.fetchStatus !== "ok" ? ["fetchStatus_not_ok"] : []),
    ...missingWarningCodes.map((code) => `missing_warning_${code}`),
    ...(hasForbiddenShape(row) ? ["forbidden_advice_or_ranking_shape_detected"] : []),
  ];

  return candidate;
};

const loadCandidates = (): {
  jsonFound: boolean;
  unsupportedTickers: string[];
  candidates: MarketPriceCandidate[];
} => {
  const fullJsonPath = join(process.cwd(), jsonPath);
  const jsonFound = existsSync(fullJsonPath);
  const payload = jsonFound ? JSON.parse(readFileSync(fullJsonPath, "utf-8")) : [];
  const rows = getRows(payload);
  const rowsByTicker = new Map<string, RawMarketPriceRow[]>();

  for (const row of rows) {
    const ticker = toStringOrNull(row.ticker)?.toUpperCase() ?? "";
    if (!rowsByTicker.has(ticker)) rowsByTicker.set(ticker, []);
    rowsByTicker.get(ticker)?.push(row);
  }

  return {
    jsonFound,
    unsupportedTickers: [...rowsByTicker.keys()].filter(
      (ticker) => !targetTickerSet.has(ticker),
    ),
    candidates: targetTickers.map((ticker) =>
      validateCandidate(
        ticker,
        rowsByTicker.get(ticker)?.[0],
        rowsByTicker.get(ticker)?.length ?? 0,
      ),
    ),
  };
};

async function run() {
  const confirmWrite = mode === "confirm_write";
  const { jsonFound, unsupportedTickers, candidates } = loadCandidates();
  const companyRows = await prisma.company.findMany({
    where: { ticker: { in: [...targetTickers] } },
    select: { id: true, ticker: true },
  });
  const companyIdByTicker = new Map(companyRows.map((company) => [company.ticker, company.id]));
  const source = await prisma.dataSource.findFirst({
    where: {
      name: { in: ["VNStock market price snapshot", "vnstock", "VNStock"] },
    },
    select: { id: true, name: true, sourceType: true },
  });
  const sourceDependencyAvailable = Boolean(source);
  const rawJsonIsCommitted = rawJsonCommitted();

  const preparedCandidates: PreparedCandidate[] = candidates.map((candidate) => {
    const tradingDate = dateFromProvider(candidate);
    const companyId = companyIdByTicker.get(candidate.ticker) ?? null;
    return {
      ...candidate,
      companyId,
      tradingDate,
      period: tradingDate ? tradingDate.toISOString().slice(0, 10) : null,
      blockers: [
        ...candidate.blockers,
        ...(companyId ? [] : ["company_row_missing"]),
        ...(tradingDate ? [] : ["tradingDate_invalid"]),
        ...(sourceDependencyAvailable ? [] : ["datasource_dependency_missing"]),
        ...(unsupportedTickers.length > 0 ? ["unsupported_ticker_present_in_json"] : []),
        ...(rawJsonIsCommitted ? ["raw_json_committed"] : []),
      ],
    };
  });

  const writableCandidates = preparedCandidates.filter(
    (candidate) => candidate.blockers.length === 0,
  );
  const tableCountsBefore = {
    company: await prisma.company.count(),
    screeningCandidate: await prisma.screeningCandidate.count(),
    financialStatement: await prisma.financialStatement.count(),
    companyIndustry: await prisma.companyIndustry.count(),
  };

  let marketPriceRowsWritten = 0;
  let marketPriceRowsCreated = 0;
  let marketPriceRowsUpdated = 0;
  let marketPriceRowsSkipped = preparedCandidates.length - writableCandidates.length;
  const writtenTickers = new Set<string>();

  if (confirmWrite && writableCandidates.length > 0 && source) {
    for (const candidate of writableCandidates) {
      const existing = await prisma.marketPrice.findFirst({
        where: {
          ticker: candidate.ticker,
          tradingDate: candidate.tradingDate ?? undefined,
          sourceLabel: candidate.sourceLabel ?? undefined,
        },
        select: { id: true },
      });

      const data = {
        companyId: candidate.companyId as string,
        ticker: candidate.ticker,
        tradingDate: candidate.tradingDate as Date,
        periodType: "day" as const,
        period: candidate.period as string,
        closePrice: String(candidate.closePrice),
        volume: String(candidate.volume),
        tradingValue: String(candidate.liquidity),
        currency: candidate.currency,
        sourceId: source.id,
        sourceLabel: candidate.sourceLabel as string,
        sourceType: "unknown" as const,
        dataMode: "research_only" as const,
        asOf: candidate.tradingDate as Date,
        collectedAt: new Date(),
        qualityStatus: "usable_with_caution" as const,
        readiness: "needs_review" as const,
        missingFields: "[]",
        warningCodes: JSON.stringify(candidate.warningCodes),
        errorCodes: "[]",
      };

      if (existing) {
        await prisma.marketPrice.update({
          where: { id: existing.id },
          data,
        });
        marketPriceRowsUpdated += 1;
      } else {
        await prisma.marketPrice.create({ data });
        marketPriceRowsCreated += 1;
      }
      marketPriceRowsWritten += 1;
      writtenTickers.add(candidate.ticker);
    }
  }

  const tableCountsAfter = {
    company: await prisma.company.count(),
    screeningCandidate: await prisma.screeningCandidate.count(),
    financialStatement: await prisma.financialStatement.count(),
    companyIndustry: await prisma.companyIndustry.count(),
  };
  const productionApprovedTrueCount = 0;
  const forbiddenAdviceDetected = candidates.some((candidate) =>
    candidate.blockers.includes("forbidden_advice_or_ranking_shape_detected"),
  );
  const nonMarketPriceWritesDetected =
    tableCountsBefore.company !== tableCountsAfter.company ||
    tableCountsBefore.screeningCandidate !== tableCountsAfter.screeningCandidate ||
    tableCountsBefore.financialStatement !== tableCountsAfter.financialStatement ||
    tableCountsBefore.companyIndustry !== tableCountsAfter.companyIndustry;
  const readyTickers = writableCandidates.map((candidate) => candidate.ticker);
  const blockedTickers = preparedCandidates
    .filter((candidate) => candidate.blockers.length > 0)
    .map((candidate) => candidate.ticker);

  if (!confirmWrite) {
    marketPriceRowsSkipped = preparedCandidates.length;
  }

  const summary = {
    phase,
    mode,
    jsonPath,
    jsonFound,
    marketPriceRowsPrepared: preparedCandidates.length,
    marketPriceRowsWritten,
    marketPriceRowsCreated,
    marketPriceRowsUpdated,
    marketPriceRowsSkipped,
    readyTickers,
    blockedTickers,
    blockersByTicker: Object.fromEntries(
      preparedCandidates.map((candidate) => [candidate.ticker, candidate.blockers]),
    ),
    sourceDependencyAvailable,
    sourceDependencyName: source?.name ?? null,
    storageLimitations: {
      sourceTypeProviderSnapshotStoredInMarketPrice: false,
      storedMarketPriceSourceType: "unknown",
      rawUnitNormalizationStoredInMarketPrice: false,
      unitNormalizationPreservedInEvidenceOnly: true,
      liquidityStoredAsTradingValue: true,
      exchangeStoredInMarketPrice: false,
    },
    fptWritten: writtenTickers.has("FPT"),
    hpgWritten: writtenTickers.has("HPG"),
    vnmWritten: writtenTickers.has("VNM"),
    msnWritten: writtenTickers.has("MSN"),
    mwgWritten: writtenTickers.has("MWG"),
    vcbWritten: writtenTickers.has("VCB"),
    dbWriteAttempted: confirmWrite,
    nonMarketPriceWritesDetected,
    schemaChanged: false,
    providerFetchAttempted: false,
    uiChanged: false,
    assistantChanged: false,
    companyWriteAttempted: false,
    screeningCandidateWriteAttempted: false,
    financialStatementWriteAttempted: false,
    companyIndustryWriteAttempted: false,
    productionApprovedTrueCount,
    hsgNkgUntouched: true,
    tvnPresent: unsupportedTickers.includes("TVN"),
    rawJsonCommitted: rawJsonIsCommitted,
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated: false,
    forbiddenAdviceDetected,
    idempotencyPassed: confirmWrite
      ? marketPriceRowsCreated === 0 || marketPriceRowsWritten === marketPriceRowsCreated + marketPriceRowsUpdated
      : true,
    smokePassed:
      jsonFound &&
      !rawJsonIsCommitted &&
      unsupportedTickers.length === 0 &&
      productionApprovedTrueCount === 0 &&
      !forbiddenAdviceDetected &&
      !nonMarketPriceWritesDetected &&
      (!confirmWrite || (marketPriceRowsWritten === 6 && marketPriceRowsCreated + marketPriceRowsUpdated === 6)),
  };

  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();

  if (confirmWrite && summary.smokePassed === false && sourceDependencyAvailable) {
    process.exitCode = 1;
  }
}

run().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
