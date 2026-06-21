import {
  adaptMarketPriceSeriesToPvt,
  type MarketPricePvtAdapterResult,
  type MarketPriceSeriesResult,
} from "../../../lib/data-sources";
import type { PVTObservationData } from "../types";
import { buildTechnicalDeskData } from "./build-technical-desk-data";
import type { TechnicalMarketSnapshot } from "./map-technical-to-logic-input";
import {
  captureMarketPvtUnitMetadata,
  type MarketPvtUnitMetadataCaptureInput,
} from "./market-pvt-unit-metadata-capture";
import type { MarketPvtUnitMetadataMap } from "./market-pvt-unit-metadata-contract";

const hasExplicitCapture = (
  capture: Pick<
    MarketPvtUnitMetadataCaptureInput,
    "asOf" | "dataMode" | "source" | "sourceLabel" | "units" | "values"
  >,
): boolean =>
  Boolean(
    capture.asOf ||
      capture.dataMode ||
      capture.source ||
      capture.sourceLabel ||
      Object.keys(capture.units ?? {}).length > 0 ||
      Object.keys(capture.values ?? {}).length > 0,
  );

export type TechnicalPvtFromMarketPriceSeriesResult = {
  ok: boolean;
  status: MarketPricePvtAdapterResult["status"];
  adapter: MarketPricePvtAdapterResult;
  marketUnitMetadata: MarketPvtUnitMetadataMap;
  data: PVTObservationData | null;
};

export const buildTechnicalFromMarketPriceSeries = (
  baseData: PVTObservationData,
  series: MarketPriceSeriesResult,
  capture: Pick<
    MarketPvtUnitMetadataCaptureInput,
    "asOf" | "dataMode" | "source" | "sourceLabel" | "units" | "values"
  > = {},
): TechnicalPvtFromMarketPriceSeriesResult => {
  const adapter = adaptMarketPriceSeriesToPvt(series);
  const latestDate = adapter.latestDate ?? series.rows.at(-1)?.date ?? series.to;
  const persistedMarketUnitMetadata = !hasExplicitCapture(capture) ? series.marketUnitMetadata : null;
  const captured = captureMarketPvtUnitMetadata({
    asOf: capture.asOf ?? latestDate,
    dataMode: capture.dataMode ?? series.dataMode,
    source: capture.source ?? "local_research",
    sourceLabel: capture.sourceLabel ?? series.sourceLabel,
    units: capture.units,
    values: {
      averageTradingValue20d: adapter.pvtInput?.avgTradingValue20d ?? null,
      marketPrice: adapter.latestClose,
      tradingValue: adapter.latestTradingValue,
      volume: adapter.latestVolume,
      ...capture.values,
    },
  });
  const marketUnitMetadata = persistedMarketUnitMetadata ?? captured.marketUnitMetadata;

  if (!adapter.ok || !adapter.pvtInput) {
    return {
      ok: false,
      status: adapter.status,
      adapter,
      marketUnitMetadata,
      data: null,
    };
  }

  const snapshot: TechnicalMarketSnapshot = {
    ticker: adapter.pvtInput.ticker,
    period: adapter.pvtInput.period,
    periodType: "unknown",
    sourceName: adapter.pvtInput.sourceName,
    dataMode: adapter.dataMode,
    collectedAt: adapter.pvtInput.collectedAt,
    closePrice: adapter.pvtInput.closePrice,
    previousClosePrice: adapter.pvtInput.previousClosePrice,
    volume: adapter.pvtInput.volume,
    avgVolume20d: adapter.pvtInput.avgVolume20d,
    avgTradingValue20d: adapter.pvtInput.avgTradingValue20d,
    availableObservations: adapter.count,
    sourceKind: "market_price_series",
    sourceRows: series.rows,
  };

  return {
    ok: true,
    status: "completed",
    adapter,
    marketUnitMetadata,
    data: buildTechnicalDeskData(baseData, snapshot),
  };
};
