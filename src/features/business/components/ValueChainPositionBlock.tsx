import { Chip } from "@/components/ui";
import type { ValueChainData } from "../types";
import { BusinessFieldGrid } from "./BusinessFieldGrid";
import { BusinessSectionCard } from "./BusinessSectionCard";
import { DetailToggleCard } from "./DetailToggleCard";

type ValueChainPositionBlockProps = {
  data: ValueChainData;
};

export function ValueChainPositionBlock({ data }: ValueChainPositionBlockProps) {
  return (
    <BusinessSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {data.chain.map((node, index) => (
            <div key={node} className="flex items-center gap-2">
              <Chip variant={node === data.activeNode ? "accent" : "neutral"}>{node}</Chip>
              {index < data.chain.length - 1 ? <span className="text-subtle">→</span> : null}
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-ink">{data.powerTitle}</p>
          <BusinessFieldGrid items={data.powerItems} />
        </div>
        <p className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-2 text-sm leading-6 text-muted">
          {data.conclusion}
        </p>
        <DetailToggleCard details={data.details} labels={data.detailLabels} />
      </div>
    </BusinessSectionCard>
  );
}
