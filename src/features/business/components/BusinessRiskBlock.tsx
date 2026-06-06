import { Chip } from "@/components/ui";
import type { BusinessRiskData } from "../types";
import { BusinessSectionCard } from "./BusinessSectionCard";
import { DetailToggleCard } from "./DetailToggleCard";

type BusinessRiskBlockProps = {
  data: BusinessRiskData;
};

export function BusinessRiskBlock({ data }: BusinessRiskBlockProps) {
  return (
    <BusinessSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {data.items.map((item) => (
            <div key={item.title} className="rounded-[4px] border-[1.5px] border-border bg-warning/25 px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-ink">{item.title}</p>
                <Chip size="sm" variant={item.tone}>{item.level}</Chip>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
            </div>
          ))}
        </div>
        <DetailToggleCard details={data.details} labels={data.detailLabels} />
      </div>
    </BusinessSectionCard>
  );
}
