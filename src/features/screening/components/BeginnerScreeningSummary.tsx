import { Chip } from "@/components/ui";
import type { BeginnerScreeningData } from "../types";

type BeginnerScreeningSummaryProps = {
  data: BeginnerScreeningData;
};

export function BeginnerScreeningSummary({ data }: BeginnerScreeningSummaryProps) {
  return (
    <div className="grid gap-2 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 sm:grid-cols-2 lg:grid-cols-4">
      {data.items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3">
          <span className="text-xs leading-5 text-muted">{item.label}</span>
          <Chip variant={item.tone}>{item.value}</Chip>
        </div>
      ))}
    </div>
  );
}
