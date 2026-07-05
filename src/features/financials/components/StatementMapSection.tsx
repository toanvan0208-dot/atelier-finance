import { useState } from "react";
import { Button } from "@/components/ui";
import type { FinancialDeskMetric, FinancialStatementDeskItem } from "../types";

type StatementMapSectionProps = {
  items: FinancialStatementDeskItem[];
  metrics: FinancialDeskMetric[];
};

const metricStatusClass: Record<FinancialDeskMetric["status"], string> = {
  good: "border-emerald-300 bg-emerald-50 text-emerald-900",
  watch: "border-amber-300 bg-amber-50 text-amber-900",
  risk: "border-red-300 bg-red-50 text-red-900",
  neutral: "border-border-soft bg-surface text-ink",
  unknown: "border-border-soft bg-surface text-muted",
};

const lineStatusClass: Record<NonNullable<FinancialStatementDeskItem["sourceLines"]>[number]["status"], string> = {
  available: "border-border-soft bg-surface text-ink",
  derived: "border-accent/35 bg-accent/10 text-ink",
  missing: "border-amber-200 bg-amber-50 text-amber-900",
};

const lineStatusLabel: Record<NonNullable<FinancialStatementDeskItem["sourceLines"]>[number]["status"], string> = {
  available: "Có dữ liệu",
  derived: "Suy ra",
  missing: "Thiếu",
};

const metricUnitText = (metric: FinancialDeskMetric) =>
  metric.unit && metric.status !== "unknown" && !metric.value.toLowerCase().includes("chưa") ? ` ${metric.unit}` : "";

export function StatementMapSection({ items, metrics }: StatementMapSectionProps) {
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());
  const metricById = new Map(metrics.map((metric) => [metric.id, metric]));

  const toggleItem = (itemId: string) => {
    setExpandedItemIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  return (
    <section className="rounded-[6px] border border-border bg-surface p-4">
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-ink">Sơ đồ 3 báo cáo chính</h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          Đọc báo cáo tài chính theo một dòng: doanh nghiệp kiếm tiền, giữ tài sản và thu tiền thật như thế nào.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {items.map((item) => {
          const isExpanded = expandedItemIds.has(item.id);
          const relatedMetrics = item.relatedMetricIds
            .map((metricId) => metricById.get(metricId))
            .filter((metric): metric is FinancialDeskMetric => Boolean(metric));

          return (
            <article key={item.id} className="rounded-[6px] border border-border-soft bg-canvas p-4">
              <div>
                <h4 className="text-sm font-extrabold text-ink">{item.title}</h4>
                <p className="mt-2 text-xs leading-5 text-muted">{item.mainQuestion}</p>
              </div>

              {item.readSummary ? (
                <p className="mt-3 rounded-[4px] border border-accent/35 bg-accent/10 px-3 py-2 text-xs font-semibold leading-5 text-ink">
                  {item.readSummary}
                </p>
              ) : null}

              <div className="mt-3">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.02em] text-muted">
                  Dòng gốc trên báo cáo
                </p>
                {item.sourceLines && item.sourceLines.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {item.sourceLines.map((line) => (
                      <div key={line.label} className={`rounded-[4px] border px-3 py-2 text-xs ${lineStatusClass[line.status]}`}>
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-bold">{line.label}</span>
                          <span className="shrink-0 text-right font-semibold">{line.value}</span>
                        </div>
                        <div className="mt-1 flex items-start justify-between gap-3 text-[11px] leading-4 opacity-80">
                          <span>{line.note}</span>
                          <span className="shrink-0 font-bold">{lineStatusLabel[line.status]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-xs text-muted">
                    {item.keyLines.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {item.dataPoints && item.dataPoints.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {item.dataPoints.map((point) => (
                    <div
                      key={point}
                      className="rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted"
                    >
                      {point}
                    </div>
                  ))}
                </div>
              ) : null}

              {item.interpretation ? (
                <div className="mt-3 rounded-[4px] border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <p className="text-xs font-extrabold text-emerald-900">Diễn giải</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-900">{item.interpretation}</p>
                </div>
              ) : null}

              {item.watchOut ? (
                <div className="mt-3 rounded-[4px] border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs font-extrabold text-amber-900">Cần kiểm tra tiếp</p>
                  <p className="mt-1 text-xs leading-5 text-amber-900">{item.watchOut}</p>
                </div>
              ) : null}

              <div className="mt-4">
                <Button size="sm" type="button" variant="secondary" onClick={() => toggleItem(item.id)}>
                  {isExpanded ? "Ẩn chỉ số liên quan" : "Xem chỉ số liên quan"}
                </Button>
              </div>

              {isExpanded ? (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.02em] text-muted">
                    Chỉ số suy ra từ các dòng trên
                  </p>
                  {relatedMetrics.length > 0 ? (
                    relatedMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        className={`rounded-[4px] border px-3 py-2 text-xs ${metricStatusClass[metric.status]}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold">{metric.label}</span>
                          <span className="shrink-0 text-right">
                            {metric.value}
                            {metricUnitText(metric)}
                          </span>
                        </div>
                        {metric.currentInterpretation ? (
                          <p className="mt-1.5 leading-5 opacity-90">{metric.currentInterpretation}</p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs text-muted">
                      Chưa có chỉ số liên quan đủ dữ liệu trong bước hiện tại.
                    </p>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
