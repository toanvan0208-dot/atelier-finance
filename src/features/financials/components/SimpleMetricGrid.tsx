import { Chip } from "@/components/ui";
import type { FieldItem } from "../types";

type SimpleMetricGridProps = {
  items: FieldItem[];
  columns?: "one" | "two" | "three";
};

const gridClasses = {
  one: "space-y-3",
  two: "grid gap-3 sm:grid-cols-2",
  three: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
};

export function SimpleMetricGrid({ columns = "two", items }: SimpleMetricGridProps) {
  return (
    <div className={gridClasses[columns]}>
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
        >
          <Chip size="sm" variant={item.tone ?? "neutral"}>{item.label}</Chip>
          <p className="mt-2 text-sm leading-6 text-muted">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
