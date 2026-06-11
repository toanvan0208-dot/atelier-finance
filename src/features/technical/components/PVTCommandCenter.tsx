"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  PricePoint,
  PVTCommandCenterData,
  PVTEvent,
  PVTLayer,
  PVTMetric,
  PVTStatus,
  PriceVolumeStoryData,
} from "../types";

type PVTCommandCenterProps = {
  data: PVTCommandCenterData;
  priceVolume: PriceVolumeStoryData;
};

type Timeframe = "1M" | "3M" | "6M" | "1Y";

type DetailState =
  | { type: "guide" }
  | { type: "metric"; metric: PVTMetric }
  | { type: "event"; event: PVTEvent }
  | { type: "fomo" }
  | null;

const layers: Array<{ id: PVTLayer; label: string }> = [
  { id: "price", label: "Price" },
  { id: "volume", label: "Volume" },
  { id: "time", label: "Time" },
  { id: "market", label: "Market" },
  { id: "event", label: "Event" },
  { id: "psychology", label: "Psychology" },
];

const statusVariant: Record<PVTStatus, "success" | "warning" | "danger" | "neutral" | "accent"> = {
  normal: "neutral",
  watch: "warning",
  risk: "danger",
  unclear: "neutral",
  aligned: "success",
  conflict: "danger",
};

const statusLabel: Record<PVTStatus, string> = {
  normal: "Bình thường",
  watch: "Cần theo dõi",
  risk: "Rủi ro",
  unclear: "Chưa rõ",
  aligned: "Khớp",
  conflict: "Mâu thuẫn",
};

const eventLabel: Record<PVTEvent["status"], string> = {
  possibly_related: "Có thể liên quan",
  unclear: "Chưa rõ",
  noise: "Nhiễu",
};

const eventVariant: Record<PVTEvent["status"], "warning" | "neutral" | "accent"> = {
  possibly_related: "warning",
  unclear: "neutral",
  noise: "accent",
};

function scale(value: number, min: number, max: number, size: number) {
  return ((value - min) / Math.max(1, max - min)) * size;
}

