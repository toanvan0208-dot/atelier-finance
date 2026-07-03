import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { PVTChartSeries, PVTObservationData, PVTObservationPoint } from "../types";

type PVTMainChartProps = {
  data: PVTObservationData["chart"];
  chartSeries?: PVTChartSeries;
  supportLabel: string;
  resistanceLabel: string;
};

function buildLinePath(
  points: PVTObservationPoint[],
  width: number,
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
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .filter((segment): segment is string => segment !== null)
    .join(" ");
}

const hasDerivedLevel = (label: string): boolean =>
  !/chưa đủ|không khả dụng|chua du|khong kha dung|insufficient|unavailable|not_available/i.test(label);

const numericValues = (points: PVTObservationPoint[]): number[] =>
  points.flatMap((point) =>
    [point.price, point.ma20, point.ma50].filter((value): value is number => typeof value === "number"),
  );

const chartStatusLabel = (status: PVTChartSeries["status"] | undefined): string => {
  if (status === "computed_from_market_price_series") return "Đã tính từ chuỗi giá đang hiển thị";
  if (status === "static_sample" || status === "presentation_only") return "Dữ liệu minh họa";
  if (status === "insufficient_data") return "Chưa đủ dữ liệu";
  return "Nguồn đang được kiểm tra";
};

