import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { FinancialDeskMetric } from "../types";

type MetricExplanationTooltipProps = {
  metric: FinancialDeskMetric;
};

const statusLabel: Record<FinancialDeskMetric["status"], string> = {
  good: "Tốt",
  watch: "Theo dõi",
  risk: "Cảnh báo",
  neutral: "Trung tính",
};

const statusChip: Record<FinancialDeskMetric["status"], "success" | "warning" | "danger" | "neutral"> = {
  good: "success",
  watch: "warning",
  risk: "danger",
  neutral: "neutral",
};

const statusBorder: Record<FinancialDeskMetric["status"], string> = {
  good: "border-accent-green/50 bg-accent-green/5",
  watch: "border-warning/70 bg-warning/10",
  risk: "border-danger/60 bg-danger/5",
  neutral: "border-border-soft bg-surface",
};

export function MetricExplanationTooltip({ metric }: MetricExplanationTooltipProps) {
  return (
    <details
      className={cn(
        "group rounded-[6px] border p-3 transition open:shadow-hard-sm",
        statusBorder[metric.status]
      )}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-ink">{metric.label}</span>
          <span className="mt-1 block text-xs text-muted">{metric.period}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="text-right text-base font-extrabold text-ink">
            {metric.value}
            {metric.unit ? <span className="ml-1 text-xs font-bold text-muted">{metric.unit}</span> : null}
          </span>
          <Chip size="sm" variant={statusChip[metric.status]}>
            {statusLabel[metric.status]}
          </Chip>
        </span>
      </summary>
      <div className="mt-3 grid gap-2 text-xs leading-5 text-muted sm:grid-cols-2">
        <p>
          <span className="font-bold text-ink">Là gì? </span>
          {metric.definition}
        </p>
        <p>
          <span className="font-bold text-ink">Đọc thế nào? </span>
          {metric.howToRead}
        </p>
        <p>
          <span className="font-bold text-accent-green">Dấu hiệu tốt: </span>
          {metric.goodSignal}
        </p>
        <p>
          <span className="font-bold text-danger">Dấu hiệu xấu: </span>
          {metric.badSignal}
        </p>
      </div>
    </details>
  );
}
