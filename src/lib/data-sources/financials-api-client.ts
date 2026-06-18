import type { DataQualityBannerProps } from "@/components/shared/DataQualityBanner";
import type { FinancialsStatementSnapshot } from "@/features/financials/lib/map-financials-to-logic-input";

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

type FinancialsApiBody<T> = ApiSuccessBody<T> | ApiErrorBody;

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

type FinancialStatementApiRecord = {
  id: string;
  ticker: string;
  companyType: CompanyType;
  periodType: PeriodType;
  period: string;
  fiscalYear?: number | null;
  fiscalQuarter?: number | null;
  currency?: string | null;
  unit?: string | null;
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
  source?: {
    name?: string | null;
    sourceType?: string | null;
    usageStatus?: string | null;
  } | null;
};

export type FinancialsApiQuery = {
  ticker: string;
  latest?: boolean;
  limit?: number;
  dataMode?: DataMode;
};

export type FinancialsApiStatement = {
  raw: FinancialStatementApiRecord;
  snapshot: FinancialsStatementSnapshot;
  dataQuality: DataQualityBannerProps;
  metadata: {
    ticker: string;
    period: string;
    periodType: PeriodType;
    sourceLabel: string;
    sourceType: string;
    dataMode: DataMode;
    qualityStatus: QualityStatus;
    readiness: ReadinessStatus;
    warningCodes: string[];
    errorCodes: string[];
    fallback: false;
  };
};

export class FinancialsApiError extends Error {
  constructor(
    message: string,
    readonly code = "FINANCIALS_API_ERROR",
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "FinancialsApiError";
  }
}

const periodTypeToSnapshotType = (periodType: PeriodType): FinancialsStatementSnapshot["periodType"] => {
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

const buildFinancialsEndpoint = ({ dataMode, latest, limit, ticker }: FinancialsApiQuery): string => {
  const params = new URLSearchParams();
  if (latest) params.set("latest", "true");
  if (limit && limit > 0) params.set("limit", String(limit));
  if (dataMode) params.set("dataMode", dataMode);

  const query = params.toString();
  const path = `/api/companies/${encodeURIComponent(ticker.trim().toUpperCase())}/financials`;
  return query ? `${path}?${query}` : path;
};

const mapFinancialStatementRecord = (
  record: FinancialStatementApiRecord,
  previous?: FinancialStatementApiRecord,
): FinancialsApiStatement => {
  const missingFields = parseJsonStringArray(record.missingFields);
  const warningCodes = parseJsonStringArray(record.warningCodes);
  const errorCodes = parseJsonStringArray(record.errorCodes);
  const sourceName = record.source?.name ?? record.sourceLabel;
  const sourceType = record.source?.sourceType ?? record.sourceType;
  const isSample = record.dataMode === "sample" || record.dataMode === "demo";
  const isUserInput = record.dataMode === "user_input" || sourceType === "user_input";
  const asOf = record.collectedAt ?? record.asOf;

  return {
    raw: record,
    snapshot: {
      ticker: record.ticker,
      companyType: record.companyType,
      period: record.period,
      periodType: periodTypeToSnapshotType(record.periodType),
      sourceName,
      collectedAt: asOf,
      revenue: toNullableNumber(record.revenue),
      previousRevenue: previous ? toNullableNumber(previous.revenue) : null,
      grossProfit: toNullableNumber(record.grossProfit),
      netProfit: toNullableNumber(record.netIncome),
      previousNetProfit: previous ? toNullableNumber(previous.netIncome) : null,
      totalAssets: toNullableNumber(record.totalAssets),
      previousTotalAssets: previous ? toNullableNumber(previous.totalAssets) : null,
      totalEquity: toNullableNumber(record.equity),
      previousTotalEquity: previous ? toNullableNumber(previous.equity) : null,
      totalDebt: toNullableNumber(record.totalDebt),
      currentAssets: toNullableNumber(record.currentAssets),
      currentLiabilities: toNullableNumber(record.currentLiabilities),
      operatingCashFlow: toNullableNumber(record.operatingCashFlow),
      previousOperatingCashFlow: previous ? toNullableNumber(previous.operatingCashFlow) : null,
      eps: toNullableNumber(record.eps),
      bvps: toNullableNumber(record.bvps),
      sharesOutstanding: toNullableNumber(record.sharesOutstanding),
    },
    dataQuality: {
      source: sourceName,
      asOf,
      isDemoData: isSample,
      isStale: record.qualityStatus === "stale",
      missingFields,
    },
    metadata: {
      ticker: record.ticker,
      period: record.period,
      periodType: record.periodType,
      sourceLabel: record.sourceLabel,
      sourceType,
      dataMode: record.dataMode,
      qualityStatus: record.qualityStatus,
      readiness: record.readiness,
      warningCodes: isUserInput ? [...new Set(["USER_INPUT_DATA", ...warningCodes])] : warningCodes,
      errorCodes,
      fallback: false,
    },
  };
};

const readApiBody = async <T>(response: Response): Promise<FinancialsApiBody<T> | null> => {
  try {
    return (await response.json()) as FinancialsApiBody<T>;
  } catch {
    return null;
  }
};

export const fetchFinancialStatementsByTicker = async (
  query: FinancialsApiQuery,
  fetcher: typeof fetch = fetch,
): Promise<FinancialsApiStatement[]> => {
  const response = await fetcher(buildFinancialsEndpoint(query));
  const body = await readApiBody<FinancialStatementApiRecord[] | FinancialStatementApiRecord>(response);

  if (!response.ok || !body?.ok) {
    const apiError = body && !body.ok ? body.error : null;
    throw new FinancialsApiError(
      apiError?.message ?? "Unable to load financial statements.",
      apiError?.code,
      response.status,
    );
  }

  const records = Array.isArray(body.data) ? body.data : [body.data];
  return records.map((record, index) => mapFinancialStatementRecord(record, records[index + 1]));
};

export const fetchLatestFinancialStatementByTicker = async (
  query: Omit<FinancialsApiQuery, "latest">,
  fetcher: typeof fetch = fetch,
): Promise<FinancialsApiStatement | null> => {
  const statements = await fetchFinancialStatementsByTicker({ ...query, latest: true }, fetcher);
  return statements[0] ?? null;
};

export const financialsApiClientInternals = {
  buildFinancialsEndpoint,
  mapFinancialStatementRecord,
  parseJsonStringArray,
  toNullableNumber,
};
