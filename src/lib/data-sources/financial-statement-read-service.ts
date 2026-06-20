export type FinancialStatementReadStatus =
  | "available"
  | "partial"
  | "insufficient_data"
  | "unavailable"
  | "invalid_input"
  | "database_error";

export type FinancialStatementPeriodType = "year" | "quarter" | "ttm" | "unknown";

export type FinancialStatementReadParams = {
  ticker: string;
  periodType?: FinancialStatementPeriodType;
  limit?: number;
  sourceLabel?: string;
  dataMode?: string;
};

export type FinancialStatementSourceMetadata = {
  sourceLabel: string;
  dataMode: string;
  productionApproved: false;
  importedAt: string | null;
  asOf: string | null;
  fiscalPeriod: string | null;
  ticker: string;
  statementType: "financial_statement";
  currency: string | null;
  periodType: FinancialStatementPeriodType;
  limitations: string[];
  warnings: string[];
};

export type FinancialStatementNormalizedValues = {
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  cashAndEquivalents: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  operatingCashFlow: number | null;
  capitalExpenditure: number | null;
  sharesOutstanding: number | null;
  eps: number | null;
};

export type FinancialStatementDataQuality = {
  status: Exclude<FinancialStatementReadStatus, "invalid_input" | "database_error">;
  missingFields: string[];
  availableFields: string[];
  invalidFields: string[];
  warnings: string[];
};

export type FinancialStatementLocalRecord = {
  id: string;
  ticker: string;
  fiscalYear: number | null;
  fiscalQuarter: number | null;
  period: string;
  periodType: FinancialStatementPeriodType;
  statementDate: string | null;
  source: FinancialStatementSourceMetadata;
  values: FinancialStatementNormalizedValues;
  dataQuality: FinancialStatementDataQuality;
};

export type FinancialStatementSeriesResult = {
  ok: boolean;
  status: FinancialStatementReadStatus;
  ticker: string | null;
  sourceLabel: string;
  dataMode: string;
  productionApproved: false;
  records: FinancialStatementLocalRecord[];
  warnings: string[];
  errors: string[];
};

type ReadableDecimal = {
  toNumber?: () => number;
  toString?: () => string;
};

type StoredFinancialStatement = {
  id: string;
  ticker: string;
  periodType: string;
  period: string;
  fiscalYear: number | null;
  fiscalQuarter: number | null;
  reportDate: Date | string | null;
  currency: string | null;
  revenue: number | string | ReadableDecimal | null;
  grossProfit: number | string | ReadableDecimal | null;
  netIncome: number | string | ReadableDecimal | null;
  operatingCashFlow: number | string | ReadableDecimal | null;
  totalAssets: number | string | ReadableDecimal | null;
  equity: number | string | ReadableDecimal | null;
  totalDebt: number | string | ReadableDecimal | null;
  currentAssets: number | string | ReadableDecimal | null;
  currentLiabilities: number | string | ReadableDecimal | null;
  eps: number | string | ReadableDecimal | null;
  sharesOutstanding: number | string | ReadableDecimal | null;
  sourceLabel: string;
  dataMode: string;
  asOf: Date | string;
  collectedAt: Date | string | null;
  missingFields: string;
  warningCodes: string;
  errorCodes: string;
};

type FinancialStatementReadDb = {
  financialStatement: {
    findMany: (args: unknown) => Promise<StoredFinancialStatement[]>;
  };
};

export type FinancialStatementReadServiceOptions = {
  db?: FinancialStatementReadDb;
};

const DEFAULT_SOURCE_LABEL = "local_financial_statement_research";
const DEFAULT_DATA_MODE = "research_only";
const SOURCE_BOUNDARY_WARNING =
  "Financial statement read path is local academic/research only; production approval remains false.";
const REQUIRED_FIELDS: Array<keyof FinancialStatementNormalizedValues> = [
  "revenue",
  "netIncome",
  "totalAssets",
  "totalEquity",
  "operatingCashFlow",
];

const normalizeTicker = (ticker: string | null | undefined): string => ticker?.trim().toUpperCase() ?? "";

const safeLimit = (limit: number | null | undefined): number => {
  if (!limit || !Number.isFinite(limit)) return 8;
  return Math.min(Math.max(Math.floor(limit), 1), 40);
};

