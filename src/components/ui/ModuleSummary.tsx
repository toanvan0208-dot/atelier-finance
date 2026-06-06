import type { ReactNode } from "react";

type SummaryItem = {
  label: ReactNode;
  value: ReactNode;
};

type ModuleSummaryProps = {
  title: ReactNode;
  items: SummaryItem[];
};

export function ModuleSummary({ items, title }: ModuleSummaryProps) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
      <h2 className="font-brand text-base font-bold text-ink">{title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={`${String(item.label)}-${index}`}
            className="rounded-[4px] border border-border-soft bg-surface-soft/70 px-3 py-3"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
              {item.label}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
