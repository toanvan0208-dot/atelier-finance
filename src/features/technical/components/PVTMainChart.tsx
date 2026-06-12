import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { PVTObservationData, PVTObservationPoint } from "../types";

type PVTMainChartProps = {
  data: PVTObservationData["chart"];
  supportLabel: string;
  resistanceLabel: string;
};

function buildLinePath(
  points: PVTObservationPoint[],
  width: number,
  height: number,
  key: "price" | "ma20" | "ma50",
  min: number,
  span: number
) {
  return points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = height - ((point[key] - min) / span) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function PVTMainChart({ data, resistanceLabel, supportLabel }: PVTMainChartProps) {
  const width = 760;
  const priceHeight = 260;
  const volumeHeight = 84;
  const allPrices = data.points.flatMap((point) => [point.price, point.ma20, point.ma50]);
  const minPrice = Math.min(...allPrices, 37);
  const maxPrice = Math.max(...allPrices, 46);
  const priceSpan = Math.max(1, maxPrice - minPrice);
  const maxVolume = Math.max(...data.points.map((point) => point.volume), 1);
  const pricePath = buildLinePath(data.points, width, priceHeight, "price", minPrice, priceSpan);
  const ma20Path = buildLinePath(data.points, width, priceHeight, "ma20", minPrice, priceSpan);
  const ma50Path = buildLinePath(data.points, width, priceHeight, "ma50", minPrice, priceSpan);
  const supportY = priceHeight - ((39 - minPrice) / priceSpan) * priceHeight;
  const resistanceY = priceHeight - ((45 - minPrice) / priceSpan) * priceHeight;

  return (
    <Card>
      <CardHeader
        title={data.title}
        description="Mặc định chỉ bật giá, volume, MA20 và MA50 để người mới không bị ngợp bởi quá nhiều chỉ báo."
        chip={<Chip variant="neutral">MA20 · MA50 · Volume</Chip>}
      />
      <CardBody className="space-y-4">
        <div className="overflow-x-auto rounded-[4px] border border-border-soft bg-surface-soft p-4">
          <svg className="min-w-[760px] w-full" viewBox={`0 0 ${width} ${priceHeight + volumeHeight + 58}`} role="img" aria-label={data.title}>
            <rect x="0" y={resistanceY - 12} width={width} height="24" fill="#F4C542" opacity="0.18" />
            <rect x="0" y={supportY - 12} width={width} height="24" fill="#00A676" opacity="0.12" />
            <text x="8" y={Math.max(14, resistanceY - 16)} className="fill-subtle text-[11px] font-bold">
              Kháng cự {resistanceLabel}
            </text>
            <text x="8" y={supportY + 30} className="fill-subtle text-[11px] font-bold">
              Hỗ trợ {supportLabel}
            </text>
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line key={ratio} x1="0" x2={width} y1={priceHeight * ratio} y2={priceHeight * ratio} stroke="currentColor" className="text-border-soft" strokeDasharray="4 8" />
            ))}
            <path d={ma50Path} fill="none" stroke="currentColor" className="text-subtle" strokeDasharray="7 7" strokeWidth="2" />
            <path d={ma20Path} fill="none" stroke="#00A676" strokeDasharray="4 6" strokeWidth="2" />
            <path d={pricePath} fill="none" stroke="currentColor" className="text-accent" strokeWidth="3" />
            {data.points.map((point, index) => {
              const x = (index / Math.max(1, data.points.length - 1)) * width;
              const y = priceHeight - ((point.price - minPrice) / priceSpan) * priceHeight;
              const event = data.events.find((item) => item.pointIndex === index);

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
                const h = (point.volume / maxVolume) * volumeHeight;
                return (
                  <rect
                    key={point.label}
                    x={x}
                    y={volumeHeight - h}
                    width={barWidth}
                    height={h}
                    rx="2"
                    className="fill-muted"
                    opacity={point.volume > 3.5 ? 0.7 : 0.35}
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
