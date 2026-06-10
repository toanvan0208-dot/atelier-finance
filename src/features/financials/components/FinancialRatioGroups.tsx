"use client";

import { Tabs } from "@/components/ui";
import type { FinancialRatioGroupsData } from "../types";
import { DetailToggleCard } from "./DetailToggleCard";
import { FinancialsSectionCard } from "./FinancialsSectionCard";
import { RatioStatusCard } from "./RatioStatusCard";

type FinancialRatioGroupsProps = {
  data: FinancialRatioGroupsData;
};

export function FinancialRatioGroups({ data }: FinancialRatioGroupsProps) {
  const tabs = data.groups.map((group) => ({
    value: group.value,
    label: group.title,
    content: (
      <div className="space-y-3">
        <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-sm leading-6 text-muted">
          {group.question}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {group.ratios.map((ratio) => (
            <RatioStatusCard key={ratio.name} item={ratio} />
          ))}
        </div>
      </div>
    ),
  }));

  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <Tabs ariaLabel={data.title} items={tabs} />
        <DetailToggleCard details={data.details} labels={data.detailLabels} />
      </div>
    </FinancialsSectionCard>
  );
}
