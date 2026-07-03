"use client";

import { useMemo, useState } from "react";
import type { PVTObservationData, PVTObservationPoint, PVTRiskRewardZoneData } from "../types";
import { PVTConfirmationScenarios } from "./PVTConfirmationScenarios";
import { PVTMainChart, slicePointsByTimeframe, type TimeframeKey } from "./PVTMainChart";
import { PVTRelativeMarketSectorCards } from "./PVTRelativeMarketSectorCards";
import { PVTRiskRewardZone } from "./PVTRiskRewardZone";
import { PVTSignalLayers } from "./PVTSignalLayers";

type PVTTimeframeAnalysisProps = {
  data: PVTObservationData;
};

type PriceZone = {
  lower: number;
  upper: number;
  midpoint: number;
  touches: number;
};

const REQUIRED_SUPPORT_RESISTANCE_OBSERVATIONS = 40;
const PIVOT_LOOKBACK = 3;
const PRICE_ZONE_TOLERANCE_PCT = 0.018;

const unavailable = "Chưa đủ dữ liệu";
const notAvailable = "Không khả dụng";

const formatPriceNumber = (value: number): string => new Intl.NumberFormat("vi-VN").format(Math.round(value));

const formatPriceRange = (zone: PriceZone | null): string => {
  if (!zone) return unavailable;
  const lower = formatPriceNumber(zone.lower);
  const upper = formatPriceNumber(zone.upper);
  return lower === upper ? lower : `${lower} - ${upper}`;
};

const formatPercentDistance = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return notAvailable;
  const formatted = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value * 100);
  return `${value > 0 ? "+" : ""}${formatted}%`;
};

const toPriceZone = (prices: number[]): PriceZone => {
  const sorted = [...prices].sort((left, right) => left - right);
  const midpoint = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  return {
    lower: sorted[0],
    upper: sorted[sorted.length - 1],
    midpoint,
    touches: sorted.length,
  };
};

const clusterPivotPrices = (prices: number[]): PriceZone[] => {
  const sorted = [...prices].sort((left, right) => left - right);
  const clusters = sorted.reduce<number[][]>((items, price) => {
    const last = items.at(-1);
    if (!last) return [[price]];
    const midpoint = last.reduce((sum, value) => sum + value, 0) / last.length;
    const tolerance = Math.max(midpoint * PRICE_ZONE_TOLERANCE_PCT, 1);
    if (Math.abs(price - midpoint) <= tolerance) {
      last.push(price);
      return items;
    }
    items.push([price]);
    return items;
  }, []);

  return clusters.map(toPriceZone);
};

const buildSupportResistance = (points: PVTObservationPoint[], currentPrice: number) => {
  if (points.length < REQUIRED_SUPPORT_RESISTANCE_OBSERVATIONS) {
    return {
      support: null,
      resistance: null,
      conclusion: `Khung thời gian này cần ít nhất ${REQUIRED_SUPPORT_RESISTANCE_OBSERVATIONS} phiên để ước tính vùng hỗ trợ/kháng cự.`,
    };
  }

  const lows: number[] = [];
  const highs: number[] = [];

  for (let index = PIVOT_LOOKBACK; index < points.length - PIVOT_LOOKBACK; index += 1) {
    const price = points[index]?.price;
    const left = points[index - 1]?.price;
    const right = points[index + 1]?.price;
    const window = points.slice(index - PIVOT_LOOKBACK, index + PIVOT_LOOKBACK + 1).map((point) => point.price);
    if (price === undefined || left === undefined || right === undefined) continue;

    if (price <= Math.min(...window) && price < left && price < right) lows.push(price);
    if (price >= Math.max(...window) && price > left && price > right) highs.push(price);
  }

  const support =
    clusterPivotPrices(lows)
      .filter((zone) => zone.touches >= 2 && zone.upper < currentPrice)
      .sort((left, right) => right.midpoint - left.midpoint)[0] ?? null;
  const resistance =
    clusterPivotPrices(highs)
      .filter((zone) => zone.touches >= 2 && zone.lower > currentPrice)
      .sort((left, right) => left.midpoint - right.midpoint)[0] ?? null;

  return {
    support,
    resistance,
    conclusion:
      support || resistance
        ? "Vùng hỗ trợ/kháng cự thay đổi theo khung thời gian đang chọn và chỉ dùng như vùng quan sát tham khảo."
        : "Khung thời gian này chưa có đủ đáy/đỉnh lặp lại để ước tính vùng hỗ trợ/kháng cự đáng đọc.",
  };
};

export function PVTTimeframeAnalysis({ data }: PVTTimeframeAnalysisProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<TimeframeKey>(() =>
    data.chart.points.length > 260 ? "1y" : "all",
  );
  const chartPoints = useMemo(
    () => slicePointsByTimeframe(data.chart.points, activeTimeframe),
    [activeTimeframe, data.chart.points],
  );
  const zones = useMemo(
    () => buildSupportResistance(chartPoints, data.currentPrice),
    [chartPoints, data.currentPrice],
  );
  const supportLabel = formatPriceRange(zones.support);
  const resistanceLabel = formatPriceRange(zones.resistance);
  const riskReward: PVTRiskRewardZoneData = {
    currentPrice: data.currentPrice,
    supportPrice: zones.support?.midpoint ?? null,
    resistancePrice: zones.resistance?.midpoint ?? null,
    upside: formatPercentDistance(zones.resistance ? zones.resistance.midpoint / data.currentPrice - 1 : null),
    downside: formatPercentDistance(zones.support ? zones.support.midpoint / data.currentPrice - 1 : null),
    conclusion: zones.conclusion,
  };

  return (
    <>
      <PVTMainChart
        activeTimeframe={activeTimeframe}
        chartSeries={data.pvtChartSeries}
        data={data.chart}
        onTimeframeChange={setActiveTimeframe}
        supportLabel={supportLabel}
        resistanceLabel={resistanceLabel}
      />
      <PVTSignalLayers layers={data.signalLayers} />
      <PVTConfirmationScenarios
        confirmation={data.confirmation}
        invalidation={data.invalidation}
        scenarios={data.scenarios}
      />
      <div className="grid gap-5">
        <PVTRiskRewardZone data={riskReward} />
      </div>
      <PVTRelativeMarketSectorCards data={data.relativeMetrics} ticker={data.ticker} />
    </>
  );
}
