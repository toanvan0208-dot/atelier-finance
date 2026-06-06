import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MacroDashboardItem, MacroSignal } from "../types";

type MacroWarningDashboardProps = {
  items: MacroDashboardItem[];
  signals: MacroSignal[];
};

export function MacroWarningDashboard({
  items,
  signals,
}: MacroWarningDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className={cn(
              "grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3",
              item.active && "bg-accent-soft/70 shadow-hard-sm"
            )}
          >
            <div className="grid h-8 w-8 place-items-center rounded-[3px] border border-border-soft bg-surface font-mono text-xs font-bold text-ink">
              {item.icon}
            </div>
            <div className="min-w-0">
              <h4 className="truncate text-sm font-bold text-ink">{item.title}</h4>
              <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
            </div>
            <Chip variant={item.active ? "accent" : "neutral"}>{item.cadence}</Chip>
          </article>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.03em] text-subtle">
              {signal.label}
            </p>
            <p className="mt-1 text-xs font-bold leading-5 text-ink">
              {signal.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