export function PVTMainChart({ data, chartSeries, resistanceLabel, supportLabel }: PVTMainChartProps) {
  const width = 760;
  const priceHeight = 260;
  const volumeHeight = 84;
  const allPrices = numericValues(data.points);
  const hasChartPoints = data.points.length >= 2 && allPrices.length >= 2;
  const isDbChart = chartSeries?.status === "computed_from_market_price_series";
  const showMa20 = chartSeries?.movingAverages.ma20.status === "computed_from_market_price_series";
  const showMa50 = chartSeries?.movingAverages.ma50.status === "computed_from_market_price_series";
  const showAnnotations =
    chartSeries?.annotations.status === "static_sample" || chartSeries?.annotations.status === "presentation_only";
  const sourceNote =
    chartSeries?.status === "computed_from_market_price_series"
      ? "Biểu đồ dùng dữ liệu giá và khối lượng đã lưu trong hệ thống."
      : chartSeries?.status === "static_sample" || chartSeries?.status === "presentation_only"
        ? "Biểu đồ dùng dữ liệu minh họa và chưa phê duyệt sản xuất."
        : "Dữ liệu nghiên cứu, chưa phê duyệt sản xuất.";

  if (!hasChartPoints) {
    return (
      <Card>
        <CardHeader
          title={data.title}
          description="Chart source boundary is shown before rendering any price/volume series."
          chip={<Chip variant="neutral">{chartStatusLabel(chartSeries?.status)}</Chip>}
        />
        <CardBody className="space-y-4">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft p-5">
            <p className="text-sm font-bold text-ink">Dữ liệu nghiên cứu, chưa phê duyệt sản xuất.</p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Không dùng dữ liệu minh họa.
            </p>
          </div>
          <p className="text-xs leading-5 text-muted">{sourceNote}</p>
        </CardBody>
      </Card>
    );
  }

  const minPrice = Math.min(...allPrices, 37);
  const maxPrice = Math.max(...allPrices, 46);
  const priceSpan = Math.max(1, maxPrice - minPrice);
  const volumeValues = data.points
    .map((point) => point.volume)
    .filter((value): value is number => typeof value === "number");
  const maxVolume = Math.max(...volumeValues, 1);
  const pricePath = buildLinePath(data.points, width, priceHeight, "price", minPrice, priceSpan);
  const ma20Path = buildLinePath(data.points, width, priceHeight, "ma20", minPrice, priceSpan);
  const ma50Path = buildLinePath(data.points, width, priceHeight, "ma50", minPrice, priceSpan);
  const supportY = priceHeight - ((39 - minPrice) / priceSpan) * priceHeight;
  const resistanceY = priceHeight - ((45 - minPrice) / priceSpan) * priceHeight;
  const showSupportResistanceBands = hasDerivedLevel(supportLabel) && hasDerivedLevel(resistanceLabel);

  return (
    <Card>
      <CardHeader
        title={data.title}
        description={sourceNote}
        chip={<Chip variant="neutral">{chartStatusLabel(chartSeries?.status)}</Chip>}
      />
      <CardBody className="space-y-4">
        {isDbChart ? (
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
            Biểu đồ dùng dữ liệu giá và khối lượng đã lưu trong hệ thống. MA20/MA50 chỉ hiển thị khi có đủ dữ liệu tính toán. Không dùng dữ liệu minh họa.
          </p>
        ) : null}
        <div className="overflow-x-auto rounded-[4px] border border-border-soft bg-surface-soft p-4">
          <svg className="min-w-[760px] w-full" viewBox={`0 0 ${width} ${priceHeight + volumeHeight + 58}`} role="img" aria-label={data.title}>
            {showSupportResistanceBands ? (
              <>
                <rect x="0" y={resistanceY - 12} width={width} height="24" fill="#F4C542" opacity="0.18" />
                <rect x="0" y={supportY - 12} width={width} height="24" fill="#00A676" opacity="0.12" />
                <text x="8" y={Math.max(14, resistanceY - 16)} className="fill-subtle text-[11px] font-bold">
                  Tham khảo (trên) {resistanceLabel}
                </text>
                <text x="8" y={supportY + 30} className="fill-subtle text-[11px] font-bold">
                  Tham khảo (dưới) {supportLabel}
                </text>
              </>
            ) : null}
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line key={ratio} x1="0" x2={width} y1={priceHeight * ratio} y2={priceHeight * ratio} stroke="currentColor" className="text-border-soft" strokeDasharray="4 8" />
            ))}
            {showMa50 && ma50Path ? <path d={ma50Path} fill="none" stroke="currentColor" className="text-subtle" strokeDasharray="7 7" strokeWidth="2" /> : null}
            {showMa20 && ma20Path ? <path d={ma20Path} fill="none" stroke="#00A676" strokeDasharray="4 6" strokeWidth="2" /> : null}
            <path d={pricePath} fill="none" stroke="currentColor" className="text-accent" strokeWidth="3" />
            {data.points.map((point, index) => {
              const x = (index / Math.max(1, data.points.length - 1)) * width;
              const y = priceHeight - ((point.price - minPrice) / priceSpan) * priceHeight;
              const event = showAnnotations ? data.events.find((item) => item.pointIndex === index) : null;

              return (
                <g key={point.label}>
                  <circle cx={x} cy={y} r="4" className="fill-surface stroke-accent" strokeWidth="2" />
                  {event ? (
                    <>
                      <line x1={x} x2={x} y1={y + 8} y2={priceHeight + 10} stroke="#1F3A5F" strokeDasharray="3 5" />
                      <rect x={Math.max(0, x - 28)} y={Math.max(0, y - 34)} width="56" height="22" rx="3" className="fill-surface stroke-border" />
                      <text x={x} y={Math.max(14, y - 19)} textAnchor="middle" className="fill-ink text-[10px] font-bold">
                        {event.label}
                      </text>
                    </>
                  ) : null}
                </g>
              );
            })}
            <g transform={`translate(0 ${priceHeight + 24})`}>
              {data.points.map((point, index) => {
                const barWidth = width / data.points.length - 8;
                const x = index * (width / data.points.length) + 4;
                const h = typeof point.volume === "number" ? (point.volume / maxVolume) * volumeHeight : 0;
                return (
                  <rect
                    key={point.label}
                    x={x}
                    y={volumeHeight - h}
                    width={barWidth}
                    height={h}
                    rx="2"
                    className="fill-muted"
                    opacity={typeof point.volume === "number" && point.volume > 3.5 ? 0.7 : 0.35}
                  />
                );
              })}
              <text x="0" y={volumeHeight + 20} className="fill-subtle text-[10px]">
                Volume
              </text>
              <text x={width} y={volumeHeight + 20} textAnchor="end" className="fill-subtle text-[10px]">
                {data.points[data.points.length - 1]?.label}
              </text>
            </g>
          </svg>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {data.quickRead.map((item) => (
            <div key={item.question} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
              <p className="text-sm font-bold text-ink">{item.question}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{item.answer}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
