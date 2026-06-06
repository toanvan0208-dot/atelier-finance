import { EmptyState } from "@/components/ui";
import type { RevenueSourceData, SegmentMixItem } from "../types";
import { BusinessFieldGrid } from "./BusinessFieldGrid";
import { BusinessSectionCard } from "./BusinessSectionCard";

type RevenueSourceBlockProps = {
  data: RevenueSourceData;
};

function SegmentBar({ item }: { item: SegmentMixItem }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-ink">{item.name}</span>
        <span className="font-mono text-muted">{item.value}%</span>
      </div>
      <div className="h-3 rounded-[3px] border border-border bg-surface-soft">
        <div
          className="h-full rounded-[2px] border-r border-border bg-accent"
          style={{ width: `${item.value}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] leading-4 text-subtle">{item.note}</p>
    </div>
  );
}

function MixPanel({
  emptyMessage,
  items,
  title,
}: {
  emptyMessage: string;
  items: SegmentMixItem[];
  title: string;
}) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3">
      <p className="mb-3 text-xs font-bold text-ink">{title}</p>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <SegmentBar key={item.name} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState description={emptyMessage} title={emptyMessage} />
      )}
    </div>
  );
}

export function RevenueSourceBlock({ data }: RevenueSourceBlockProps) {
  return (
    <BusinessSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <BusinessFieldGrid items={data.fields} />
        <div className="grid gap-3 lg:grid-cols-2">
          <MixPanel
            emptyMessage={data.insufficientDataMessage}
            items={data.revenueMix}
            title={data.revenueTitle}
          />
          <MixPanel
            emptyMessage={data.insufficientDataMessage}
            items={data.profitMix}
            title={data.profitTitle}
          />
        </div>
      </div>
    </BusinessSectionCard>
  );
}
