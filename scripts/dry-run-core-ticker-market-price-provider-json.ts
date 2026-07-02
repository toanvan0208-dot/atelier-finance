import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

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
  eligibleForMarketPriceConfirmWrite: boolean;
  blocker: string | null;
  sourceDecision: string;
};

const phase = "152A";
const jsonPath = "data/manual-review/market-price/core-ticker-vnstock-market-price-snapshot-2026-07-02.json";
const targetTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"] as const;
const requiredFields = [
  "ticker",
  "closePrice",
  "rawClosePrice",
  "rawPriceUnit",
  "priceScaleFactor",
  "priceUnit",
  "priceDate",
  "providerPeriod",
  "currency",
  "exchange",
  "volume",
  "volumeUnit",
  "liquidity",
  "liquidityUnit",
  "sourceType",
  "sourceLabel",
  "dataMode",
  "needsReview",
  "productionApproved",
  "warningCodes",
  "fetchStatus",
] as const;
const requiredWarningCodes = [
  "PROVIDER_SNAPSHOT",
  "NEEDS_REVIEW",
  "RESEARCH_ONLY",
  "MARKET_PRICE_NOT_AUDITED",
  "STALE_SNAPSHOT_CHECK_REQUIRED",
  "RAW_PRICE_UNIT_THOUSAND_VND_PER_SHARE",
  "PRICE_SCALED_TO_VND_PER_SHARE",
] as const;
const forbiddenFieldPatterns = [
  /ranking/i,
  /scoring/i,
  /score/i,
  /attractiveness/i,
  /recommendation/i,
  /target.?price/i,
  /fair.?value/i,
  /upside/i,
  /downside/i,
  /benchmark/i,
  /buy/i,
  /sell/i,
  /hold/i,
  /khuyến nghị/i,
  /giá mục tiêu/i,
  /giá trị hợp lý/i,
  /tiềm năng tăng giá/i,
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
    if (value.trim().toLowerCase() === "true") return true;
    if (value.trim().toLowerCase() === "false") return false;
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

const isRawJsonCommitted = (): boolean => {
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

const hasForbiddenAdviceShape = (row: RawMarketPriceRow): boolean => {
  const keyText = Object.keys(row).join(" ");
  if (forbiddenFieldPatterns.some((pattern) => pattern.test(keyText))) return true;

  const selectedTextValues = [
    row.reviewNote,
    row.sourceLabel,
    row.sourceType,
    row.warningCodes,
  ];

  return forbiddenFieldPatterns.some((pattern) =>
    selectedTextValues.some((value) => pattern.test(JSON.stringify(value ?? ""))),
  );
};

const buildCandidate = (
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
      eligibleForMarketPriceConfirmWrite: false,
      blocker: "market_price_json_row_missing",
      sourceDecision: "blocked: required ticker row is missing from provider snapshot JSON.",
    };
  }

  const closePrice = toNumber(row.closePrice);
  const rawClosePrice = toNumber(row.rawClosePrice);
  const rawPriceUnit = toStringOrNull(row.rawPriceUnit);
  const priceScaleFactor = toNumber(row.priceScaleFactor);
  const priceUnit = toStringOrNull(row.priceUnit);
  const priceDate = toStringOrNull(row.priceDate);
  const providerPeriod = toStringOrNull(row.providerPeriod);
  const currency = toStringOrNull(row.currency);
  const exchange = toStringOrNull(row.exchange);
  const volume = toNumber(row.volume);
  const volumeUnit = toStringOrNull(row.volumeUnit);
  const liquidity = toNumber(row.liquidity);
  const liquidityUnit = toStringOrNull(row.liquidityUnit);
  const sourceType = toStringOrNull(row.sourceType);
  const sourceLabel = toStringOrNull(row.sourceLabel);
  const dataMode = toStringOrNull(row.dataMode);
  const needsReview = toBooleanOrNull(row.needsReview);
  const productionApproved = toBooleanOrNull(row.productionApproved);
  const fetchStatus = toStringOrNull(row.fetchStatus);
  const warningCodes = toWarningCodes(row.warningCodes);

  const missingFields = requiredFields.filter((field) => row[field] === undefined || row[field] === null || row[field] === "");
  const missingWarningCodes = requiredWarningCodes.filter((code) => !warningCodes.includes(code));
  const expectedLiquidity =
    closePrice !== null && volume !== null ? closePrice * volume : null;
  const liquidityTolerance = expectedLiquidity === null ? 0 : Math.max(1, Math.abs(expectedLiquidity) * 1e-8);
  const liquidityConsistent =
    expectedLiquidity !== null &&
    liquidity !== null &&
    Math.abs(liquidity - expectedLiquidity) <= liquidityTolerance;
  const sourceLabelAccepted =
    sourceLabel !== null &&
    sourceLabel.toLowerCase().includes("vnstock") &&
    sourceLabel.toLowerCase().includes("market price snapshot");

  const blockers = [
    ...(duplicateCount > 1 ? ["duplicate_ticker_rows"] : []),
    ...missingFields.map((field) => `missing_${field}`),
    ...(closePrice === null || closePrice <= 0 ? ["closePrice_missing_or_non_positive"] : []),
    ...(volume === null || volume <= 0 ? ["volume_missing_or_non_positive"] : []),
    ...(liquidity === null ? ["liquidity_missing"] : []),
    ...(liquidity !== null && !liquidityConsistent ? ["liquidity_inconsistent_with_closePrice_times_volume"] : []),
    ...(priceDate === null || providerPeriod === null ? ["priceDate_or_providerPeriod_missing"] : []),
    ...(sourceType !== "provider_snapshot" ? ["sourceType_not_provider_snapshot"] : []),
    ...(!sourceLabelAccepted ? ["sourceLabel_not_vnstock_market_price_snapshot"] : []),
    ...(dataMode !== "research_only" ? ["dataMode_not_research_only"] : []),
    ...(needsReview !== true ? ["needsReview_not_true"] : []),
    ...(productionApproved !== false ? ["productionApproved_not_false"] : []),
    ...(rawPriceUnit !== "thousand_vnd_per_share" ? ["rawPriceUnit_not_thousand_vnd_per_share"] : []),
    ...(priceUnit !== "vnd_per_share" ? ["priceUnit_not_vnd_per_share"] : []),
    ...(priceScaleFactor !== 1000 ? ["priceScaleFactor_not_1000"] : []),
    ...(currency !== "VND" ? ["currency_not_VND"] : []),
    ...(volumeUnit !== "shares" ? ["volumeUnit_not_shares"] : []),
    ...(liquidityUnit !== "vnd" ? ["liquidityUnit_not_vnd"] : []),
    ...(fetchStatus !== "ok" ? ["fetchStatus_not_ok"] : []),
    ...missingWarningCodes.map((code) => `missing_warning_${code}`),
    ...(hasForbiddenAdviceShape(row) ? ["forbidden_advice_or_ranking_field_detected"] : []),
  ];

  const eligible = blockers.length === 0;

  return {
    ticker,
    closePrice,
    rawClosePrice,
    rawPriceUnit,
    priceScaleFactor,
    priceUnit,
    priceDate,
    providerPeriod,
    currency,
    exchange,
    volume,
    volumeUnit,
    liquidity,
    liquidityUnit,
    sourceType,
    sourceLabel,
    dataMode,
    needsReview,
    productionApproved,
    fetchStatus,
    warningCodes,
    eligibleForMarketPriceConfirmWrite: eligible,
    blocker: eligible ? null : blockers.join(";"),
    sourceDecision: eligible
      ? "accepted: normalized VNStock provider snapshot has closePrice, date/period, units, source metadata, caveats, and research-only guardrails."
      : `blocked: ${blockers.join(";")}`,
  };
};

