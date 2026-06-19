import type { DataQualityBannerProps } from "@/components/shared/DataQualityBanner";
import type { ValuationStatementSnapshot } from "@/features/valuation/lib/map-valuation-to-logic-input";

type ApiSuccessBody<T> = {
  ok: true;
  status: "success";
  data: T;
  meta?: Record<string, unknown>;
};

type ApiErrorBody = {
  ok: false;
  status: "error";
  error: {
    code: string;
    message: string;
    reason?: string;
  };
};

type ApiBody<T> = ApiSuccessBody<T> | ApiErrorBody;

type DataMode =
  | "sample"
  | "demo"
  | "user_input"
  | "research_only"
  | "production_approved"
  | "blocked"
  | "unknown";

type QualityStatus =
  | "good"
  | "usable_with_caution"
  | "partial"
  | "missing"
  | "stale"
  | "sample"
  | "demo"
  | "user_input"
  | "blocked"
  | "unknown";

type ReadinessStatus =
  | "ready"
  | "needs_review"
  | "not_ready"
  | "insufficient_data"
  | "unknown";

type CompanyType = "non_financial" | "bank" | "securities" | "insurance" | "unknown";
type PeriodType = "session" | "day" | "month" | "quarter" | "year" | "ttm" | "manual" | "unknown";

type SourceSummary = {
  name?: string | null;
  sourceType?: string | null;
  usageStatus?: string | null;
};

type FinancialStatementApiRecord = {
  ticker: string;
  companyType: CompanyType;
  periodType: PeriodType;
  period: string;
  revenue?: unknown;
  netIncome?: unknown;
  equity?: unknown;
  totalDebt?: unknown;
  operatingCashFlow?: unknown;
  eps?: unknown;
  bvps?: unknown;
  sharesOutstanding?: unknown;
  sourceLabel: string;
  sourceType: string;
  dataMode: DataMode;
  asOf: string;
  collectedAt?: string | null;
  qualityStatus: QualityStatus;
  readiness: ReadinessStatus;
  missingFields: string;
  warningCodes: string;
  errorCodes: string;
  source?: SourceSummary | null;
};

type MarketPriceApiRecord = {
  ticker: string;
  periodType: PeriodType;
  period: string;
  tradingDate: string;
  closePrice?: unknown;
  adjustedClosePrice?: unknown;
  sourceLabel: string;
  sourceType: string;
  dataMode: DataMode;
  asOf: string;
  collectedAt?: string | null;
  qualityStatus: QualityStatus;
  readiness: ReadinessStatus;
  missingFields: string;
  warningCodes: string;
  errorCodes: string;
  source?: SourceSummary | null;
};

type ApiReadResult<T> =
  | { ok: true; data: T; meta?: Record<string, unknown> }
  | { ok: false; code: string; message: string; httpStatus: number };

export type ValuationApiQuery = {
  ticker: string;
  dataMode?: DataMode;
};

export type ValuationApiMetadata = {
  ticker: string;
  financials?: {
    dataMode: DataMode;
    sourceType: string;
    qualityStatus: QualityStatus;
    readiness: ReadinessStatus;
    fallback: false;
  };
  marketPrice?: {
    dataMode: DataMode;
    sourceType: string;
    qualityStatus: QualityStatus;
    readiness: ReadinessStatus;
    fallback: false;
  };
  dataMode: string;
  sourceType: string;
  qualityStatus: string;
  readiness: ReadinessStatus;
  warningCodes: string[];
  errorCodes: string[];
  fallback: false;
};

export type ValuationApiInputs = {
  status: "ready" | "insufficient_data";
  ticker: string;
  snapshot: ValuationStatementSnapshot;
  dataQuality: DataQualityBannerProps;
  metadata: ValuationApiMetadata;
  missingReasons: string[];
};

export class ValuationApiError extends Error {
  constructor(
    message: string,
    readonly code = "VALUATION_API_ERROR",
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "ValuationApiError";
  }
}

const periodTypeToSnapshotType = (periodType: PeriodType): ValuationStatementSnapshot["periodType"] => {
  if (periodType === "year") return "annual";
  if (periodType === "quarter") return "quarter";
  if (periodType === "ttm") return "ttm";
  return "unknown";
};

const parseJsonStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "object" && "toString" in value) {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const buildLatestFinancialsEndpoint = ({ dataMode, ticker }: ValuationApiQuery): string => {
  const params = new URLSearchParams({ latest: "true" });
  if (dataMode) params.set("dataMode", dataMode);
  return `/api/companies/${encodeURIComponent(ticker.trim().toUpperCase())}/financials?${params.toString()}`;
};

const buildLatestMarketPriceEndpoint = ({ dataMode, ticker }: ValuationApiQuery): string => {
  const params = new URLSearchParams({ latest: "true" });
  if (dataMode) params.set("dataMode", dataMode);
  return `/api/companies/${encodeURIComponent(ticker.trim().toUpperCase())}/market-prices?${params.toString()}`;
};

const readApiBody = async <T>(response: Response): Promise<ApiBody<T> | null> => {
  try {
    return (await response.json()) as ApiBody<T>;
  } catch {
    return null;
  }
};

const requestApi = async <T>(endpoint: string, fetcher: typeof fetch): Promise<ApiReadResult<T>> => {
  const response = await fetcher(endpoint);
  const body = await readApiBody<T>(response);

  if (!response.ok || !body?.ok) {
    const apiError = body && !body.ok ? body.error : null;
    return {
      ok: false,
      code: apiError?.code ?? "VALUATION_API_REQUEST_FAILED",
      message: apiError?.message ?? "Unable to load valuation inputs.",
      httpStatus: response.status,
    };
  }

  return { ok: true, data: body.data, meta: body.meta };
};

const mergeMode = (financial?: string, market?: string): string => {
  const values = [financial, market].filter((value): value is string => Boolean(value));
  if (values.length === 0) return "unknown";
  return new Set(values).size === 1 ? values[0] : values.join(" + ");
};

const isDemoDataMode = (value?: string): boolean => value === "sample" || value === "demo";

const readinessFromMissing = (missingReasons: string[], financial?: FinancialStatementApiRecord): ReadinessStatus => {
  if (missingReasons.length > 0) return "insufficient_data";
  return financial?.readiness ?? "unknown";
};

const sourceName = (record?: FinancialStatementApiRecord | MarketPriceApiRecord): string | null =>
  record ? record.source?.name ?? record.sourceLabel : null;

const asOf = (record?: FinancialStatementApiRecord | MarketPriceApiRecord): string | null =>
  record ? record.collectedAt ?? record.asOf : null;

const buildMetadata = (
  ticker: string,
  missingReasons: string[],
  financial?: FinancialStatementApiRecord,
  market?: MarketPriceApiRecord,
): ValuationApiMetadata => {
  const financialWarnings = parseJsonStringArray(financial?.warningCodes);
  const marketWarnings = parseJsonStringArray(market?.warningCodes);
  const financialErrors = parseJsonStringArray(financial?.errorCodes);
  const marketErrors = parseJsonStringArray(market?.errorCodes);
  const sourceWarnings = [
    ...(financial?.dataMode === "user_input" || financial?.sourceType === "user_input" ? ["USER_INPUT_FINANCIALS"] : []),
    ...(market?.dataMode === "user_input" || market?.sourceType === "user_input" ? ["USER_INPUT_MARKET_PRICE"] : []),
  ];

  return {
    ticker,
    financials: financial
      ? {
          dataMode: financial.dataMode,
          sourceType: financial.source?.sourceType ?? financial.sourceType,
          qualityStatus: financial.qualityStatus,
          readiness: financial.readiness,
          fallback: false,
        }
      : undefined,
    marketPrice: market
      ? {
          dataMode: market.dataMode,
          sourceType: market.source?.sourceType ?? market.sourceType,
          qualityStatus: market.qualityStatus,
          readiness: market.readiness,
          fallback: false,
        }
      : undefined,
    dataMode: mergeMode(financial?.dataMode, market?.dataMode),
    sourceType: mergeMode(financial?.source?.sourceType ?? financial?.sourceType, market?.source?.sourceType ?? market?.sourceType),
    qualityStatus: mergeMode(financial?.qualityStatus, market?.qualityStatus),
    readiness: readinessFromMissing(missingReasons, financial),
    warningCodes: [...new Set([...sourceWarnings, ...financialWarnings, ...marketWarnings])],
    errorCodes: [...new Set([...financialErrors, ...marketErrors])],
    fallback: false,
  };
};

const buildSnapshot = (
  ticker: string,
  financial?: FinancialStatementApiRecord,
  market?: MarketPriceApiRecord,
): ValuationStatementSnapshot => {
  const closePrice = toNullableNumber(market?.adjustedClosePrice) ?? toNullableNumber(market?.closePrice);
  const eps = toNullableNumber(financial?.eps);

  return {
    ticker: financial?.ticker ?? market?.ticker ?? ticker,
    companyType: financial?.companyType ?? "unknown",
    period: financial?.period ?? market?.period,
    periodType: financial ? periodTypeToSnapshotType(financial.periodType) : "unknown",
    sourceName: [sourceName(financial), sourceName(market)].filter(Boolean).join(" + ") || null,
    collectedAt: asOf(financial) ?? asOf(market),
    revenue: toNullableNumber(financial?.revenue),
    netProfit: toNullableNumber(financial?.netIncome),
    totalEquity: toNullableNumber(financial?.equity),
    totalDebt: toNullableNumber(financial?.totalDebt),
    operatingCashFlow: toNullableNumber(financial?.operatingCashFlow),
    sharesOutstanding: eps === null ? null : toNullableNumber(financial?.sharesOutstanding),
    eps,
    bvps: toNullableNumber(financial?.bvps),
    closePrice,
  };
};

const buildMissingReasons = (
  financialResult: ApiReadResult<FinancialStatementApiRecord>,
  marketResult: ApiReadResult<MarketPriceApiRecord>,
  snapshot: ValuationStatementSnapshot,
): string[] => {
  const reasons = [
    ...(financialResult.ok ? [] : ["financial_statement"]),
    ...(marketResult.ok ? [] : ["market_price"]),
    ...(snapshot.eps === null || snapshot.eps === undefined ? ["eps"] : []),
    ...(snapshot.closePrice === null || snapshot.closePrice === undefined ? ["market_price_close"] : []),
    ...(snapshot.sharesOutstanding === null || snapshot.sharesOutstanding === undefined ? ["shares_outstanding"] : []),
    ...(snapshot.bvps === null || snapshot.bvps === undefined ? ["bvps"] : []),
  ];
  return [...new Set(reasons)];
};

export const fetchValuationInputsByTicker = async (
  query: ValuationApiQuery,
  fetcher: typeof fetch = fetch,
): Promise<ValuationApiInputs> => {
  const ticker = query.ticker.trim().toUpperCase();
  const [financialResult, marketResult] = await Promise.all([
    requestApi<FinancialStatementApiRecord>(buildLatestFinancialsEndpoint({ ...query, ticker }), fetcher),
    requestApi<MarketPriceApiRecord>(buildLatestMarketPriceEndpoint({ ...query, ticker }), fetcher),
  ]);

  const handledMissingCodes = new Set(["FINANCIALS_NOT_FOUND", "MARKET_PRICES_NOT_FOUND"]);
  const failedResult = [financialResult, marketResult].find(
    (result) => !result.ok && result.httpStatus !== 404 && !handledMissingCodes.has(result.code),
  );
  if (failedResult && !failedResult.ok) {
    throw new ValuationApiError(failedResult.message, failedResult.code, failedResult.httpStatus);
  }

  const financial = financialResult.ok ? financialResult.data : undefined;
  const market = marketResult.ok ? marketResult.data : undefined;
  const snapshot = buildSnapshot(ticker, financial, market);
  const missingReasons = buildMissingReasons(financialResult, marketResult, snapshot);
  const financialMissingFields = parseJsonStringArray(financial?.missingFields);
  const marketMissingFields = parseJsonStringArray(market?.missingFields);
  const metadata = buildMetadata(ticker, missingReasons, financial, market);

  return {
    status: missingReasons.length > 0 ? "insufficient_data" : "ready",
    ticker,
    snapshot,
    dataQuality: {
      source: snapshot.sourceName,
      asOf: snapshot.collectedAt,
      isDemoData: isDemoDataMode(financial?.dataMode) || isDemoDataMode(market?.dataMode),
      isStale: financial?.qualityStatus === "stale" || market?.qualityStatus === "stale",
      missingFields: [...new Set([...financialMissingFields, ...marketMissingFields, ...missingReasons])],
    },
    metadata,
    missingReasons,
  };
};

export const valuationApiClientInternals = {
  buildLatestFinancialsEndpoint,
  buildLatestMarketPriceEndpoint,
  buildMissingReasons,
  buildSnapshot,
  parseJsonStringArray,
  toNullableNumber,
};
