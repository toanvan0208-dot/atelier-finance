"use client";

import { useState } from "react";
import { Button, Chip } from "@/components/ui";
import type {
  NewsEventData,
  PricePositionData,
  PriceVolumeStoryData,
  TechnicalFieldItem,
  TechnicalQuickSummaryData,
  TimeframeSelectorData,
  TrendMapData,
  VolatilityData,
} from "../types";

type TechnicalScanDashboardProps = {
  newsEvents: NewsEventData;
  pricePosition: PricePositionData;
  priceVolume: PriceVolumeStoryData;
  quickSummary: TechnicalQuickSummaryData;
  timeframe: TimeframeSelectorData;
  trendMap: TrendMapData;
  volatility: VolatilityData;
};

type IndicatorKey = "ma20" | "ma50" | "ma200" | "rsi";
type DashboardLayerKey = IndicatorKey | "news";

const indicatorStyles: Record<IndicatorKey, { label: string; stroke: string; dash?: string }> = {
  ma20: { label: "MA20", stroke: "#00A676", dash: "3 4" },
  ma50: { label: "MA50", stroke: "#6F7785", dash: "5 5" },
  ma200: { label: "MA200", stroke: "#B88900", dash: "2 5" },
  rsi: { label: "RSI", stroke: "#D94F45" },
};

function getMetric(items: TechnicalFieldItem[], includes: string) {
  return items.find((item) => item.label.includes(includes));
}

function getLatestReading(data: PriceVolumeStoryData) {
  const current = data.points.at(-1);
  const previous = data.points.at(-2);
  const first = data.points.at(0);

  if (!current || !previous || !first) {
    return {
      priceChange: "0%",
      volumeChange: "0%",
      currentPrice: "--",
      currentVolume: "--",
      tone: "neutral" as const,
    };
  }

  const priceChange = ((current.price - first.price) / first.price) * 100;
  const recentPriceChange = ((current.price - previous.price) / previous.price) * 100;
  const recentVolumeChange = ((current.volume - previous.volume) / previous.volume) * 100;
  const tone: TechnicalFieldItem["tone"] =
    recentPriceChange >= 0 && recentVolumeChange >= 0 ? "accent" : "warning";

  return {
    priceChange: `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(1)}%`,
    volumeChange: `${recentVolumeChange >= 0 ? "+" : ""}${recentVolumeChange.toFixed(1)}%`,
    currentPrice: `${current.price.toLocaleString("vi-VN")}.000`,
    currentVolume: `${current.volume.toFixed(1)} triệu`,
    tone,
  };
}

function toneLabel(tone?: TechnicalFieldItem["tone"]) {
  if (tone === "success") return "Mạnh";
  if (tone === "warning") return "Cần lọc";
  if (tone === "accent") return "Chú ý";
  if (tone === "danger") return "Rủi ro";
  return "Theo dõi";
}

function SignalTile({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: TechnicalFieldItem["tone"];
  value: string;
}) {
  return (
    <div className="min-h-24 rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-normal text-subtle">{label}</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="text-sm font-bold leading-5 text-ink">{value}</p>
        <Chip size="sm" variant={tone}>{toneLabel(tone)}</Chip>
      </div>
    </div>
  );
}