const fullJsonPath = join(process.cwd(), jsonPath);
const jsonFound = existsSync(fullJsonPath);
const rawJsonCommitted = isRawJsonCommitted();
const parsedPayload = jsonFound ? JSON.parse(readFileSync(fullJsonPath, "utf-8")) : [];
const rows = getRows(parsedPayload);
const rowsByTicker = new Map<string, RawMarketPriceRow[]>();

for (const row of rows) {
  const ticker = toStringOrNull(row.ticker)?.toUpperCase() ?? "";
  if (!rowsByTicker.has(ticker)) rowsByTicker.set(ticker, []);
  rowsByTicker.get(ticker)?.push(row);
}

const unsupportedTickers = [...rowsByTicker.keys()].filter((ticker) => !targetTickerSet.has(ticker));
const candidates = targetTickers.map((ticker) =>
  buildCandidate(ticker, rowsByTicker.get(ticker)?.[0], rowsByTicker.get(ticker)?.length ?? 0),
);
const productionApprovedTrueCount = candidates.filter((candidate) => candidate.productionApproved === true).length;
const forbiddenAdviceDetected =
  unsupportedTickers.some((ticker) => forbiddenFieldPatterns.some((pattern) => pattern.test(ticker))) ||
  rows.some((row) => hasForbiddenAdviceShape(row));
