"use client";

import { useMemo, useState } from "react";
import { Chip } from "@/components/ui";
import type { PVTChartSeries, PVTObservationData, PVTObservationPoint } from "../types";

type PVTMainChartProps = {
  data: PVTObservationData["chart"];
  chartSeries?: PVTChartSeries;
  activeTimeframe?: TimeframeKey;
  onTimeframeChange?: (timeframe: TimeframeKey) => void;
  supportLabel: string;
  resistanceLabel: string;
};

const hasDerivedLevel = (label: string): boolean =>
  !/chưa đủ|không khả dụng|chua du|khong kha dung|insufficient|unavailable|not_available/i.test(label);

const chartStatusLabel = (status: PVTChartSeries["status"] | undefined): string => {
  if (status === "computed_from_market_price_series") return "Đã tính từ chuỗi giá đang hiển thị";
  if (status === "static_sample" || status === "presentation_only") return "Dữ liệu trình bày";
  if (status === "insufficient_data") return "Chưa đủ dữ liệu";
  return "Nguồn đang được kiểm tra";
};

const numericValues = (points: PVTObservationPoint[]): number[] =>
  points.flatMap((point) =>
    [point.price, point.ma20, point.ma50].filter((value): value is number => typeof value === "number"),
  );

const formatPrice = (value: number) => new Intl.NumberFormat("vi-VN").format(Math.round(value));

const parseVietnamesePriceLabel = (label: string): number | null => {
  const match = label.match(/[\d.,]+/);
  if (!match) return null;
  const normalized = match[0].replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
};

export const timeframes = [
  { key: "1m", label: "1T", sessions: 22 },
  { key: "3m", label: "3T", sessions: 66 },
  { key: "6m", label: "6T", sessions: 132 },
  { key: "1y", label: "1N", sessions: 260 },
  { key: "all", label: "Tất cả", sessions: null },
] as const;

export type TimeframeKey = (typeof timeframes)[number]["key"];

export function slicePointsByTimeframe(points: PVTObservationPoint[], timeframe: TimeframeKey) {
  const selected = timeframes.find((item) => item.key === timeframe);
  if (!selected?.sessions) return points;
  return points.slice(Math.max(0, points.length - selected.sessions));
}

function scalePrice(value: number, min: number, span: number, top: number, height: number) {
  return top + height - ((value - min) / span) * height;
}

