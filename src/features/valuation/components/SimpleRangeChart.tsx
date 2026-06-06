import { Chip } from "@/components/ui";
import type { RangeSummaryData } from "../types";

type SimpleRangeChartProps = {
  data: Pick<RangeSummaryData, "ranges" | "minDomain" | "maxDomain">;
};

const rangeToneClasses = {
  neutral: "bg-ink",
  accent: "bg-accent",
  success: "bg-accent-green",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function SimpleRangeChart({ data }: SimpleRangeChartProps) {
  const span = data.maxDomain - data.minDomain;

  return (
    <div className="space-y-3 rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      {data.ranges.map((range) => {
        const left = ((range.min - data.minDomain) / span) * 100;
        const width = ((range.max - range.min) / span) * 100;

        return (
          <div key={range.method} className="grid gap-2 sm:grid-cols-[96px_minmax(0,1fr)_112px] sm:items-center">
            <span className="text-xs font-bold text-ink">{range.method}</span>
            <div className="relative h-5 rounded-[3px] border border-border-soft bg-surface-soft">
              <div
                className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-[2px] border border-border ${rangeToneClasses[range.tone]}`}
                style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
                aria-hidden="true"
              />
            </div>
            <Chip size="sm" variant={range.tone}>{range.label}</Chip>
          </div>
        );
      })}
    </div>
  );
}
