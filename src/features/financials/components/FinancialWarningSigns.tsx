import { Chip } from "@/components/ui";
import type { FinancialWarningSignsData } from "../types";
import { DetailToggleCard } from "./DetailToggleCard";
import { FinancialsSectionCard } from "./FinancialsSectionCard";

type FinancialWarningSignsProps = {
  data: FinancialWarningSignsData;
};

export function FinancialWarningSigns({ data }: FinancialWarningSignsProps) {
  const visibleItems = data.items.slice(0, data.visibleItemCount);
  const hiddenItems = data.items.slice(data.visibleItemCount);

  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <Chip variant={data.tone}>{data.classificationLabel}: {data.classification}</Chip>
        <div className="grid gap-2 sm:grid-cols-2">
          {visibleItems.map((item, index) => (
            <div key={item} className="rounded-[4px] border-[1.5px] border-border bg-warning/25 px-3 py-2">
              <p className="text-sm leading-6 text-muted">
                <span className="font-mono text-xs font-bold text-ink">{index + 1}. </span>
                {item}
              </p>
            </div>
          ))}
        </div>
        <DetailToggleCard details={hiddenItems} labels={data.detailLabels} />
        <p className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-2 text-sm leading-6 text-muted">
          {data.warning}
        </p>
      </div>
    </FinancialsSectionCard>
  );
}
