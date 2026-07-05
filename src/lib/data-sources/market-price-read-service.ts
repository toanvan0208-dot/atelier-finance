import type { MarketPvtUnitMetadataMap } from "@/features/technical/lib/market-pvt-unit-metadata-contract";
import {
  readMarketPvtUnitMetadataFromPersistencePayload,
  unitMetadataPayloadFromMarketPriceSidecar,
  type StoredMarketPvtUnitMetadataSidecarRow,
} from "@/features/technical/lib/market-pvt-unit-metadata-persistence-boundary";

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
  marketCap?: number | null;
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
  marketUnitMetadata?: MarketPvtUnitMetadataMap | null;
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
  id?: string;
  ticker: string;
  tradingDate: Date | string;
  openPrice: number | string | ReadableDecimal | null;
  highPrice: number | string | ReadableDecimal | null;
  lowPrice: number | string | ReadableDecimal | null;
  closePrice: number | string | ReadableDecimal | null;
  volume: number | string | ReadableDecimal | null;
  tradingValue: number | string | ReadableDecimal | null;
  marketCap?: number | string | ReadableDecimal | null;
  sourceLabel?: string | null;
  dataMode?: string | null;
  asOf?: Date | string | null;
  collectedAt?: Date | string | null;
  unitMetadata?: StoredMarketPvtUnitMetadataSidecarRow[];
};

type MarketPriceReadDb = {
  $queryRawUnsafe?: <T = unknown>(query: string, ...values: unknown[]) => Promise<T>;
  marketPrice: {
    findMany: (args: unknown) => Promise<StoredMarketPrice[]>;
  };
};

type RawMarketPriceUnitMetadataSidecarRow = StoredMarketPvtUnitMetadataSidecarRow & {
  marketPriceId: string;
};

export type MarketPriceReadServiceOptions = {
  db?: MarketPriceReadDb;
};

const DEFAULT_SOURCE_LABEL = "vnstock";
const DEFAULT_DATA_MODE = "research_only";
const SOURCE_BOUNDARY_WARNING =
  "Market price read path is local academic/research only; production approval remains false.";
const LEGACY_THOUSAND_VND_SOURCE_LABEL = "vnstock_python_market_pvt_auto";
const LEGACY_THOUSAND_VND_WARNING = "NORMALIZED_LEGACY_THOUSAND_VND_PRICE_TO_VND";

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
  marketUnitMetadata: null,
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

const shouldNormalizeLegacyThousandVnd = (record: StoredMarketPrice): boolean => {
  if (record.sourceLabel !== LEGACY_THOUSAND_VND_SOURCE_LABEL) return false;
  const closePrice = toNullableNumber(record.closePrice);
  return closePrice !== null && closePrice > 0 && closePrice < 1000;
};

const normalizeLegacyPrice = (
  value: number | string | ReadableDecimal | null | undefined,
  normalize: boolean,
): number | null => {
  const parsed = toNullableNumber(value);
  if (parsed === null) return null;
  return normalize ? parsed * 1000 : parsed;
};

const resolveDb = async (db: MarketPriceReadDb | undefined): Promise<MarketPriceReadDb> => {
  if (db) return db;
  const database = await import("../database/client");
  return database.prisma as unknown as MarketPriceReadDb;
};

const valuesForMarketUnitMetadata = (
  rows: MarketPriceSeriesRow[],
): Partial<Record<keyof MarketPvtUnitMetadataMap, number | null>> => {
  const latest = rows.at(-1);
  const lastTwenty = rows.slice(-20);
  return {
    averageTradingValue20d: average(lastTwenty.map((row) => row.tradingValue)),
    marketCap: latest?.marketCap ?? null,
    marketPrice: latest?.close ?? null,
    tradingValue: latest?.tradingValue ?? null,
    volume: latest?.volume ?? null,
  };
};

