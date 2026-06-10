"use client";

import { Chip, Tabs } from "@/components/ui";
import type { IndustrySpecificFinancialsData } from "../types";
import { DetailToggleCard } from "./DetailToggleCard";
import { FinancialsSectionCard } from "./FinancialsSectionCard";

type IndustrySpecificFinancialsBlockProps = {
  data: IndustrySpecificFinancialsData;
};

export function IndustrySpecificFinancialsBlock({ data }: IndustrySpecificFinancialsBlockProps) {
  const tabs = data.groups.map((group) => ({
    value: group.value,
    label: group.title,
    content: (
      <div className="flex flex-wrap gap-2">
        {group.criteria.map((criterion) => (
          <Chip key={criterion} variant={group.value === "retail" ? "accent" : "neutral"}>
            {criterion}
          </Chip>
        ))}
      </div>
    ),
  }));

  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <Tabs ariaLabel={data.title} defaultValue="retail" items={tabs} />
        <DetailToggleCard details={data.details} labels={data.detailLabels} />
      </div>
    </FinancialsSectionCard>
  );
}
