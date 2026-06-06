import type { BarSeries, StatusTone } from "../types";

type SimpleBarChartProps = {
  title: string;
  bars: BarSeries[];
};

const barToneClasses: Record<StatusTone, string> = {
  accent: "bg-accent",
  success: "bg-accent-green",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted",
};

export function SimpleBarChart({ bars, title }: SimpleBarChartProps) {
  const maxValue = Math.max(1, ...bars.map((bar) => bar.value));

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="mb-3 text-sm font-bold text-ink">{title}</p>
      <div className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="mb-1 flex justify-between gap-3 text-xs">
              <span className="font-medium text-ink">{bar.label}</span>
              <span className="font-mono text-muted">{bar.value}</span>
            </div>
            <div className="h-3 rounded-full bg-surface-soft">
              <div
                className={`h-full rounded-full ${barToneClasses[bar.tone]}`}
                style={{ width: `${Math.max(8, (bar.value / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
