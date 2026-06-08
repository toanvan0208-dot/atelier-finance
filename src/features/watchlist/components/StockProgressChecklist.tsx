import type { ModuleProgressItem } from "../types";
import { ModuleStatusBadge } from "./WatchlistPrimitives";

type StockProgressChecklistProps = {
  data: ModuleProgressItem[];
  compact?: boolean;
};

export function StockProgressChecklist({ compact = false, data }: StockProgressChecklistProps) {
  const visibleItems = compact ? data.slice(0, 6) : data;

  return (
    <div className="grid gap-2">
      {visibleItems.map((item) => (
        <div
          key={item.moduleName}
          className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-ink">{item.moduleName}</p>
            <ModuleStatusBadge status={item.status} />
          </div>
          {!compact ? (
            <div className="mt-2 flex items-start justify-between gap-3">
              <p className="text-[11px] leading-4 text-muted">{item.question}</p>
              <span className="shrink-0 text-[11px] font-bold text-subtle">
                {item.actionLabel}
              </span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