function buildPath(
  points: PriceVolumeStoryData["points"],
  width: number,
  height: number,
  getValue: (point: PriceVolumeStoryData["points"][number]) => number | undefined,
  domain?: { min: number; max: number }
) {
  const values = points.map(getValue).filter((value): value is number => typeof value === "number");
  const min = domain?.min ?? Math.min(...values);
  const max = domain?.max ?? Math.max(...values);
  const span = Math.max(1, max - min);

  return points
    .map((point, index) => {
      const value = getValue(point);
      if (typeof value !== "number") return "";

      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");
}

function PriceVolumeScanChart({
  activeIndicators,
  data,
  newsEvents,
}: {
  activeIndicators: Record<string, boolean>;
  data: PriceVolumeStoryData;
  newsEvents: NewsEventData;
}) {
  const width = 360;
  const priceHeight = 116;
  const volumeHeight = 44;
  const maxVolume = Math.max(1, ...data.points.map((point) => point.volume));
  const priceValues = data.points.flatMap((point) => [
    point.price,
    activeIndicators.ma20 ? point.ma20 : undefined,
    activeIndicators.ma50 ? point.ma50 : undefined,
    activeIndicators.ma200 ? point.ma200 : undefined,
  ].filter((value): value is number => typeof value === "number"));
  const priceDomain = { min: Math.min(...priceValues), max: Math.max(...priceValues) };
  const pricePath = buildPath(data.points, width, priceHeight, (point) => point.price, priceDomain);

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink">Price + Volume scan</p>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-subtle">
          <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 bg-accent" />Giá</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 bg-accent-green" />Volume</span>
          {(["ma20", "ma50", "ma200", "rsi"] as IndicatorKey[]).map((key) =>
            activeIndicators[key] ? (
              <span key={key} className="inline-flex items-center gap-1">
                <span className="h-0.5 w-4" style={{ backgroundColor: indicatorStyles[key].stroke }} />
                {indicatorStyles[key].label}
              </span>
            ) : null
          )}
          {activeIndicators.news ? (
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" />Tin tức</span>
          ) : null}
        </div>
      </div>
      <svg
        className="h-48 w-full overflow-visible"
        viewBox={`0 0 ${width} ${priceHeight + volumeHeight + 18}`}
        role="img"
        aria-label="Biểu đồ quét nhanh giá và khối lượng"
      >
        {(["ma200", "ma50", "ma20"] as IndicatorKey[]).map((key) => {
          if (!activeIndicators[key]) return null;

          const path = buildPath(
            data.points,
            width,
            priceHeight,
            (point) => point[key as "ma20" | "ma50" | "ma200"],
            priceDomain
          );

          return (
            <path
              key={key}
              d={path}
              fill="none"
              stroke={indicatorStyles[key].stroke}
              strokeDasharray={indicatorStyles[key].dash}
              strokeWidth="2"
            />
          );
        })}
        <path d={pricePath} fill="none" stroke="currentColor" strokeWidth="3" className="text-accent" />
        {activeIndicators.news ? newsEvents.rows.slice(0, 5).map((event, index) => {
          const pointIndex = Math.min(data.points.length - 1, index * 2 + 1);
          const point = data.points[pointIndex];
          const x = (pointIndex / Math.max(1, data.points.length - 1)) * width;
          const y = priceHeight - ((point.price - priceDomain.min) / Math.max(1, priceDomain.max - priceDomain.min)) * priceHeight;
          const isHighRelevance = event.relevance === "Cao";

          return (
            <g key={`${event.date}-${event.title}`}>
              <line
                x1={x}
                x2={x}
                y1={Math.max(6, y + 7)}
                y2={priceHeight + volumeHeight + 12}
                stroke={isHighRelevance ? "#D94F45" : "#B88900"}
                strokeDasharray="3 5"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <circle
                cx={x}
                cy={Math.max(8, y - 10)}
                r={isHighRelevance ? 6 : 5}
                fill={isHighRelevance ? "#D94F45" : "#B88900"}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x={Math.min(width - 48, x + 8)}
                y={Math.max(10, y - 14)}
                className="fill-muted text-[9px] font-bold"
              >
                {event.date}
              </text>
            </g>
          );
        }) : null}
        {activeIndicators.rsi ? (
          <path
            d={buildPath(data.points, width, 28, (point) => point.rsi, { min: 30, max: 70 })}
            fill="none"
            stroke={indicatorStyles.rsi.stroke}
            strokeWidth="2"
            transform={`translate(0 ${priceHeight - 30})`}
          />
        ) : null}
        {data.points.map((point, index) => {
          const x = (index / Math.max(1, data.points.length - 1)) * width;
          const y = priceHeight + 18 + volumeHeight - (point.volume / maxVolume) * volumeHeight;

          return (
            <rect
              key={point.label}
              x={Math.max(0, x - 5)}
              y={y}
              width="10"
              height={(point.volume / maxVolume) * volumeHeight}
              rx="2"
              className="fill-accent-green/80"
            />
          );
        })}
        <line x1="0" x2={width} y1={priceHeight + 12} y2={priceHeight + 12} className="stroke-border-soft" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-subtle">
        <span>{data.points[0]?.label}</span>
        <span>{data.averageVolume20}</span>
        <span>{data.points.at(-1)?.label}</span>
      </div>
    </div>
  );
}

function TimeAlignment({ trends }: { trends: TechnicalFieldItem[] }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink">Time alignment</p>
        <Chip size="sm" variant="warning">Ngắn hạn lệch pha</Chip>
      </div>
      <div className="space-y-3">
        {trends.map((trend) => (
          <div key={trend.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-muted">{trend.label}</span>
              <span className="font-bold text-ink">{trend.value}</span>
            </div>
            <div className="grid h-2 grid-cols-3 gap-1">
              <span className="rounded-[2px] bg-accent-green" />
              <span className={trend.tone === "success" ? "rounded-[2px] bg-accent-green" : "rounded-[2px] bg-warning"} />
              <span className={trend.tone === "warning" ? "rounded-[2px] bg-warning" : "rounded-[2px] bg-neutral"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BehaviorMap({ items }: { items: TechnicalFieldItem[] }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink">Hành vi thị trường</p>
        <Chip size="sm" variant="accent">Tổng hợp</Chip>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="grid min-h-24 gap-1 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-ink">{item.label}</p>
              <Chip size="sm" variant={item.tone ?? "neutral"}>{toneLabel(item.tone)}</Chip>
            </div>
            <p className="overflow-hidden text-xs leading-5 text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TechnicalScanDashboard({
  newsEvents,
  pricePosition,
  priceVolume,
  quickSummary,
  timeframe,
  trendMap,
  volatility,
}: TechnicalScanDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe.defaultValue);
  const [activeIndicators, setActiveIndicators] = useState<Record<string, boolean>>(() =>
    ({
      ...Object.fromEntries(priceVolume.toggles.map((toggle) => [toggle.key, toggle.enabled])),
      news: true,
    })
  );
  const latest = getLatestReading(priceVolume);
  const support = getMetric(pricePosition.metrics, "hỗ trợ")?.value ?? "--";
  const resistance = getMetric(pricePosition.metrics, "kháng cự")?.value ?? "--";
  const volatilityLevel = volatility.output.value;
  const primaryNews =
    newsEvents.rows.find((event) => event.relevance === "Cao") ?? newsEvents.rows[0];

  function toggleIndicator(key: DashboardLayerKey) {
    setActiveIndicators((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft">
      <div className="border-b border-border-soft bg-surface-soft/70 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-normal text-subtle">Scan dashboard</p>
            <h2 className="mt-1 font-brand text-xl font-bold text-ink">Quan sát Price Volume Time</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
              Quét nhanh giá, volume, khung thời gian, chỉ báo và hành vi thị trường trong cùng một mặt phẳng.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip variant="accent">{selectedTimeframe}</Chip>
            <Chip variant={priceVolume.reading.tone ?? "neutral"}>{priceVolume.reading.label}</Chip>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="flex flex-wrap gap-2">
            {timeframe.options.map((option) => (
              <Button
                key={option.label}
                size="sm"
                variant={selectedTimeframe === option.label ? "primary" : "secondary"}
                onClick={() => setSelectedTimeframe(option.label)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {priceVolume.toggles.map((toggle) => (
              <Button
                key={toggle.key}
                size="sm"
                variant={activeIndicators[toggle.key] ? "primary" : "secondary"}
                onClick={() => toggleIndicator(toggle.key as DashboardLayerKey)}
              >
                {toggle.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={activeIndicators.news ? "primary" : "secondary"}
              onClick={() => toggleIndicator("news")}
            >
              Tin tức
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-normal text-subtle">Kết luận nhanh</p>
            <p className="mt-2 text-lg font-bold leading-7 text-ink">{priceVolume.reading.value}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SignalTile label="Giá hiện tại" tone={latest.tone} value={`${latest.currentPrice} (${latest.priceChange})`} />
            <SignalTile label="Volume gần nhất" tone="accent" value={`${latest.currentVolume}, ${latest.volumeChange} so với phiên trước`} />
            <SignalTile label="Vùng phản ứng" tone="warning" value={`${support} / ${resistance}`} />
            <SignalTile label="Biến động" tone={volatility.output.tone} value={volatilityLevel} />
          </div>
          <BehaviorMap items={quickSummary.answers} />
        </div>

        <div className="space-y-3">
          <PriceVolumeScanChart activeIndicators={activeIndicators} data={priceVolume} newsEvents={newsEvents} />
          <TimeAlignment trends={trendMap.trends} />
          <div className="grid grid-cols-2 gap-3">
            <SignalTile
              label="Tin tức"
              tone={primaryNews?.relevance === "Cao" ? "warning" : "neutral"}
              value={primaryNews ? `${primaryNews.date}: ${primaryNews.title}` : "Chưa có sự kiện nổi bật"}
            />
            <div className="min-h-24 rounded-[4px] border border-border-soft bg-surface px-3 py-3">
              <p className="text-sm font-bold text-ink">Sau khi scan</p>
              <p className="mt-2 text-xs leading-5 text-muted">
                Mở từng bước bên dưới khi cần kiểm chứng hoặc quay lại doanh nghiệp, BCTC, định giá và rủi ro.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
