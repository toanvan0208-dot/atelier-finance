import { Chip } from "@/components/ui";
import type { FieldItem } from "../types";

type BusinessFieldGridProps = {
  items: FieldItem[];
  columns?: "one" | "two";
};

export function BusinessFieldGrid({ columns = "two", items }: BusinessFieldGridProps) {
  return (
    <div className={columns === "two" ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
        >
          <Chip size="sm" variant="neutral">{item.label}</Chip>
          <p className="mt-2 text-sm leading-6 text-muted">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
