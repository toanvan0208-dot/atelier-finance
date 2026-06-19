export type MarketPriceReadStatus =
  | "completed"
  | "not_found"
  | "invalid_input"
  | "database_error";

export type MarketPriceReadParams = {
  ticker: string;
  from: string;
  to: string;
  dataMode?: string;
  sourceLabel?: string;
};

export type MarketPriceSeriesRow = {
  ticker: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  tradingValue: number | null;
};

export type MarketPriceSeriesResult = {
  ok: boolean;
  status: MarketPriceReadStatus;
  ticker: string | null;
  from: string | null;
  to: string | null;
  sourceLabel: string;
  dataMode: string;
  productionApproved: false;
  count: number;
  rows: MarketPriceSeriesRow[];
  warnings: string[];
  errors: string[];
};

export type PvtMarketPriceInput = {
  ticker: string;
  sourceName: string;
  period: string;
  periodType: "day";
  collectedAt: string | null;
  closePrice: number | null;
  previousClosePrice: number | null;
  volume: number | null;
  avgVolume20d: number | null;
  avgTradingValue20d: number | null;
  productionApproved: false;
};

type ReadableDecimal = {
  toNumber?: () => number;
  toString?: () => string;
};

type StoredMarketPrice = {
  ticker: string;
  tradingDate: Date | string;
  openPrice: number | string | ReadableDecimal | null;
  highPrice: number | string | ReadableDecimal | null;
  lowPrice: number | string | ReadableDecimal | null;
  closePrice: number | string | ReadableDecimal | null;
  volume: number | string | ReadableDecimal | null;
  tradingValue: number | string | ReadableDecimal | null;
  sourceLabel?: string | null;
  dataMode?: string | null;
  collectedAt?: Date | string | null;
};

type MarketPriceReadDb = {
  marketPrice: {
    findMany: (args: unknown) => Promise<StoredMarketPrice[]>;
  };
};

export type MarketPriceReadServiceOptions = {
  db?: MarketPriceReadDb;
};

const DEFAULT_SOURCE_LABEL = "vnstock";
const DEFAULT_DATA_MODE = "research_only";
const SOURCE_BOUNDARY_WARNING =
  "Market price read path is local academic/research only; production approval remains false.";

const emptyResult = ({
  status,
  ticker,
  from,
  to,
  sourceLabel = DEFAULT_SOURCE_LABEL,
  dataMode = DEFAULT_DATA_MODE,
  warnings = [],
  errors = [],
}: {
  status: MarketPriceReadStatus;
  ticker: string | null;
  from: string | null;
  to: string | null;
  sourceLabel?: string;
  dataMode?: string;
  warnings?: string[];
  errors?: string[];
}): MarketPriceSeriesResult => ({
  ok: status === "completed",
  status,
  ticker,
  from,
  to,
  sourceLabel,
  dataMode,
  productionApproved: false,
  count: 0,
  rows: [],
  warnings: [SOURCE_BOUNDARY_WARNING, ...warnings],
  errors,
});

const parseDateParam = (value: string | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const dateOnly = (value: Date | string): string => {
  const parsed = value instanceof Date ? value : new Date(value);
  return parsed.toISOString().slice(0, 10);
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

const resolveDb = async (db: MarketPriceReadDb | undefined): Promise<MarketPriceReadDb> => {
  if (db) return db;
  const database = await import("../database/client");
  return database.prisma as unknown as MarketPriceReadDb;
};

export const getMarketPriceSeries = async (
  params: MarketPriceReadParams,
  options: MarketPriceReadServiceOptions = {},
): Promise<MarketPriceSeriesResult> => {
  const ticker = params.ticker?.trim().toUpperCase() ?? "";
  const sourceLabel = params.sourceLabel?.trim() || DEFAULT_SOURCE_LABEL;
  const dataMode = params.dataMode?.trim() || DEFAULT_DATA_MODE;
  const fromDate = parseDateParam(params.from);
  const toDate = parseDateParam(params.to);

  const usageErrors: string[] = [];
  if (!ticker) usageErrors.push("Ticker is required.");
  if (!fromDate) usageErrors.push("A valid from date is required.");
  if (!toDate) usageErrors.push("A valid to date is required.");
  if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
    usageErrors.push("From date must be earlier than or equal to to date.");
  }

  if (usageErrors.length > 0 || !fromDate || !toDate) {
    return emptyResult({
      status: "invalid_input",
      ticker: ticker || null,
      from: params.from ?? null,
      to: params.to ?? null,
      sourceLabel,
      dataMode,
      errors: usageErrors,
    });
  }

  try {
    const db = await resolveDb(options.db);
    const records = await db.marketPrice.findMany({
      where: {
        ticker,
        tradingDate: {
          gte: fromDate,
          lte: toDate,
        },
        dataMode,
        sourceLabel,
      },
      orderBy: {
        tradingDate: "asc",
      },
      select: {
        ticker: true,
        tradingDate: true,
        openPrice: true,
        highPrice: true,
        lowPrice: true,
        closePrice: true,
        volume: true,
        tradingValue: true,
        sourceLabel: true,
        dataMode: true,
        collectedAt: true,
      },
    });

    const rows = records.map((record) => ({
      ticker: record.ticker.trim().toUpperCase(),
      date: dateOnly(record.tradingDate),
      open: toNullableNumber(record.openPrice),
      high: toNullableNumber(record.highPrice),
      low: toNullableNumber(record.lowPrice),
      close: toNullableNumber(record.closePrice),
      volume: toNullableNumber(record.volume),
      tradingValue: toNullableNumber(record.tradingValue),
    }));

    if (rows.length === 0) {
      return emptyResult({
        status: "not_found",
        ticker,
        from: dateOnly(fromDate),
        to: dateOnly(toDate),
        sourceLabel,
        dataMode,
        warnings: ["No matching market price rows were found."],
      });
    }

    return {
      ...emptyResult({
        status: "completed",
        ticker,
        from: dateOnly(fromDate),
        to: dateOnly(toDate),
        sourceLabel,
        dataMode,
      }),
      count: rows.length,
      rows,
    };
  } catch (error) {
    return emptyResult({
      status: "database_error",
      ticker,
      from: dateOnly(fromDate),
      to: dateOnly(toDate),
      sourceLabel,
      dataMode,
      errors: [error instanceof Error ? error.message : "Market price DB read failed."],
    });
  }
};

const average = (values: Array<number | null>): number | null => {
  const valid = values.filter((value): value is number => value !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

export const toPvtMarketPriceInput = (
  series: MarketPriceSeriesResult,
): PvtMarketPriceInput | null => {
  if (!series.ok || series.rows.length === 0 || !series.ticker) return null;

  const latest = series.rows[series.rows.length - 1];
  const previous = series.rows.length > 1 ? series.rows[series.rows.length - 2] : null;
  const lastTwenty = series.rows.slice(-20);

  return {
    ticker: series.ticker,
    sourceName: series.sourceLabel,
    period: latest.date,
    periodType: "day",
    collectedAt: null,
    closePrice: latest.close,
    previousClosePrice: previous?.close ?? null,
    volume: latest.volume,
    avgVolume20d: average(lastTwenty.map((row) => row.volume)),
    avgTradingValue20d: average(lastTwenty.map((row) => row.tradingValue)),
    productionApproved: false,
  };
};
