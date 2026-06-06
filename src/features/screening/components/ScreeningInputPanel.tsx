"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Tabs } from "@/components/ui";
import type { ScreeningInputData, ScreeningOption } from "../types";

type ScreeningInputPanelProps = {
  data: ScreeningInputData;
};

function OptionGrid({
  activeValue,
  items,
  onChange,
}: {
  activeValue: string;
  items: ScreeningOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const isActive = item.value === activeValue;

        return (
          <Button
            key={item.value}
            className="justify-start"
            variant={isActive ? "primary" : "secondary"}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}

export function ScreeningInputPanel({ data }: ScreeningInputPanelProps) {
  const [selectedIndustry, setSelectedIndustry] = useState(data.defaultIndustry);
  const [selectedRisk, setSelectedRisk] = useState(data.defaultRisk);
  const [selectedObjective, setSelectedObjective] = useState(data.defaultObjective);

  const tabs = useMemo(
    () => [
      {
        value: "industry",
        label: data.industryLabel,
        content: (
          <OptionGrid
            activeValue={selectedIndustry}
            items={data.industries}
            onChange={setSelectedIndustry}
          />
        ),
      },
      {
        value: "risk",
        label: data.riskLabel,
        content: (
          <OptionGrid
            activeValue={selectedRisk}
            items={data.riskLevels}
            onChange={setSelectedRisk}
          />
        ),
      },
      {
        value: "objective",
        label: data.objectiveLabel,
        content: (
          <OptionGrid
            activeValue={selectedObjective}
            items={data.objectives}
            onChange={setSelectedObjective}
          />
        ),
      },
    ],
    [data, selectedIndustry, selectedObjective, selectedRisk]
  );

  return (
    <Card>
      <CardHeader description={data.description} icon="I" title={data.title} />
      <CardBody className="space-y-4">
        <Tabs ariaLabel={data.title} items={tabs} />
        <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
            {data.thesisLabel}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">{data.thesis}</p>
        </div>
      </CardBody>
    </Card>
  );
}
