import type { StockEvent } from "../types";
import { ToneBadge } from "./WatchlistPrimitives";

type StockEventBadgeProps = {
  event: StockEvent;
};

export function StockEventBadge({ event }: StockEventBadgeProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
      <div>
        <p className="text-xs font-bold text-ink">{event.label}</p>
        <p className="mt-1 font-mono text-[11px] text-subtle">{event.date}</p>
      </div>
      <ToneBadge label="Theo dõi" tone={event.tone} />
    </div>
  );
}
