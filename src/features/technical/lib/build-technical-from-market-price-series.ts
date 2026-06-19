import {
  adaptMarketPriceSeriesToPvt,
  type MarketPricePvtAdapterResult,
  type MarketPriceSeriesResult,
} from "../../../lib/data-sources";
import type { PVTObservationData } from "../types";
import { buildTechnicalDeskData } from "./build-technical-desk-data";
import type { TechnicalMarketSnapshot } from "./map-technical-to-logic-input";

export type TechnicalPvtFromMarketPriceSeriesResult = {
  ok: boolean;
  status: MarketPricePvtAdapterResult["status"];
  adapter: MarketPricePvtAdapterResult;
  data: PVTObservationData | null;
};

export const buildTechnicalFromMarketPriceSeries = (
  baseData: PVTObservationData,
  series: MarketPriceSeriesResult,
): TechnicalPvtFromMarketPriceSeriesResult => {
  const adapter = adaptMarketPriceSeriesToPvt(series);

  if (!adapter.ok || !adapter.pvtInput) {
    return {
      ok: false,
      status: adapter.status,
      adapter,
      data: null,
    };
  }

  const snapshot: TechnicalMarketSnapshot = {
    ticker: adapter.pvtInput.ticker,
    period: adapter.pvtInput.period,
    periodType: "unknown",
    sourceName: adapter.pvtInput.sourceName,
    collectedAt: adapter.pvtInput.collectedAt,
    closePrice: adapter.pvtInput.closePrice,
    previousClosePrice: adapter.pvtInput.previousClosePrice,
    volume: adapter.pvtInput.volume,
    avgVolume20d: adapter.pvtInput.avgVolume20d,
    avgTradingValue20d: adapter.pvtInput.avgTradingValue20d,
  };

  return {
    ok: true,
    status: "completed",
    adapter,
    data: buildTechnicalDeskData(baseData, snapshot),
  };
};
