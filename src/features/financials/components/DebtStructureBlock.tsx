import { Chip } from "@/components/ui";
import type { DebtStructureData } from "../types";
import { DetailToggleCard } from "./DetailToggleCard";
import { FinancialsSectionCard } from "./FinancialsSectionCard";
import { SimpleMetricGrid } from "./SimpleMetricGrid";

type DebtStructureBlockProps = {
  data: DebtStructureData;
};

export function DebtStructureBlock({ data }: DebtStructureBlockProps) {
  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <Chip variant={data.tone}>{data.classificationLabel}: {data.classification}</Chip>
        <SimpleMetricGrid columns="three" items={data.fields} />
        <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
          <p className="mb-3 text-sm font-bold text-ink">{data.timelineTitle}</p>
          <div className="flex flex-wrap items-center gap-2">
            {data.timeline.map((item, index) => (
              <div key={item.label} className="flex items-center gap-2">
                <Chip variant="neutral">{item.label}</Chip>
                {index < data.timeline.length - 1 ? <span className="text-subtle">→</span> : null}
              </div>
            ))}
          </div>
        </div>
        <DetailToggleCard details={data.details} labels={data.detailLabels} />
      </div>
    </FinancialsSectionCard>
  );
}