const eligibleMarketPriceCandidates = candidates.filter(
  (candidate) => candidate.eligibleForMarketPriceConfirmWrite,
).length;
const blockedMarketPriceCandidates = candidates.length - eligibleMarketPriceCandidates;
const manualJsonAccepted =
  jsonFound &&
  unsupportedTickers.length === 0 &&
  eligibleMarketPriceCandidates === targetTickers.length &&
  productionApprovedTrueCount === 0 &&
  !forbiddenAdviceDetected &&
  !rawJsonCommitted;

const summary = {
  phase,
  mode: "dry_run",
  jsonPath,
  jsonFound,
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
  closePriceByTicker: Object.fromEntries(candidates.map((candidate) => [candidate.ticker, candidate.closePrice])),
  priceDateOrProviderPeriodByTicker: Object.fromEntries(
    candidates.map((candidate) => [
      candidate.ticker,
      candidate.priceDate ?? candidate.providerPeriod,
    ]),
  ),
  volumeByTicker: Object.fromEntries(candidates.map((candidate) => [candidate.ticker, candidate.volume])),
  liquidityByTicker: Object.fromEntries(candidates.map((candidate) => [candidate.ticker, candidate.liquidity])),
  warningCodesByTicker: Object.fromEntries(candidates.map((candidate) => [candidate.ticker, candidate.warningCodes])),
  missingMarketPriceFieldsByTicker: Object.fromEntries(
    candidates.map((candidate) => [
      candidate.ticker,
      [
        ...(candidate.closePrice === null ? ["closePrice"] : []),
        ...(candidate.rawClosePrice === null ? ["rawClosePrice"] : []),
        ...(candidate.rawPriceUnit === null ? ["rawPriceUnit"] : []),
        ...(candidate.priceScaleFactor === null ? ["priceScaleFactor"] : []),
        ...(candidate.priceUnit === null ? ["priceUnit"] : []),
        ...(candidate.priceDate === null ? ["priceDate"] : []),
        ...(candidate.providerPeriod === null ? ["providerPeriod"] : []),
        ...(candidate.currency === null ? ["currency"] : []),
        ...(candidate.exchange === null ? ["exchange"] : []),
        ...(candidate.volume === null ? ["volume"] : []),
        ...(candidate.volumeUnit === null ? ["volumeUnit"] : []),
        ...(candidate.liquidity === null ? ["liquidity"] : []),
        ...(candidate.liquidityUnit === null ? ["liquidityUnit"] : []),
        ...(candidate.sourceType === null ? ["sourceType"] : []),
        ...(candidate.sourceLabel === null ? ["sourceLabel"] : []),
        ...(candidate.dataMode === null ? ["dataMode"] : []),
        ...(candidate.needsReview === null ? ["needsReview"] : []),
        ...(candidate.productionApproved === null ? ["productionApproved"] : []),
        ...(candidate.warningCodes.length === 0 ? ["warningCodes"] : []),
        ...(candidate.fetchStatus === null ? ["fetchStatus"] : []),
      ],
    ]),
  ),
  sourceDecisionByTicker: Object.fromEntries(
    candidates.map((candidate) => [candidate.ticker, candidate.sourceDecision]),
  ),
  manualJsonAccepted,
  wouldClose151ZMarketPriceBlocker: manualJsonAccepted,
  unsupportedTickers,
  dbWriteAttempted: false,
  schemaChanged: false,
  providerFetchAttempted: false,
  uiChanged: false,
  assistantChanged: false,
  screeningCandidateWriteAttempted: false,
  financialStatementWriteAttempted: false,
  companyIndustryWriteAttempted: false,
  productionApprovedTrueCount,
  hsgNkgUntouched: true,
  tvnPresent: unsupportedTickers.includes("TVN"),
  rawJsonCommitted,
  rankingCreated: false,
  stockAttractivenessScoreCreated: false,
  industryMetricCreated: false,
  benchmarkCreated: false,
  forbiddenAdviceDetected,
  smokePassed:
    manualJsonAccepted &&
    unsupportedTickers.length === 0 &&
    productionApprovedTrueCount === 0 &&
    !forbiddenAdviceDetected,
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.smokePassed) {
  process.exitCode = 1;
}