const dateOnly = (value: Date | string | null): string | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const toNullableNumber = (
  value: number | string | ReadableDecimal | null | undefined,
): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value.toNumber === "function") {
    const parsed = value.toNumber();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value.toString === "function") {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseStringArray = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const normalizePeriodType = (value: string): FinancialStatementPeriodType => {
  if (value === "year" || value === "quarter" || value === "ttm") return value;
  return "unknown";
};

const emptyResult = ({
  status,
  ticker,
  sourceLabel = DEFAULT_SOURCE_LABEL,
  dataMode = DEFAULT_DATA_MODE,
  warnings = [],
  errors = [],
}: {
  status: FinancialStatementReadStatus;
  ticker: string | null;
  sourceLabel?: string;
  dataMode?: string;
  warnings?: string[];
  errors?: string[];
}): FinancialStatementSeriesResult => ({
  ok: status === "available" || status === "partial",
  status,
  ticker,
  sourceLabel,
  dataMode,
  productionApproved: false,
  records: [],
  warnings: [SOURCE_BOUNDARY_WARNING, ...warnings],
  errors,
});

const resolveDb = async (db: FinancialStatementReadDb | undefined): Promise<FinancialStatementReadDb> => {
  if (db) return db;
  const database = await import("../database/client");
  return database.prisma as unknown as FinancialStatementReadDb;
};

const buildValues = (record: StoredFinancialStatement): FinancialStatementNormalizedValues => ({
  revenue: toNullableNumber(record.revenue),
  grossProfit: toNullableNumber(record.grossProfit),
  operatingIncome: null,
  netIncome: toNullableNumber(record.netIncome),
  totalAssets: toNullableNumber(record.totalAssets),
  totalLiabilities: null,
  totalEquity: toNullableNumber(record.equity),
  cashAndEquivalents: null,
  currentAssets: toNullableNumber(record.currentAssets),
  currentLiabilities: toNullableNumber(record.currentLiabilities),
  operatingCashFlow: toNullableNumber(record.operatingCashFlow),
  capitalExpenditure: null,
  sharesOutstanding: toNullableNumber(record.sharesOutstanding),
  eps: toNullableNumber(record.eps),
});

const buildDataQuality = (
  values: FinancialStatementNormalizedValues,
  record: StoredFinancialStatement,
): FinancialStatementDataQuality => {
  const availableFields = Object.entries(values)
    .filter(([, value]) => value !== null)
    .map(([field]) => field);
  const missingFields = Array.from(new Set([
    ...REQUIRED_FIELDS.filter((field) => values[field] === null),
    ...parseStringArray(record.missingFields),
  ]));
  const invalidFields = parseStringArray(record.errorCodes);
  const warnings = [
    ...parseStringArray(record.warningCodes),
    ...(values.operatingCashFlow === null ? ["operatingCashFlow is missing; cash-quality checks remain limited."] : []),
    ...(values.totalEquity !== null && values.totalEquity <= 0
      ? ["totalEquity is non-positive; equity-based interpretation must remain not_applicable."]
      : []),
  ];
  const status: FinancialStatementDataQuality["status"] =
    availableFields.length === 0
      ? "unavailable"
      : missingFields.length === 0 && invalidFields.length === 0
        ? "available"
        : availableFields.length > 0
          ? "partial"
          : "insufficient_data";

  return {
    status,
    missingFields,
    availableFields,
    invalidFields,
    warnings,
  };
};

const mapRecord = (record: StoredFinancialStatement): FinancialStatementLocalRecord => {
  const values = buildValues(record);
  const dataQuality = buildDataQuality(values, record);
  const periodType = normalizePeriodType(record.periodType);

  return {
    id: record.id,
    ticker: normalizeTicker(record.ticker),
    fiscalYear: record.fiscalYear,
    fiscalQuarter: record.fiscalQuarter,
    period: record.period,
    periodType,
    statementDate: dateOnly(record.reportDate),
    source: {
      sourceLabel: record.sourceLabel,
      dataMode: record.dataMode,
      productionApproved: false,
      importedAt: dateOnly(record.collectedAt),
      asOf: dateOnly(record.asOf),
      fiscalPeriod: record.period,
      ticker: normalizeTicker(record.ticker),
      statementType: "financial_statement",
      currency: record.currency,
      periodType,
      limitations: [
        "Local/research-only financial statement data is not production-approved.",
        "Fields not present in the current DB schema remain null instead of being inferred.",
      ],
      warnings: [SOURCE_BOUNDARY_WARNING],
    },
    values,
    dataQuality,
  };
};

export const getFinancialStatementSeries = async (
  params: FinancialStatementReadParams,
  options: FinancialStatementReadServiceOptions = {},
): Promise<FinancialStatementSeriesResult> => {
  const ticker = normalizeTicker(params.ticker);
  const sourceLabel = params.sourceLabel?.trim() || DEFAULT_SOURCE_LABEL;
  const dataMode = params.dataMode?.trim() || DEFAULT_DATA_MODE;

  if (!ticker) {
    return emptyResult({
      status: "invalid_input",
      ticker: null,
      sourceLabel,
      dataMode,
      errors: ["Ticker is required."],
    });
  }

  try {
    const db = await resolveDb(options.db);
    const rows = await db.financialStatement.findMany({
      where: {
        ticker,
        dataMode,
        sourceLabel,
        ...(params.periodType ? { periodType: params.periodType } : {}),
      },
      orderBy: [
        { fiscalYear: "desc" },
        { fiscalQuarter: "desc" },
        { asOf: "desc" },
        { createdAt: "desc" },
      ],
      take: safeLimit(params.limit),
      select: {
        id: true,
        ticker: true,
        periodType: true,
        period: true,
        fiscalYear: true,
        fiscalQuarter: true,
        reportDate: true,
        currency: true,
        revenue: true,
        grossProfit: true,
        netIncome: true,
        operatingCashFlow: true,
        totalAssets: true,
        equity: true,
        totalDebt: true,
        currentAssets: true,
        currentLiabilities: true,
        eps: true,
        sharesOutstanding: true,
        sourceLabel: true,
        dataMode: true,
        asOf: true,
        collectedAt: true,
        missingFields: true,
        warningCodes: true,
        errorCodes: true,
      },
    });

    if (rows.length === 0) {
      return emptyResult({
        status: "unavailable",
        ticker,
        sourceLabel,
        dataMode,
        warnings: ["No local financial statement records were found."],
      });
    }

    const records = rows.map(mapRecord);
    const hasAvailable = records.some((record) => record.dataQuality.status === "available");
    const hasPartial = records.some((record) => record.dataQuality.status === "partial");

    return {
      ...emptyResult({
        status: hasAvailable ? "available" : hasPartial ? "partial" : "insufficient_data",
        ticker,
        sourceLabel,
        dataMode,
      }),
      records,
    };
  } catch (error) {
    return emptyResult({
      status: "database_error",
      ticker,
      sourceLabel,
      dataMode,
      errors: [error instanceof Error ? error.message : "Financial statement DB read failed."],
    });
  }
};