function buildPath(points: PricePoint[], width: number, height: number, key: "price" | "ma20" | "ma50" | "ma200") {
  const values = points.flatMap((point) => [point.price, point.ma20, point.ma50, point.ma200].filter(Boolean) as number[]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const validPoints = points.filter((point) => typeof point[key] === "number");

  return validPoints
    .map((point, index) => {
      const x = scale(index, 0, Math.max(1, validPoints.length - 1), width);
      const value = Number(point[key]);
      const y = height - scale(value, min, max, height);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function PVTWorkspaceChart({
  activeTimeframe,
  data,
  events,
  onEventClick,
  onTimeframeChange,
  points,
}: {
  activeTimeframe: Timeframe;
  data: PVTCommandCenterData;
  events: PVTEvent[];
  onEventClick: (event: PVTEvent) => void;
  onTimeframeChange: (timeframe: Timeframe) => void;
  points: PricePoint[];
}) {
  const width = 720;
  const priceHeight = 260;
  const volumeHeight = 76;
  const values = points.flatMap((point) => [point.price, point.ma20, point.ma50, point.ma200].filter(Boolean) as number[]);
  const min = Math.min(...values, ...data.zones.map((zone) => zone.min)) - 1;
  const max = Math.max(...values, ...data.zones.map((zone) => zone.max)) + 1;
  const maxVolume = Math.max(...points.map((point) => point.volume), 1);
  const pricePath = buildPath(points, width, priceHeight, "price");
  const ma20Path = buildPath(points, width, priceHeight, "ma20");
  const ma50Path = buildPath(points, width, priceHeight, "ma50");
  const ma200Path = buildPath(points, width, priceHeight, "ma200");
  const currentPoint = points[points.length - 1];
  const currentY = priceHeight - scale(currentPoint.price, min, max, priceHeight);

  return (
    <div className="rounded-[4px] border border-border bg-surface px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-ink">Chart Workspace</p>
          <p className="text-xs leading-5 text-muted">Mock data · Khung {activeTimeframe}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["1M", "3M", "6M", "1Y"] as Timeframe[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onTimeframeChange(item)}
              className={[
                "rounded-[3px] border px-2 py-1 text-[11px] font-bold transition",
                activeTimeframe === item
                  ? "border-border bg-accent-soft text-accent shadow-hard-sm"
                  : "border-border-soft bg-surface-soft text-muted hover:border-border hover:text-ink",
              ].join(" ")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg className="min-w-[680px] w-full" viewBox={`0 0 ${width} ${priceHeight + volumeHeight + 44}`} role="img" aria-label="PVT chart">
          {data.zones.map((zone) => {
            const yTop = priceHeight - scale(zone.max, min, max, priceHeight);
            const zoneHeight = Math.max(4, scale(zone.max - zone.min, min, max, priceHeight));
            const color = zone.type === "support" ? "fill-success/10" : zone.type === "resistance" ? "fill-warning/20" : "fill-accent/10";
            return (
              <g key={zone.id}>
                <rect className={color} x="0" y={yTop} width={width} height={zoneHeight} />
                <text x="8" y={Math.max(12, yTop + 14)} className="fill-subtle text-[11px] font-bold">{zone.label} {zone.min === zone.max ? `${zone.min}k` : `${zone.min}-${zone.max}k`}</text>
              </g>
            );
          })}

          <line x1="0" x2={width} y1={currentY} y2={currentY} className="stroke-ink" strokeDasharray="4 4" strokeWidth="1.5" />
          <text x={width - 96} y={currentY - 6} className="fill-ink text-[11px] font-bold">Hiện tại {currentPoint.price}k</text>

          <path d={ma200Path} fill="none" className="stroke-subtle" strokeDasharray="6 5" strokeWidth="1.5" />
          <path d={ma50Path} fill="none" className="stroke-muted" strokeDasharray="5 4" strokeWidth="1.8" />
          <path d={ma20Path} fill="none" stroke="#00A676" strokeDasharray="3 4" strokeWidth="2" />
          <path d={pricePath} fill="none" stroke="currentColor" strokeWidth="3" className="text-accent" />

          {points.map((point, index) => {
            const x = scale(index, 0, Math.max(1, points.length - 1), width);
            const y = priceHeight - scale(point.price, min, max, priceHeight);
            return <circle key={point.label} cx={x} cy={y} r="3" className="fill-surface stroke-accent" strokeWidth="2" />;
          })}

          {events.map((event) => {
            const point = points[Math.min(points.length - 1, event.pointIndex)];
            const x = scale(event.pointIndex, 0, Math.max(1, points.length - 1), width);
            const y = priceHeight - scale(point.price, min, max, priceHeight);
            return (
              <g key={event.id} className="cursor-pointer" onClick={() => onEventClick(event)}>
                <line x1={x} x2={x} y1={y + 10} y2={priceHeight + volumeHeight + 20} className="stroke-warning" strokeDasharray="3 4" />
                <circle cx={x} cy={y - 10} r="7" className="fill-warning stroke-border" strokeWidth="1.5" />
                <text x={x - 3} y={y - 6} className="fill-ink text-[9px] font-bold">E</text>
              </g>
            );
          })}

          <g transform={`translate(0 ${priceHeight + 22})`}>
            {points.map((point, index) => {
              const x = scale(index, 0, Math.max(1, points.length - 1), width);
              const barHeight = Math.max(8, (point.volume / maxVolume) * volumeHeight);
              return (
                <rect
                  key={point.label}
                  x={x - 10}
                  y={volumeHeight - barHeight}
                  width="20"
                  height={barHeight}
                  rx="2"
                  className="fill-accent/70"
                />
              );
            })}
          </g>

          <g transform={`translate(0 ${priceHeight + volumeHeight + 34})`}>
            {points.map((point, index) => {
              const x = scale(index, 0, Math.max(1, points.length - 1), width);
              return <text key={point.label} x={x - 8} y="0" className="fill-subtle text-[10px]">{point.label}</text>;
            })}
          </g>
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-subtle">
        <span className="inline-flex items-center gap-1"><span className="h-0.5 w-5 bg-accent" />Giá</span>
        <span className="inline-flex items-center gap-1"><span className="h-0.5 w-5 bg-[#00A676]" />MA20</span>
        <span className="inline-flex items-center gap-1"><span className="h-0.5 w-5 bg-muted" />MA50</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-[2px] bg-warning/40" />Event</span>
      </div>
    </div>
  );
}

export function PVTCommandCenter({ data, priceVolume }: PVTCommandCenterProps) {
  const [activeLayer, setActiveLayer] = useState<PVTLayer>("price");
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("1Y");
  const [detail, setDetail] = useState<DetailState>(null);
  const activeDetail = useMemo(
    () => data.layerDetails.find((item) => item.layer === activeLayer) ?? data.layerDetails[0],
    [activeLayer, data.layerDetails]
  );
  const visibleRange = useMemo(() => {
    const windowSize: Record<Timeframe, number> = {
      "1M": 4,
      "3M": 6,
      "6M": 9,
      "1Y": priceVolume.points.length,
    };
    const size = Math.min(priceVolume.points.length, windowSize[activeTimeframe]);
    const startIndex = Math.max(0, priceVolume.points.length - size);
    const points = priceVolume.points.slice(startIndex);
    const events = data.events
      .filter((event) => event.pointIndex >= startIndex)
      .map((event) => ({ ...event, pointIndex: event.pointIndex - startIndex }));

    return { events, points };
  }, [activeTimeframe, data.events, priceVolume.points]);

  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.9fr_0.8fr]">
        <Card className="border-border">
          <CardHeader
            chip={data.isMock ? <Chip size="sm" variant="neutral">Mock data</Chip> : null}
            description={`${data.ticker} · ${data.timeframe}`}
            icon="PVT"
            title={data.title}
          />
          <CardBody className="space-y-4">
            <PVTWorkspaceChart
              activeTimeframe={activeTimeframe}
              data={data}
              events={visibleRange.events}
              onEventClick={(event) => setDetail({ type: "event", event })}
              onTimeframeChange={setActiveTimeframe}
              points={visibleRange.points}
            />

            <div className="space-y-2">
              <div>
                <p className="text-xs font-bold uppercase text-subtle">Xem chi tiết theo lớp</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Các nút này đổi phần giải thích bên dưới chart; chart vẫn giữ đầy đủ price, volume và event để không mất ngữ cảnh.
                </p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {layers.map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setActiveLayer(layer.id)}
                    className={[
                      "min-w-[112px] rounded-[4px] border px-3 py-2 text-xs font-bold transition",
                      activeLayer === layer.id
                        ? "border-border bg-ink text-white shadow-hard-sm"
                        : "border-border-soft bg-surface-soft text-ink hover:border-border",
                    ].join(" ")}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-border-soft">
          <CardHeader
            action={<Button size="sm" variant="secondary" onClick={() => setDetail({ type: "guide" })}>Cách đọc</Button>}
            icon="O"
            title="Quan sát nhanh PVT"
          />
          <CardBody className="space-y-3">
            {[
              ["Price", data.observation.price],
              ["Volume", data.observation.volume],
              ["Time", data.observation.time],
              ["Event", data.observation.event],
              ["Psychology", data.observation.psychology],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[4px] bg-surface-soft px-3 py-2">
                <p className="text-[11px] font-bold uppercase text-subtle">{label}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{value}</p>
              </div>
            ))}
            <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">{data.observation.warning}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary">Ghi chú quan sát</Button>
              <Button size="sm" variant="ghost">Kiểm tra rủi ro</Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="border-border-soft">
        <CardHeader description="Các chỉ số ngắn để đọc chart nhanh, không phải kết luận hành động." icon="M" title="Quick PVT Metrics" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.metrics.map((metric) => (
              <button
                key={metric.id}
                type="button"
                onClick={() => setDetail({ type: "metric", metric })}
                className="min-h-[132px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase text-subtle">{metric.label}</p>
                  {metric.isMock ? <Chip size="sm" variant="neutral">Mock</Chip> : null}
                </div>
                <p className="mt-2 font-brand text-xl font-bold text-ink">
                  {metric.value}{metric.unit ? <span className="ml-1 text-sm">{metric.unit}</span> : null}
                </p>
                <Chip className="mt-2" size="sm" variant={statusVariant[metric.status]}>{statusLabel[metric.status]}</Chip>
                <p className="mt-2 text-xs leading-5 text-muted">{metric.explanation}</p>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-border-soft">
          <CardHeader icon="E" title="Event timeline mini" description="Marker E trên chart liên kết với các sự kiện này." />
          <CardBody className="space-y-2">
            {data.events.slice(0, 4).map((event) => (
              <button key={event.id} type="button" onClick={() => setDetail({ type: "event", event })} className="w-full rounded-[4px] bg-surface-soft px-3 py-2 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{event.date} · {event.title}</p>
                  <Chip size="sm" variant={eventVariant[event.status]}>{eventLabel[event.status]}</Chip>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{event.priceReaction} · {event.volumeReaction}</p>
              </button>
            ))}
            <Button size="sm" variant="ghost">Xem tất cả sự kiện</Button>
          </CardBody>
        </Card>

        <Card className="border-border-soft">
          <CardHeader
            action={<Button size="sm" variant="secondary" onClick={() => setDetail({ type: "fomo" })}>Kiểm tra kỹ hơn</Button>}
            icon="F"
            title="FOMO check nhanh"
          />
          <CardBody>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-brand text-3xl font-bold text-ink">{data.fomoMini.checked}/{data.fomoMini.total}</p>
                <p className="mt-1 text-xs leading-5 text-muted">dấu hiệu cần chú ý</p>
              </div>
              <Chip variant="warning">{data.fomoMini.temperature}</Chip>
            </div>
            <div className="mt-3 space-y-2">
              {data.fomoMini.highlights.map((item) => (
                <p key={item} className="rounded-[4px] bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">{item}</p>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader description="Chỉ hiển thị nội dung của layer đang chọn." icon="L" title={activeDetail.label} />
        <CardBody className="space-y-4">
          <div className="rounded-[4px] bg-accent-soft px-3 py-3">
            <p className="text-xs font-bold uppercase text-subtle">Câu hỏi chính</p>
            <p className="mt-1 text-base font-bold text-ink">{activeDetail.question}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{activeDetail.observation}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {activeDetail.metrics.map((metric) => (
              <div key={metric.label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                <p className="text-[11px] font-bold uppercase text-subtle">{metric.label}</p>
                <p className="mt-1 text-sm font-bold text-ink">{metric.value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-xs font-bold uppercase text-subtle">Cần kiểm chứng thêm</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeDetail.checks.map((item) => <Chip key={item} variant="neutral">{item}</Chip>)}
              </div>
            </div>
            <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">
              Sai lầm người mới hay gặp: {activeDetail.commonMistake}
            </p>
          </div>
          <Button size="sm" variant="secondary">{activeDetail.ctaLabel}</Button>
        </CardBody>
      </Card>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5" role="dialog" aria-modal="true" onClick={() => setDetail(null)}>
          <div className="max-h-[92dvh] w-full max-w-[680px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4">
              <h3 className="text-lg font-bold text-ink">
                {detail.type === "guide" ? "Cách đọc chart PVT" : detail.type === "metric" ? `Chi tiết: ${detail.metric.label}` : detail.type === "event" ? "Chi tiết event" : "FOMO check chi tiết"}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setDetail(null)}>Đóng</Button>
            </div>
            <div className="space-y-3 overflow-y-auto px-4 py-4">
              {detail.type === "guide" ? (
                <>
                  <p className="text-sm leading-6 text-muted">Price cho biết thị trường đang phản ứng ở vùng nào, nhưng cần đọc cùng volume và bối cảnh.</p>
                  <p className="text-sm leading-6 text-muted">Volume có thể xác nhận, phủ nhận hoặc chỉ phản ánh nhiễu do tin tức.</p>
                  <p className="text-sm leading-6 text-muted">Timeframe giúp tránh nhầm nhiễu ngắn hạn với xu hướng lớn.</p>
                  <p className="text-sm leading-6 text-muted">Event giúp tránh gán sai nguyên nhân cho biến động giá.</p>
                  <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">PVT chỉ là lớp quan sát, không thay thế phân tích cơ bản.</p>
                </>
              ) : detail.type === "metric" ? (
                <>
                  <p className="text-sm leading-6 text-muted"><strong className="text-ink">Chỉ số này là gì?</strong> {detail.metric.detail?.definition}</p>
                  <p className="text-sm leading-6 text-muted"><strong className="text-ink">Vì sao quan trọng?</strong> {detail.metric.detail?.whyItMatters}</p>
                  <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">Sai lầm thường gặp: {detail.metric.detail?.commonMistake}</p>
                </>
              ) : detail.type === "event" ? (
                <>
                  <p className="text-sm font-bold text-ink">{detail.event.date} · {detail.event.title}</p>
                  <p className="text-sm leading-6 text-muted">Giá phản ứng: {detail.event.priceReaction}</p>
                  <p className="text-sm leading-6 text-muted">Volume phản ứng: {detail.event.volumeReaction}</p>
                  <p className="text-sm leading-6 text-muted">Trạng thái: {eventLabel[detail.event.status]}</p>
                  <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">Tương quan thời điểm không đồng nghĩa nguyên nhân chắc chắn.</p>
                </>
              ) : (
                <>
                  <p className="text-sm leading-6 text-muted">Kiểm tra cảm xúc giúp tránh đọc chart một chiều khi giá biến động nhanh.</p>
                  {data.fomoMini.highlights.map((item) => <p key={item} className="rounded-[4px] bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">{item}</p>)}
                  <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">Trước khi hành động, cần quay lại định giá, BCTC và rủi ro nếu còn điểm chưa rõ.</p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
