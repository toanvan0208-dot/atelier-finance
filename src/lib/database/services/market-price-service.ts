import { DataMode } from "../../../generated/prisma/client";
import { prisma, type DatabaseClient } from "../client";
import { normalizeTicker, safeLimit, type ServiceOptions } from "./service-utils";

export type MarketPriceQueryOptions = ServiceOptions & {
  db?: DatabaseClient;
};

const marketPriceSourceSelect = {
  id: true,
  name: true,
  sourceType: true,
  usageStatus: true,
  licenseStatus: true,
  tosStatus: true,
  accessMethod: true,
} as const;

export const getMarketPricesByTicker = (
  ticker: string,
  {
    dataMode,
    includeBlocked = false,
    limit,
    db = prisma,
  }: MarketPriceQueryOptions = {},
) => {
  const normalizedTicker = normalizeTicker(ticker);

  return db.marketPrice.findMany({
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
