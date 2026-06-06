import { Chip } from "@/components/ui";
import type { CompetitiveAdvantageData } from "../types";
import { BusinessSectionCard } from "./BusinessSectionCard";
import { DetailToggleCard } from "./DetailToggleCard";

type CompetitiveAdvantageBlockProps = {
  data: CompetitiveAdvantageData;
};

export function CompetitiveAdvantageBlock({ data }: CompetitiveAdvantageBlockProps) {
  return (
    <BusinessSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {data.items.map((item) => (
            <div key={item.name} className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
              <Chip variant={item.tone}>{item.name}</Chip>
              <p className="mt-2 text-sm leading-6 text-muted">{item.evidence}</p>
            </div>
          ))}
        </div>
        <DetailToggleCard details={data.details} labels={data.detailLabels} />
      </div>
    </BusinessSectionCard>
  );
}
