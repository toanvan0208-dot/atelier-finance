"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import type { ScreeningInputData, ScreeningOption } from "../types";

type ScreeningInputPanelProps = {
  data: ScreeningInputData;
  onIndustryChange?: (industry: string) => void;
};

function getSelectedLabel(items: ScreeningOption[], value: string, fallback: string) {
  return items.find((item) => item.value === value)?.label ?? fallback;
}

function ChoiceGroup({
  activeValue,
  items,
  label,
  onChange,
}: {
  activeValue: string;
  items: ScreeningOption[];
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
        {label}
      </p>
      <div className="grid gap-2">
        {items.map((item) => {
          const isActive = item.value === activeValue;

          return (
            <button
              key={item.value}
              className={[
                "rounded-[4px] border-[1.5px] px-3 py-2 text-left transition",
                isActive
                  ? "border-border bg-accent-soft shadow-hard-sm"
                  : "border-border-soft bg-surface hover:border-border hover:bg-surface-hover",
              ].join(" ")}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(item.value)}
            >
              <span className="block text-xs font-bold text-ink">{item.label}</span>
              {item.description ? (
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {item.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ScreeningInputPanel({
  data,
  onIndustryChange,
}: ScreeningInputPanelProps) {
  const [selectedIndustry, setSelectedIndustry] = useState(data.defaultIndustry);
  const [selectedRisk, setSelectedRisk] = useState(data.defaultRisk);
  const [selectedObjective, setSelectedObjective] = useState(data.defaultObjective);

  function handleIndustryChange(value: string) {
    setSelectedIndustry(value);
    onIndustryChange?.(value);
  }

  const sentence = useMemo(() => {
    const industry = getSelectedLabel(
      data.industries,
      selectedIndustry,
      data.sentenceTemplate.industryFallback
    );
    const risk = getSelectedLabel(
      data.riskLevels,
      selectedRisk,
      data.sentenceTemplate.riskFallback
    );
    const objective = getSelectedLabel(
      data.objectives,
      selectedObjective,
      data.sentenceTemplate.objectiveFallback
    );

    return `${data.sentenceTemplate.prefix} ${industry} phù hợp với ${risk} để ${objective.toLowerCase()}.`;
  }, [data, selectedIndustry, selectedObjective, selectedRisk]);

  return (
    <Card className="border-border bg-surface">
      <CardHeader description={data.description} icon="F" title={data.title} />
      <CardBody className="space-y-5">
        <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-4">
          <p className="text-base font-bold leading-7 text-ink">{sentence}</p>
          <p className="mt-2 text-xs leading-5 text-muted">{data.example}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
          <ChoiceGroup
            activeValue={selectedIndustry}
            items={data.industries}
            label={data.industryLabel}
            onChange={handleIndustryChange}
          />
          <ChoiceGroup
            activeValue={selectedRisk}
            items={data.riskLevels}
            label={data.riskLabel}
            onChange={setSelectedRisk}
          />
          <ChoiceGroup
            activeValue={selectedObjective}
            items={data.objectives}
            label={data.objectiveLabel}
            onChange={setSelectedObjective}
          />
        </div>

        {selectedRisk === "high" ? (
          <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs font-semibold leading-5 text-ink">
            {data.highRiskWarning}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-border-soft pt-4">
          <Button size="sm" variant="secondary">
            Lưu câu lọc
          </Button>
          <Button size="sm" variant="ghost">
            Đặt lại về mẫu dễ hiểu
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
