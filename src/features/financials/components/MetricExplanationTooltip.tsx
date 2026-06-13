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
  unknown: "Thiếu dữ liệu",
};

const statusChip: Record<FinancialDeskMetric["status"], "success" | "warning" | "danger" | "neutral"> = {
  good: "success",
  watch: "warning",
  risk: "danger",
  neutral: "neutral",
  unknown: "neutral",
};

const statusBorder: Record<FinancialDeskMetric["status"], string> = {
  good: "border-accent-green/50 bg-accent-green/5",
  watch: "border-warning/70 bg-warning/10",
  risk: "border-danger/60 bg-danger/5",
  neutral: "border-border-soft bg-surface",
  unknown: "border-border-soft bg-neutral",
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
          <span className="font-bold text-accent-green">Điểm thuận lợi: </span>
          {metric.goodSignal}
        </p>
        <p>
          <span className="font-bold text-danger">Cần tránh hiểu nhầm: </span>
          {metric.badSignal}
        </p>
      </div>
      {metric.warning || metric.missingFields?.length || metric.dataQuality ? (
        <div className="mt-3 space-y-2 rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
          {metric.dataQuality ? (
            <p>
              <span className="font-bold text-ink">Chất lượng dữ liệu: </span>
              {metric.dataQuality}
            </p>
          ) : null}
          {metric.warning ? (
            <p>
              <span className="font-bold text-ink">Cảnh báo: </span>
              {metric.warning}
            </p>
          ) : null}
          {metric.missingFields?.length ? (
            <p>
              <span className="font-bold text-ink">Thiếu: </span>
              {metric.missingFields.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </details>
  );
}
