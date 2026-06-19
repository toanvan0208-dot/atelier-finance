import {
  toPvtMarketPriceInput,
  type MarketPriceSeriesResult,
  type MarketPriceSeriesRow,
  type PvtMarketPriceInput,
} from "./market-price-read-service";

export type MarketPricePvtAdapterStatus =
  | "completed"
  | "insufficient_data"
  | "invalid_input";

export type MarketPricePvtAdapterResult = {
  ok: boolean;
  status: MarketPricePvtAdapterStatus;
  ticker: string | null;
  sourceLabel: string;
  dataMode: string;
  productionApproved: false;
  count: number;
  dateSpan: {
    from: string | null;
    to: string | null;
  };
  latestDate: string | null;
  latestClose: number | null;
  previousClose: number | null;
  priceChangePercent: number | null;
  latestVolume: number | null;
  latestTradingValue: number | null;
  pvtInput: PvtMarketPriceInput | null;
  warnings: string[];
  errors: string[];
};

const LOCAL_RESEARCH_WARNING =
  "Market price PVT adapter output is local academic/research only; production approval remains false.";

const emptyResult = ({
  status,
  series,
  warnings = [],
  errors = [],
}: {
  status: MarketPricePvtAdapterStatus;
  series: MarketPriceSeriesResult;
  warnings?: string[];
  errors?: string[];
}): MarketPricePvtAdapterResult => ({
  ok: status === "completed",
  status,
  ticker: series.ticker,
  sourceLabel: series.sourceLabel,
  dataMode: series.dataMode,
  productionApproved: false,
  count: 0,
  dateSpan: {
    from: null,
    to: null,
  },
  latestDate: null,
  latestClose: null,
  previousClose: null,
  priceChangePercent: null,
  latestVolume: null,
  latestTradingValue: null,
  pvtInput: null,
  warnings: [LOCAL_RESEARCH_WARNING, ...series.warnings, ...warnings],
  errors: [...series.errors, ...errors],
});

const sortRowsByDate = (rows: MarketPriceSeriesRow[]): MarketPriceSeriesRow[] =>
  [...rows].sort((left, right) => Date.parse(left.date) - Date.parse(right.date));

const safePriceChangePercent = (
  latestClose: number | null,
  previousClose: number | null,
): number | null => {
  if (latestClose === null || previousClose === null || previousClose === 0) {
    return null;
  }

  return (latestClose - previousClose) / previousClose;
};

export const adaptMarketPriceSeriesToPvt = (
  series: MarketPriceSeriesResult,
): MarketPricePvtAdapterResult => {
  if (!series.ok) {
    return emptyResult({
      status: series.status === "invalid_input" ? "invalid_input" : "insufficient_data",
      series,
      warnings: ["Market price series was not completed."],
    });
  }

  const rows = sortRowsByDate(series.rows);
  if (rows.length === 0) {
    return emptyResult({
      status: "insufficient_data",
      series,
      warnings: ["Market price series has no rows."],
    });
  }

  const latest = rows[rows.length - 1];
  const previous = rows.length > 1 ? rows[rows.length - 2] : null;
  const sortedSeries: MarketPriceSeriesResult = {
    ...series,
    rows,
  };
  const pvtInput = toPvtMarketPriceInput(sortedSeries);

  return {
    ...emptyResult({
      status: "completed",
      series: sortedSeries,
    }),
    count: rows.length,
    dateSpan: {
      from: rows[0].date,
      to: latest.date,
    },
    latestDate: latest.date,
    latestClose: latest.close,
    previousClose: previous?.close ?? null,
    priceChangePercent: safePriceChangePercent(latest.close, previous?.close ?? null),
    latestVolume: latest.volume,
    latestTradingValue: latest.tradingValue,
    pvtInput,
  };
};
