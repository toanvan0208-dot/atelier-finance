import type { PricePoint } from "../types";

type SimplePriceVolumeChartProps = {
  points: PricePoint[];
  title: string;
};

function buildPath(points: PricePoint[], width: number, height: number) {
  const min = Math.min(...points.map((point) => point.price));
  const max = Math.max(...points.map((point) => point.price));
  const span = Math.max(1, max - min);

  return points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = height - ((point.price - min) / span) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function SimplePriceVolumeChart({ points, title }: SimplePriceVolumeChartProps) {
  const width = 320;
  const height = 120;
  const path = buildPath(points, width, height);

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="mb-3 text-sm font-bold text-ink">{title}</p>
      <svg
        className="h-36 w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
      >
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
