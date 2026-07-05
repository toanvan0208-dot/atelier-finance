import { DataMode } from "../../../generated/prisma/client";
import { prisma, type DatabaseClient } from "../client";
import { normalizeTicker, safeLimit, type ServiceOptions } from "./service-utils";

export type MarketPriceQueryOptions = ServiceOptions & {
  db?: DatabaseClient;
};

const LEGACY_THOUSAND_VND_SOURCE_LABEL = "vnstock_python_market_pvt_auto";
const PRICE_SCALE_NORMALIZED_WARNING = "NORMALIZED_LEGACY_THOUSAND_VND_PRICE_TO_VND";

const marketPriceSourceSelect = {
  id: true,
  name: true,
  sourceType: true,
  usageStatus: true,
  licenseStatus: true,
  tosStatus: true,
  accessMethod: true,
} as const;

type MarketPriceReadRow = Awaited<ReturnType<DatabaseClient["marketPrice"]["findMany"]>>[number];

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(typeof value === "object" && "toString" in value ? value.toString() : value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeLegacyThousandVndPrice = (value: unknown): string | unknown => {
  const parsed = toNumber(value);
  if (parsed === null || parsed <= 0 || parsed >= 1_000) return value;

  return String(parsed * 1_000);
};

const appendWarningCode = (warningCodes: string, code: string): string => {
  try {
    const parsed = JSON.parse(warningCodes) as unknown;
    if (Array.isArray(parsed)) {
      return JSON.stringify(Array.from(new Set([...parsed.map(String), code])));
    }
  } catch {
    // Keep the raw value below if it was not JSON.
  }

  return JSON.stringify(Array.from(new Set([...(warningCodes ? [warningCodes] : []), code])));
};

const shouldNormalizeLegacyThousandVndPrice = (row: MarketPriceReadRow): boolean =>
  row.sourceLabel === LEGACY_THOUSAND_VND_SOURCE_LABEL &&
  toNumber(row.closePrice) !== null &&
  Number(toNumber(row.closePrice)) > 0 &&
  Number(toNumber(row.closePrice)) < 1_000;

const normalizeMarketPriceReadRow = (row: MarketPriceReadRow): MarketPriceReadRow => {
  if (!shouldNormalizeLegacyThousandVndPrice(row)) return row;

  return {
    ...row,
    adjustedClosePrice: normalizeLegacyThousandVndPrice(row.adjustedClosePrice) as typeof row.adjustedClosePrice,
    closePrice: normalizeLegacyThousandVndPrice(row.closePrice) as typeof row.closePrice,
    highPrice: normalizeLegacyThousandVndPrice(row.highPrice) as typeof row.highPrice,
    lowPrice: normalizeLegacyThousandVndPrice(row.lowPrice) as typeof row.lowPrice,
    openPrice: normalizeLegacyThousandVndPrice(row.openPrice) as typeof row.openPrice,
    previousClose: normalizeLegacyThousandVndPrice(row.previousClose) as typeof row.previousClose,
    currency: row.currency ?? "VND",
    warningCodes: appendWarningCode(row.warningCodes, PRICE_SCALE_NORMALIZED_WARNING),
  };
};

export const getMarketPricesByTicker = async (
  ticker: string,
  {
    dataMode,
    includeBlocked = false,
    limit,
    db = prisma,
  }: MarketPriceQueryOptions = {},
) => {
  const normalizedTicker = normalizeTicker(ticker);

  const rows = await db.marketPrice.findMany({
    where: {
      ticker: normalizedTicker,
      ...(dataMode ? { dataMode } : includeBlocked ? {} : { dataMode: { not: DataMode.blocked } }),
    },
    orderBy: [{ tradingDate: "desc" }, { asOf: "desc" }, { createdAt: "desc" }],
    take: safeLimit(limit, 120),
    include: {
      source: {
        select: marketPriceSourceSelect,
      },
    },
  });

  return rows.map(normalizeMarketPriceReadRow);
};

export const getLatestMarketPrice = async (
  ticker: string,
  options: MarketPriceQueryOptions = {},
) => {
  const prices = await getMarketPricesByTicker(ticker, {
    ...options,
    limit: 1,
  });

  return prices[0] ?? null;
};