const rawMarketPriceRecords = async ({
  dataMode,
  db,
  fromDate,
  sourceLabel,
  ticker,
  toDate,
}: {
  dataMode: string;
  db: MarketPriceReadDb;
  fromDate: Date;
  sourceLabel: string;
  ticker: string;
  toDate: Date;
}): Promise<StoredMarketPrice[]> => {
  if (!db.$queryRawUnsafe) throw new Error("market_price_raw_read_unavailable");

  const rows = await db.$queryRawUnsafe<Array<StoredMarketPrice & { id: string }>>(
    `
    SELECT
      "id",
      "ticker",
      "tradingDate",
      "openPrice",
      "highPrice",
      "lowPrice",
      "closePrice",
      "volume",
      "tradingValue",
      "marketCap",
      "sourceLabel",
      "dataMode",
      "asOf",
      "collectedAt"
    FROM "MarketPrice"
    WHERE "ticker" = ?
      AND "tradingDate" >= ?
      AND "tradingDate" <= ?
      AND "dataMode" = ?
      AND "sourceLabel" = ?
    ORDER BY "tradingDate" ASC
    `,
    ticker,
    fromDate.toISOString(),
    toDate.toISOString(),
    dataMode,
    sourceLabel,
  );

  if (rows.length === 0) return rows;

  const placeholders = rows.map(() => "?").join(", ");
  const sidecarRows = await db.$queryRawUnsafe<RawMarketPriceUnitMetadataSidecarRow[]>(
    `
    SELECT
      "marketPriceId",
      "field",
      "unit",
      "status",
      "source",
      "sourceLabel",
      "dataMode",
      "asOf",
      "warningCodes",
      "productionApproved"
    FROM "MarketPriceUnitMetadata"
    WHERE "marketPriceId" IN (${placeholders})
    `,
    ...rows.map((row) => row.id),
  );
  const sidecarsByMarketPriceId = new Map<string, StoredMarketPvtUnitMetadataSidecarRow[]>();
  for (const sidecar of sidecarRows) {
    const existing = sidecarsByMarketPriceId.get(sidecar.marketPriceId) ?? [];
    existing.push({
      asOf: sidecar.asOf,
      dataMode: sidecar.dataMode,
      field: sidecar.field,
      productionApproved: sidecar.productionApproved,
      source: sidecar.source,
      sourceLabel: sidecar.sourceLabel,
      status: sidecar.status,
      unit: sidecar.unit,
      warningCodes: sidecar.warningCodes,
    });
    sidecarsByMarketPriceId.set(sidecar.marketPriceId, existing);
  }

  return rows.map((row) => ({
    ...row,
    unitMetadata: sidecarsByMarketPriceId.get(row.id) ?? [],
  }));
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
    let records: StoredMarketPrice[];
    try {
      records = await db.marketPrice.findMany({
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
          marketCap: true,
          sourceLabel: true,
          dataMode: true,
          asOf: true,
          collectedAt: true,
          unitMetadata: {
            select: {
              field: true,
              unit: true,
              status: true,
              source: true,
              sourceLabel: true,
              dataMode: true,
              asOf: true,
              warningCodes: true,
              productionApproved: true,
            },
          },
        },
      });
    } catch (error) {
      if (!db.$queryRawUnsafe) throw error;
      records = await rawMarketPriceRecords({ dataMode, db, fromDate, sourceLabel, ticker, toDate });
    }

    const normalizedLegacyRows = records.some(shouldNormalizeLegacyThousandVnd);
    const rows = records.map((record) => {
      const normalize = shouldNormalizeLegacyThousandVnd(record);

      return {
        ticker: record.ticker.trim().toUpperCase(),
        date: dateOnly(record.tradingDate),
        open: normalizeLegacyPrice(record.openPrice, normalize),
        high: normalizeLegacyPrice(record.highPrice, normalize),
        low: normalizeLegacyPrice(record.lowPrice, normalize),
        close: normalizeLegacyPrice(record.closePrice, normalize),
        volume: toNullableNumber(record.volume),
        tradingValue: toNullableNumber(record.tradingValue),
        marketCap: toNullableNumber(record.marketCap),
      };
    });

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

    const latestRecord = records.at(-1);
    const unitMetadataRead = readMarketPvtUnitMetadataFromPersistencePayload({
      asOf: dateOnly(latestRecord?.asOf ?? latestRecord?.tradingDate ?? toDate),
      dataMode,
      payload: unitMetadataPayloadFromMarketPriceSidecar(latestRecord?.unitMetadata),
      sourceLabel,
      values: valuesForMarketUnitMetadata(rows),
    });

    return {
      ...emptyResult({
        status: "completed",
        ticker,
        from: dateOnly(fromDate),
        to: dateOnly(toDate),
        sourceLabel,
        dataMode,
        warnings: [
          ...(normalizedLegacyRows ? [LEGACY_THOUSAND_VND_WARNING] : []),
          ...unitMetadataRead.warnings,
        ],
      }),
      count: rows.length,
      marketUnitMetadata: unitMetadataRead.marketUnitMetadata,
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
