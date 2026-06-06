import { Chip } from "@/components/ui";
import type { LineSeries, StatusTone } from "../types";

type SimpleLineChartProps = {
  title: string;
  series: LineSeries[];
};

const toneClasses: Record<StatusTone, string> = {
  accent: "bg-accent",
  success: "bg-accent-green",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted",
};

export function SimpleLineChart({ series, title }: SimpleLineChartProps) {
  const maxValue = Math.max(
    1,
    ...series.flatMap((item) => item.points.map((point) => Math.abs(point.value)))
  );

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="mb-3 text-sm font-bold text-ink">{title}</p>
      <div className="space-y-4">
        {series.map((item) => (
          <div key={item.name}>
            <div className="mb-2 flex items-center gap-2">
              <Chip size="sm" variant={item.tone}>{item.name}</Chip>
            </div>
            <div className="flex h-28 items-end gap-2 border-b border-border-soft pb-2">
              {item.points.map((point) => (
                <div key={`${item.name}-${point.label}`} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-[4px] ${toneClasses[item.tone]}`}
                    style={{ height: `${Math.max(8, (Math.abs(point.value) / maxValue) * 100)}%` }}
                  />
                  <span className="text-[10px] text-subtle">{point.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
