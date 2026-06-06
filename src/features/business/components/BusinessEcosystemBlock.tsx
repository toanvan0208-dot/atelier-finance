import type { EcosystemData } from "../types";
import { BusinessFieldGrid } from "./BusinessFieldGrid";
import { BusinessSectionCard } from "./BusinessSectionCard";
import { DetailToggleCard } from "./DetailToggleCard";

type BusinessEcosystemBlockProps = {
  data: EcosystemData;
};

export function BusinessEcosystemBlock({ data }: BusinessEcosystemBlockProps) {
  return (
    <BusinessSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <BusinessFieldGrid items={data.fields} />
        <div className="rounded-[4px] border-[1.5px] border-border bg-warning/25 px-3 py-3">
          <p className="text-sm font-bold text-ink">{data.warningTitle}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{data.warning}</p>
        </div>
        <DetailToggleCard details={data.details} labels={data.detailLabels} />
      </div>
    </BusinessSectionCard>
  );
}
