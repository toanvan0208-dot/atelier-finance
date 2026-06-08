import type { PricePoint } from "../types";

type SimplePriceVolumeChartProps = {
  points: PricePoint[];
  title: string;
};

function buildPath(points: PricePoint[], width: number, height: number) {
  const values = points.flatMap((point) => [point.price, point.ma20, point.ma50].filter(Boolean) as number[]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);

  return points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = height - ((point.price - min) / span) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildIndicatorPath(
  points: PricePoint[],
  width: number,
  height: number,
  key: "ma20" | "ma50"
) {
  const values = points.flatMap((point) => [point.price, point.ma20, point.ma50].filter(Boolean) as number[]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);

  return points
    .filter((point) => typeof point[key] === "number")
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width;
      const value = point[key] ?? point.price;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function SimplePriceVolumeChart({ points, title }: SimplePriceVolumeChartProps) {
  const width = 320;
  const height = 120;
  const path = buildPath(points, width, height);
  const ma20Path = buildIndicatorPath(points, width, height, "ma20");
  const ma50Path = buildIndicatorPath(points, width, height, "ma50");

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink">{title}</p>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-subtle">
          <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 bg-accent" />Giá</span>
          <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 bg-[#00A676]" />MA20</span>
          <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 bg-subtle" />MA50</span>
        </div>
      </div>
      <svg
        className="h-36 w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
      >
        <path d={ma50Path} fill="none" stroke="currentColor" strokeDasharray="5 5" strokeWidth="2" className="text-subtle" />
        <path d={ma20Path} fill="none" stroke="#00A676" strokeDasharray="3 4" strokeWidth="2" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="3" className="text-accent" />
        {points.map((point, index) => {
          const x = (index / Math.max(1, points.length - 1)) * width;
          const min = Math.min(...points.map((item) => item.price));
          const max = Math.max(...points.map((item) => item.price));
          const y = height - ((point.price - min) / Math.max(1, max - min)) * height;

          return (
            <circle
              key={point.label}
              cx={x}
              cy={y}
              r="3"
              className="fill-surface stroke-accent"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-subtle">
        {points.map((point) => <span key={point.label}>{point.label}</span>)}
      </div>
    </div>
  );
}
