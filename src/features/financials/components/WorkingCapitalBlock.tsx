import { Chip } from "@/components/ui";
import type { WorkingCapitalData } from "../types";
import { FinancialsSectionCard } from "./FinancialsSectionCard";
import { SimpleMetricGrid } from "./SimpleMetricGrid";

type WorkingCapitalBlockProps = {
  data: WorkingCapitalData;
};

export function WorkingCapitalBlock({ data }: WorkingCapitalBlockProps) {
  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <Chip variant={data.tone}>{data.classificationLabel}: {data.classification}</Chip>
        <div className="flex flex-wrap items-center gap-2 rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
          {data.flow.map((step, index) => (
            <div key={`${step}-${index}`} className="flex items-center gap-2">
              <Chip variant="neutral">{step}</Chip>
              {index < data.flow.length - 1 ? <span className="text-subtle">→</span> : null}
            </div>
          ))}
        </div>
        <SimpleMetricGrid columns="three" items={data.fields} />
      </div>
    </FinancialsSectionCard>
  );
}
