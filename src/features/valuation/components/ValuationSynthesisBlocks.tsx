"use client";

import { useMemo, useState } from "react";
import { Button, Chip } from "@/components/ui";
import type {
  ConfidenceData,
  DetailLabels,
  MarginOfSafetyData,
  PersonalThesisData,
  RangeSummaryData,
  ValuationTutorData,
} from "../types";
import { DetailToggleCard } from "./DetailToggleCard";
import { MethodReliabilityCard } from "./MethodReliabilityCard";
import { SimpleMetricGrid } from "./SimpleMetricGrid";
import { SimpleRangeChart } from "./SimpleRangeChart";
import { ValuationSectionCard } from "./ValuationSectionCard";

type SharedBlockProps<T> = {
  data: T;
  detailLabels: DetailLabels;
};

export function MarginOfSafetyBlock({
  data,
  detailLabels,
}: SharedBlockProps<MarginOfSafetyData>) {
  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleMetricGrid columns="two" items={data.items} />
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function ValuationConfidenceBlock({
  data,
  detailLabels,
}: SharedBlockProps<ConfidenceData>) {
  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-3">
        {data.methods.map((method) => (
          <MethodReliabilityCard key={method.method} method={method} />
        ))}
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function ValuationRangeSummaryBlock({
  data,
  detailLabels,
}: SharedBlockProps<RangeSummaryData>) {
  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleRangeChart data={data} />
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function ValuationTutorBlock({
  data,
  detailLabels,
}: SharedBlockProps<ValuationTutorData>) {
  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleMetricGrid columns="two" items={data.explanations} />
        <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft/70 px-4 py-3 shadow-soft">
          <Chip variant="accent">Câu hỏi tự kiểm tra</Chip>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
            {data.questions.map((question) => <li key={question}>{question}</li>)}
          </ul>
        </div>
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function PersonalValuationThesis({ data }: { data: PersonalThesisData }) {
  const template = useMemo(() => data.prompts.join("\n"), [data.prompts]);
  const [value, setValue] = useState(template);

  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="grid gap-3">
        <textarea
          className="min-h-72 w-full resize-y rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:bg-accent-soft"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={data.placeholder}
        />
        <Button size="sm" variant="secondary">
          Ghi nhận bản nháp
        </Button>
      </div>
    </ValuationSectionCard>
  );
}