function buildLinePath(
  points: PVTObservationPoint[],
  width: number,
  top: number,
  height: number,
  key: "price" | "ma20" | "ma50",
  min: number,
  span: number,
) {
  if (points.filter((point) => typeof point[key] === "number").length < 2) return "";

  return points
    .map((point, index) => {
      const value = point[key];
      if (typeof value !== "number") return null;
      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = scalePrice(value, min, span, top, height);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .filter((segment): segment is string => segment !== null)
    .join(" ");
}

export function PVTMainChart({
  activeTimeframe,
  chartSeries,
  data,
  onTimeframeChange,
  resistanceLabel,
  supportLabel,
}: PVTMainChartProps) {
  const [uncontrolledTimeframe, setUncontrolledTimeframe] = useState<TimeframeKey>(() =>
    data.points.length > 260 ? "1y" : "all",
  );
  const selectedTimeframe = activeTimeframe ?? uncontrolledTimeframe;
  const chartPoints = useMemo(
    () => slicePointsByTimeframe(data.points, selectedTimeframe),
    [selectedTimeframe, data.points],
  );
  const width = 860;
  const priceTop = 24;
  const priceHeight = 210;
  const volumeTop = 268;
  const volumeHeight = 72;
  const footerTop = 370;
  const allPrices = numericValues(chartPoints);
  const hasChartPoints = chartPoints.length >= 2 && allPrices.length >= 2;
  const isDbChart = chartSeries?.status === "computed_from_market_price_series";
  const showMa20 = chartSeries?.movingAverages.ma20.status === "computed_from_market_price_series";
  const showMa50 = chartSeries?.movingAverages.ma50.status === "computed_from_market_price_series";
  const showAnnotations =
    chartSeries?.annotations.status === "static_sample" || chartSeries?.annotations.status === "presentation_only";
  const sourceNote =
    chartSeries?.status === "computed_from_market_price_series"
      ? "Biểu đồ dùng dữ liệu giá và khối lượng đã lưu trong hệ thống."
      : chartSeries?.status === "static_sample" || chartSeries?.status === "presentation_only"
        ? "Biểu đồ dùng dữ liệu trình bày."
        : "Dữ liệu đang được kiểm tra.";

  if (!hasChartPoints) {
    return (
      <section className="overflow-hidden rounded-[8px] border-[1.5px] border-slate-950 bg-white shadow-[5px_5px_0_rgb(15_23_42_/_0.24)]">
        <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">{data.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{sourceNote}</p>
            </div>
            <Chip variant="neutral">{chartStatusLabel(chartSeries?.status)}</Chip>
          </div>
        </header>
        <div className="px-5 py-5">
          <div className="rounded-[8px] border border-amber-300 bg-amber-50 p-5 text-sm font-bold text-amber-950">
            Chưa đủ dữ liệu để vẽ biểu đồ giá và thanh khoản. Không dùng dữ liệu thay thế.
          </div>
        </div>
      </section>
    );
  }

  const rawMinPrice = Math.min(...allPrices);
  const rawMaxPrice = Math.max(...allPrices);
  const pricePadding = Math.max((rawMaxPrice - rawMinPrice) * 0.18, rawMaxPrice * 0.01, 1);
  const minPrice = rawMinPrice - pricePadding;
  const maxPrice = rawMaxPrice + pricePadding;
  const priceSpan = Math.max(1, maxPrice - minPrice);
  const volumeValues = chartPoints
    .map((point) => point.volume)
    .filter((value): value is number => typeof value === "number");
  const maxVolume = Math.max(...volumeValues, 1);
  const pricePath = buildLinePath(chartPoints, width, priceTop, priceHeight, "price", minPrice, priceSpan);
  const ma20Path = buildLinePath(chartPoints, width, priceTop, priceHeight, "ma20", minPrice, priceSpan);
  const ma50Path = buildLinePath(chartPoints, width, priceTop, priceHeight, "ma50", minPrice, priceSpan);
  const lastPoint = chartPoints[chartPoints.length - 1];
  const firstPoint = chartPoints[0];
  const showSupportResistanceBands = hasDerivedLevel(supportLabel) && hasDerivedLevel(resistanceLabel);
  const supportPrice = parseVietnamesePriceLabel(supportLabel);
  const resistancePrice = parseVietnamesePriceLabel(resistanceLabel);
  const supportY = supportPrice !== null ? scalePrice(supportPrice, minPrice, priceSpan, priceTop, priceHeight) : null;
  const resistanceY = resistancePrice !== null
    ? scalePrice(resistancePrice, minPrice, priceSpan, priceTop, priceHeight)
    : null;

  return (
    <section className="overflow-hidden rounded-[8px] border-[1.5px] border-slate-950 bg-white shadow-[5px_5px_0_rgb(15_23_42_/_0.24)]">
      <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.04em] text-amber-700">Biểu đồ trung tâm</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{data.title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Đọc giá trước, rồi kiểm tra khối lượng phía dưới để tránh nhìn một đường giá đơn lẻ.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip variant="neutral">{chartStatusLabel(chartSeries?.status)}</Chip>
            {showMa20 ? <Chip variant="success">Có MA20</Chip> : null}
            {showMa50 ? <Chip variant="success">Có MA50</Chip> : null}
          </div>
        </div>
      </header>

      <div className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-white px-3 py-2">
          <p className="text-xs font-black uppercase tracking-[0.04em] text-slate-500">Khung thời gian</p>
          <div className="flex flex-wrap gap-1">
            {timeframes.map((timeframe) => {
              const isActive = selectedTimeframe === timeframe.key;
              const isDisabled = timeframe.sessions !== null && data.points.length < 2;
              return (
                <button
                  key={timeframe.key}
                  className={[
                    "h-8 rounded-[6px] border px-3 text-xs font-black transition",
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400",
                    isDisabled ? "cursor-not-allowed opacity-50" : "",
                  ].join(" ")}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    setUncontrolledTimeframe(timeframe.key);
                    onTimeframeChange?.(timeframe.key);
                  }}
                >
                  {timeframe.label}
                </button>
              );
            })}
          </div>
        </div>

        {isDbChart ? (
          <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {sourceNote} MA20/MA50 chỉ hiện khi đủ dữ liệu tính toán. Không dùng dữ liệu thay thế.
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-[8px] border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-4">
          <svg className="min-w-[860px] w-full" viewBox={`0 0 ${width} 398`} role="img" aria-label={data.title}>
            <rect x="0" y="0" width={width} height={footerTop - 14} rx="8" fill="#fffaf0" />
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = priceTop + priceHeight * ratio;
              const labelValue = maxPrice - priceSpan * ratio;
              return (
                <g key={ratio}>
                  <line x1="0" x2={width} y1={y} y2={y} stroke="#e8d8a8" strokeDasharray={ratio === 0 || ratio === 1 ? "0" : "4 8"} />
                  <text x="8" y={y - 6} className="fill-slate-500 text-[10px] font-bold">
                    {formatPrice(labelValue)}
                  </text>
                </g>
              );
            })}

            {showSupportResistanceBands && supportY !== null && resistanceY !== null ? (
              <>
                <rect x="0" y={Math.max(priceTop, resistanceY - 10)} width={width} height="20" fill="#f59e0b" opacity="0.12" />
                <rect x="0" y={Math.max(priceTop, supportY - 10)} width={width} height="20" fill="#10b981" opacity="0.12" />
              </>
            ) : null}

            {showMa50 && ma50Path ? <path d={ma50Path} fill="none" stroke="#64748b" strokeDasharray="7 7" strokeWidth="2" /> : null}
            {showMa20 && ma20Path ? <path d={ma20Path} fill="none" stroke="#0f766e" strokeDasharray="4 6" strokeWidth="2" /> : null}
            <path d={pricePath} fill="none" stroke="#d89b00" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

            {chartPoints.map((point, index) => {
              const x = (index / Math.max(1, chartPoints.length - 1)) * width;
              const y = scalePrice(point.price, minPrice, priceSpan, priceTop, priceHeight);
              const originalIndex = data.points.indexOf(point);
              const event = showAnnotations ? data.events.find((item) => item.pointIndex === originalIndex) : null;

              return (
                <g key={point.label}>
                  {event ? (
                    <>
                      <line x1={x} x2={x} y1={y + 8} y2={volumeTop - 12} stroke="#1f3a5f" strokeDasharray="3 5" />
                      <rect x={Math.max(0, x - 34)} y={Math.max(0, y - 38)} width="68" height="24" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                      <text x={x} y={Math.max(14, y - 22)} textAnchor="middle" className="fill-slate-950 text-[10px] font-bold">
                        {event.label}
                      </text>
                    </>
                  ) : null}
                </g>
              );
            })}

            <line x1="0" x2={width} y1={volumeTop - 14} y2={volumeTop - 14} stroke="#d6b15c" />
            <text x="8" y={volumeTop - 22} className="fill-slate-500 text-[11px] font-bold">
              Khối lượng
            </text>
            {chartPoints.map((point, index) => {
              const slot = width / chartPoints.length;
              const barWidth = Math.max(2, slot - 3);
              const x = index * slot + 1.5;
              const h = typeof point.volume === "number" ? Math.max(2, (point.volume / maxVolume) * volumeHeight) : 0;
              return (
                <rect
                  key={`${point.label}-volume`}
                  x={x}
                  y={volumeTop + volumeHeight - h}
                  width={barWidth}
                  height={h}
                  rx="2"
                  fill="#94a3b8"
                  opacity={0.55}
                />
              );
            })}

            <text x="0" y={footerTop} className="fill-slate-500 text-[11px] font-bold">
              {firstPoint?.label}
            </text>
            <text x={width} y={footerTop} textAnchor="end" className="fill-slate-500 text-[11px] font-bold">
              {lastPoint?.label}
            </text>
            <text x={width} y={priceTop + 18} textAnchor="end" className="fill-slate-950 text-[12px] font-black">
              Giá gần nhất: {lastPoint ? formatPrice(lastPoint.price) : "N/A"}
            </text>
          </svg>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {data.quickRead.map((item) => (
            <div key={item.question} className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <p className="text-sm font-black text-slate-950">{item.question}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
