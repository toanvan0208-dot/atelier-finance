import { Chip } from "@/components/ui";
import type { RatioItem } from "../types";

type RatioStatusCardProps = {
  item: RatioItem;
};

export function RatioStatusCard({ item }: RatioStatusCardProps) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{item.name}</p>
        <Chip size="sm" variant={item.tone}>{item.status}</Chip>
      </div>
      <p className="mt-2 font-mono text-xl font-bold text-ink">{item.value}</p>
      <div className="mt-2 space-y-1 text-xs leading-5 text-muted">
        <p>{item.trend}</p>
        <p>{item.industryCompare}</p>
        <p>{item.explanation}</p>
      </div>
    </div>
  );
}
