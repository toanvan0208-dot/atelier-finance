import { Button } from "@/components/ui";
import type { FinancialDeskMetric, FinancialStatementDeskItem } from "../types";

type StatementMapSectionProps = {
  items: FinancialStatementDeskItem[];
  metrics: FinancialDeskMetric[];
};

export function StatementMapSection({ items, metrics }: StatementMapSectionProps) {
  const metricById = new Map(metrics.map((metric) => [metric.id, metric]));

  return (
    <section className="rounded-[6px] border border-border bg-surface p-4">
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-ink">Sơ đồ 3 báo cáo chính</h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          Đọc báo cáo tài chính theo một dòng: doanh nghiệp kiếm tiền, giữ tài sản và thu tiền thật như thế nào.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-[6px] border border-border-soft bg-canvas p-4">
            <h4 className="text-sm font-extrabold text-ink">{item.title}</h4>
            <p className="mt-2 text-xs leading-5 text-muted">{item.mainQuestion}</p>
            <ul className="mt-3 space-y-1.5 text-xs text-muted">
              {item.keyLines.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <details className="mt-4">
              <summary className="list-none">
                <Button size="sm" variant="secondary">
                  Xem chỉ số liên quan
                </Button>
              </summary>
              <div className="mt-3 space-y-2">
                {item.relatedMetricIds.map((metricId) => {
                  const metric = metricById.get(metricId);
                  if (!metric) return null;
                  return (
                    <div key={metric.id} className="flex items-center justify-between gap-3 rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs">
                      <span className="font-bold text-ink">{metric.label}</span>
                      <span className="shrink-0 text-muted">
                        {metric.value} {metric.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
