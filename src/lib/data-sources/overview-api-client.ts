import type { DataQualityBannerProps } from "@/components/shared/DataQualityBanner";
import type { OverviewStatementSnapshot } from "@/features/overview/lib/map-overview-to-logic-input";

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

type CompanyApiRecord = {
  ticker: string;
  exchange?: string | null;
  companyName: string;
  companyType: CompanyType;
  industryName?: string | null;
  dataMode: DataMode;
  profileAsOf?: string | null;
  profileSource?: SourceSummary | null;
};

type FinancialStatementApiRecord = {
  ticker: string;
  companyType: CompanyType;
  periodType: PeriodType;
  period: string;
  revenue?: unknown;
  grossProfit?: unknown;
  netIncome?: unknown;
  operatingCashFlow?: unknown;
  totalAssets?: unknown;
  equity?: unknown;
  totalDebt?: unknown;
  currentAssets?: unknown;
  currentLiabilities?: unknown;
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
  previousClose?: unknown;
  adjustedClosePrice?: unknown;
  volume?: unknown;
  tradingValue?: unknown;
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

export type OverviewApiQuery = {
  ticker: string;
  dataMode?: DataMode;
};

export type OverviewApiMetadata = {
  ticker: string;
  company?: {
    dataMode: DataMode;
    sourceType: string;
    fallback: false;
  };
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

export type OverviewApiInputs = {
  status: "ready" | "insufficient_data";
  ticker: string;
  companyName: string;
  industry: string;
  snapshot: OverviewStatementSnapshot;
  dataQuality: DataQualityBannerProps;
  metadata: OverviewApiMetadata;
  missingReasons: string[];
};

export class OverviewApiError extends Error {
  constructor(
    message: string,
    readonly code = "OVERVIEW_API_ERROR",
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "OverviewApiError";
  }
}

const periodTypeToSnapshotType = (periodType: PeriodType): OverviewStatementSnapshot["periodType"] => {
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

const buildCompanyEndpoint = ({ ticker }: OverviewApiQuery): string =>
  `/api/companies/${encodeURIComponent(ticker.trim().toUpperCase())}`;

const buildLatestFinancialsEndpoint = ({ dataMode, ticker }: OverviewApiQuery): string => {
  const params = new URLSearchParams({ latest: "true" });
  if (dataMode) params.set("dataMode", dataMode);
  return `/api/companies/${encodeURIComponent(ticker.trim().toUpperCase())}/financials?${params.toString()}`;
};

const buildLatestMarketPriceEndpoint = ({ dataMode, ticker }: OverviewApiQuery): string => {
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
      code: apiError?.code ?? "OVERVIEW_API_REQUEST_FAILED",
      message: apiError?.message ?? "Unable to load overview inputs.",
      httpStatus: response.status,
    };
  }

  return { ok: true, data: body.data, meta: body.meta };
};

const mergeMode = (...values: Array<string | undefined>): string => {
  const filtered = values.filter((value): value is string => Boolean(value));
  if (filtered.length === 0) return "unknown";
  return new Set(filtered).size === 1 ? filtered[0] : filtered.join(" + ");
};

const isDemoDataMode = (value?: string): boolean => value === "sample" || value === "demo";

const sourceName = (record?: FinancialStatementApiRecord | MarketPriceApiRecord): string | null =>
  record ? record.source?.name ?? record.sourceLabel : null;

const asOf = (record?: FinancialStatementApiRecord | MarketPriceApiRecord): string | null =>
  record ? record.collectedAt ?? record.asOf : null;

const readinessFromMissing = (missingReasons: string[], financial?: FinancialStatementApiRecord): ReadinessStatus => {
  if (missingReasons.length > 0) return "insufficient_data";
  return financial?.readiness ?? "unknown";
};

const buildSnapshot = (
  ticker: string,
  company?: CompanyApiRecord,
  financial?: FinancialStatementApiRecord,
  market?: MarketPriceApiRecord,
): OverviewStatementSnapshot => {
  const closePrice = toNullableNumber(market?.adjustedClosePrice) ?? toNullableNumber(market?.closePrice);
  const eps = toNullableNumber(financial?.eps);

  return {
    ticker: financial?.ticker ?? market?.ticker ?? company?.ticker ?? ticker,
    companyType: financial?.companyType ?? company?.companyType ?? "unknown",
    industry: company?.industryName ?? undefined,
    period: financial?.period ?? market?.period,
    periodType: financial ? periodTypeToSnapshotType(financial.periodType) : "unknown",
    sourceName: [sourceName(financial), sourceName(market)].filter(Boolean).join(" + ") || (company?.profileSource?.name ?? null),
    collectedAt: asOf(financial) ?? asOf(market) ?? company?.profileAsOf ?? null,
    revenue: toNullableNumber(financial?.revenue),
    grossProfit: toNullableNumber(financial?.grossProfit),
    netProfit: toNullableNumber(financial?.netIncome),
    totalAssets: toNullableNumber(financial?.totalAssets),
    totalEquity: toNullableNumber(financial?.equity),
    totalDebt: toNullableNumber(financial?.totalDebt),
    operatingCashFlow: toNullableNumber(financial?.operatingCashFlow),
    sharesOutstanding: eps === null ? null : toNullableNumber(financial?.sharesOutstanding),
    eps,
    bvps: toNullableNumber(financial?.bvps),
    closePrice,
    previousClosePrice: toNullableNumber(market?.previousClose),
    volume: toNullableNumber(market?.volume),
    avgTradingValue20d: toNullableNumber(market?.tradingValue),
  };
};

const buildMissingReasons = (
  companyResult: ApiReadResult<CompanyApiRecord>,
  financialResult: ApiReadResult<FinancialStatementApiRecord>,
  marketResult: ApiReadResult<MarketPriceApiRecord>,
  snapshot: OverviewStatementSnapshot,
): string[] => {
  const reasons = [
    ...(companyResult.ok ? [] : ["company"]),
    ...(financialResult.ok ? [] : ["financial_statement"]),
    ...(marketResult.ok ? [] : ["market_price"]),
    ...(snapshot.netProfit === null || snapshot.netProfit === undefined ? ["net_income"] : []),
    ...(snapshot.totalEquity === null || snapshot.totalEquity === undefined ? ["equity"] : []),
    ...(snapshot.closePrice === null || snapshot.closePrice === undefined ? ["market_price_close"] : []),
    ...(snapshot.eps === null || snapshot.eps === undefined ? ["eps"] : []),
  ];
  return [...new Set(reasons)];
};

const buildMetadata = (
  ticker: string,
  missingReasons: string[],
  company?: CompanyApiRecord,
  financial?: FinancialStatementApiRecord,
  market?: MarketPriceApiRecord,
): OverviewApiMetadata => {
  const financialWarnings = parseJsonStringArray(financial?.warningCodes);
  const marketWarnings = parseJsonStringArray(market?.warningCodes);
  const financialErrors = parseJsonStringArray(financial?.errorCodes);
  const marketErrors = parseJsonStringArray(market?.errorCodes);
  const sourceWarnings = [
    ...(company?.dataMode === "user_input" ? ["USER_INPUT_COMPANY"] : []),
    ...(financial?.dataMode === "user_input" || financial?.sourceType === "user_input" ? ["USER_INPUT_FINANCIALS"] : []),
    ...(market?.dataMode === "user_input" || market?.sourceType === "user_input" ? ["USER_INPUT_MARKET_PRICE"] : []),
  ];

  return {
    ticker,
    company: company
      ? {
          dataMode: company.dataMode,
          sourceType: company.profileSource?.sourceType ?? "unknown",
          fallback: false,
        }
      : undefined,
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
    dataMode: mergeMode(company?.dataMode, financial?.dataMode, market?.dataMode),
    sourceType: mergeMode(
      company?.profileSource?.sourceType ?? undefined,
      financial?.source?.sourceType ?? financial?.sourceType,
      market?.source?.sourceType ?? market?.sourceType,
    ),
    qualityStatus: mergeMode(financial?.qualityStatus, market?.qualityStatus),
    readiness: readinessFromMissing(missingReasons, financial),
    warningCodes: [...new Set([...sourceWarnings, ...financialWarnings, ...marketWarnings])],
    errorCodes: [...new Set([...financialErrors, ...marketErrors])],
    fallback: false,
  };
};

export const fetchOverviewInputsByTicker = async (
  query: OverviewApiQuery,
  fetcher: typeof fetch = fetch,
): Promise<OverviewApiInputs> => {
  const ticker = query.ticker.trim().toUpperCase();
  const [companyResult, financialResult, marketResult] = await Promise.all([
    requestApi<CompanyApiRecord>(buildCompanyEndpoint({ ...query, ticker }), fetcher),
    requestApi<FinancialStatementApiRecord>(buildLatestFinancialsEndpoint({ ...query, ticker }), fetcher),
    requestApi<MarketPriceApiRecord>(buildLatestMarketPriceEndpoint({ ...query, ticker }), fetcher),
  ]);

  const handledMissingCodes = new Set(["COMPANY_NOT_FOUND", "FINANCIALS_NOT_FOUND", "MARKET_PRICES_NOT_FOUND"]);
  const failedResult = [companyResult, financialResult, marketResult].find(
    (result) => !result.ok && result.httpStatus !== 404 && !handledMissingCodes.has(result.code),
  );
  if (failedResult && !failedResult.ok) {
    throw new OverviewApiError(failedResult.message, failedResult.code, failedResult.httpStatus);
  }

  const company = companyResult.ok ? companyResult.data : undefined;
  const financial = financialResult.ok ? financialResult.data : undefined;
  const market = marketResult.ok ? marketResult.data : undefined;
  const snapshot = buildSnapshot(ticker, company, financial, market);
  const missingReasons = buildMissingReasons(companyResult, financialResult, marketResult, snapshot);
  const financialMissingFields = parseJsonStringArray(financial?.missingFields);
  const marketMissingFields = parseJsonStringArray(market?.missingFields);
  const metadata = buildMetadata(ticker, missingReasons, company, financial, market);

  return {
    status: missingReasons.length > 0 ? "insufficient_data" : "ready",
    ticker,
    companyName: company?.companyName ?? ticker,
    industry: company?.industryName ?? "unknown",
    snapshot,
    dataQuality: {
      source: snapshot.sourceName,
      asOf: snapshot.collectedAt,
      isDemoData: isDemoDataMode(company?.dataMode) || isDemoDataMode(financial?.dataMode) || isDemoDataMode(market?.dataMode),
      isStale: financial?.qualityStatus === "stale" || market?.qualityStatus === "stale",
      missingFields: [...new Set([...financialMissingFields, ...marketMissingFields, ...missingReasons])],
    },
    metadata,
    missingReasons,
  };
};

export const overviewApiClientInternals = {
  buildCompanyEndpoint,
  buildLatestFinancialsEndpoint,
  buildLatestMarketPriceEndpoint,
  buildMissingReasons,
  buildSnapshot,
  parseJsonStringArray,
  toNullableNumber,
};
