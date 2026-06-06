import { Chip } from "@/components/ui";
import type { CapitalAllocationData } from "../types";
import { BusinessFieldGrid } from "./BusinessFieldGrid";
import { BusinessSectionCard } from "./BusinessSectionCard";

type CapitalAllocationBlockProps = {
  data: CapitalAllocationData;
};

export function CapitalAllocationBlock({ data }: CapitalAllocationBlockProps) {
  return (
    <BusinessSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <BusinessFieldGrid items={data.items} />
        <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
          <Chip variant={data.tone}>{data.assessmentLabel}</Chip>
          <p className="mt-2 text-sm leading-6 text-muted">{data.assessment}</p>
        </div>
      </div>
    </BusinessSectionCard>
  );
}
