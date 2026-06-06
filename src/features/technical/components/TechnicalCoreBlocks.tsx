"use client";

import { useMemo, useState } from "react";
import { Button, Chip, DataTable, Tabs } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type {
  CrossModuleAlignmentData,
  DetailLabels,
  FomoBehaviorData,
  MarketPsychologyData,
  MovementExplanationData,
  NewsEvent,
  NewsEventData,
  PersonalMarketObservationData,
  PricePositionData,
  PriceVolumeStoryData,
  RelativeStrengthData,
  TechnicalOutputSummaryData,
  TimeframeSelectorData,
  TrendMapData,
  VolatilityData,
} from "../types";
import { ChecklistItem } from "./ChecklistItem";
import { DetailToggleCard } from "./DetailToggleCard";
import { IndicatorToggleGroup } from "./IndicatorToggleGroup";
import { PsychologyTemperatureBar } from "./PsychologyTemperatureBar";
import { SimpleMetricGrid } from "./SimpleMetricGrid";
import { SimplePriceVolumeChart } from "./SimplePriceVolumeChart";
import { SimpleVolumeBars } from "./SimpleVolumeBars";
import { TechnicalSectionCard } from "./TechnicalSectionCard";
import { TutorNote } from "./TutorNote";

type SharedBlockProps<T> = {
  data: T;
  detailLabels: DetailLabels;
};

export function TimeframeSelectorBlock({
  data,
  detailLabels,
}: SharedBlockProps<TimeframeSelectorData>) {
  const [selected, setSelected] = useState(data.defaultValue);

  return (
    <TechnicalSectionCard
      action={<Chip variant="accent">{selected}</Chip>}
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {data.options.map((option) => (
            <Button
              key={option.label}
              size="sm"
              variant={selected === option.label ? "primary" : "secondary"}
              onClick={() => setSelected(option.label)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <SimpleMetricGrid columns="three" items={data.options} />
        {data.tutor ? <TutorNote data={data.tutor} /> : null}
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}

export function TrendMapBlock({ data, detailLabels }: SharedBlockProps<TrendMapData>) {
  return (
    <TechnicalSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleMetricGrid columns="three" items={data.trends} />
        {data.tutor ? <TutorNote data={data.tutor} /> : null}
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}

export function PriceVolumeStoryBlock({
  data,
  detailLabels,
}: SharedBlockProps<PriceVolumeStoryData>) {
  return (
    <TechnicalSectionCard
      action={<Chip variant={data.reading.tone ?? "neutral"}>{data.reading.label}</Chip>}
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <IndicatorToggleGroup items={data.toggles} />
        <div className="grid gap-3 xl:grid-cols-2">
          <SimplePriceVolumeChart points={data.points} title={data.chartTitle} />
          <SimpleVolumeBars points={data.points} title={data.volumeTitle} />
        </div>
        <SimpleMetricGrid
          columns="two"
          items={[
            { label: "Volume trung bình", value: data.averageVolume20, tone: "neutral" },
            data.reading,
          ]}
        />
        <Tabs
          ariaLabel="Cách đọc giá và khối lượng"
          items={data.states.map((state) => ({
            value: state.label,
            label: state.label,
            content: (
              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                <Chip size="sm" variant={state.tone}>{state.label}</Chip>
                <p className="mt-2 text-sm leading-6 text-muted">{state.reading}</p>
              </div>
            ),
          }))}
        />
        {data.tutor ? <TutorNote data={data.tutor} /> : null}
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}

export function RelativeStrengthBlock({
  data,
  detailLabels,
}: SharedBlockProps<RelativeStrengthData>) {
  const columns: Array<DataTableColumn<RelativeStrengthData["rows"][number]>> = [
    { key: "name", header: "Đối tượng", cell: (row) => row.name },
    { key: "change", header: "Biến động", cell: (row) => row.change },
    { key: "note", header: "Ghi chú", cell: (row) => row.note },
  ];

  return (
    <TechnicalSectionCard
      action={<Chip variant={data.output.tone ?? "neutral"}>{data.output.value}</Chip>}
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <DataTable
          caption={data.title}
          columns={columns}
          getRowKey={(row) => row.name}
          rows={data.rows}
        />
        {data.tutor ? <TutorNote data={data.tutor} /> : null}
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}

export function VolatilityBlock({ data, detailLabels }: SharedBlockProps<VolatilityData>) {
  return (
    <TechnicalSectionCard
      action={<Chip variant={data.output.tone ?? "neutral"}>{data.output.value}</Chip>}
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleMetricGrid columns="three" items={data.metrics} />
        {data.tutor ? <TutorNote data={data.tutor} /> : null}
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}

export function PricePositionBlock({
  data,
  detailLabels,
}: SharedBlockProps<PricePositionData>) {
  return (
    <TechnicalSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleMetricGrid columns="three" items={data.metrics} />
        {data.tutor ? <TutorNote data={data.tutor} /> : null}
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}

export function NewsEventBlock({ data, detailLabels }: SharedBlockProps<NewsEventData>) {
  const columns: Array<DataTableColumn<NewsEvent>> = [
    { key: "date", header: "Ngày", cell: (row) => row.date },
    { key: "title", header: "Tiêu đề", cell: (row) => row.title },
    { key: "type", header: "Loại tin", cell: (row) => row.type },
    { key: "relevance", header: "Mức liên quan", cell: (row) => row.relevance },
  ];

  return (
    <TechnicalSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <DataTable
          caption={data.title}
          columns={columns}
          getRowKey={(row) => `${row.date}-${row.title}`}
          rows={data.rows}
        />
        {data.tutor ? <TutorNote data={data.tutor} /> : null}
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}

export function MovementExplanationBlock({
  data,
  detailLabels,
}: SharedBlockProps<MovementExplanationData>) {
  return (
    <TechnicalSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleMetricGrid columns="two" items={data.possibleDrivers} />
        <p className="rounded-[4px] border-[1.5px] border-border bg-warning/25 px-3 py-2 text-sm leading-6 text-muted">
          {data.uncertaintyNote}
        </p>
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}

export function MarketPsychologyBlock({
  data,
  detailLabels,
}: SharedBlockProps<MarketPsychologyData>) {
  return (
    <TechnicalSectionCard
      action={<Chip variant="accent">{data.currentState}</Chip>}
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <PsychologyTemperatureBar
          currentState={data.currentState}
          score={data.score}
          states={data.states}
        />
        {data.tutor ? <TutorNote data={data.tutor} /> : null}
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}

export function FomoBehaviorCheck({
  data,
  detailLabels,
}: SharedBlockProps<FomoBehaviorData>) {
  return (
    <TechnicalSectionCard
      action={<Chip variant={data.output.tone ?? "neutral"}>{data.output.label}</Chip>}
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {data.items.map((item) => (
            <ChecklistItem
              key={item.label}
              checked={item.checked}
              label={item.label}
            />
          ))}
        </div>
        <SimpleMetricGrid columns="one" items={[data.output]} />
        {data.tutor ? <TutorNote data={data.tutor} /> : null}
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}

export function CrossModuleAlignmentBlock({
  data,
  detailLabels,
}: SharedBlockProps<CrossModuleAlignmentData>) {
  return (
    <TechnicalSectionCard
      action={<Chip variant={data.output.tone ?? "neutral"}>{data.output.value}</Chip>}
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {data.chain.map((item, index) => (
            <span key={item} className="flex items-center gap-2">
              <Chip variant={index === data.chain.length - 1 ? "accent" : "neutral"}>
                {item}
              </Chip>
              {index < data.chain.length - 1 ? <span className="text-subtle">→</span> : null}
            </span>
          ))}
        </div>
        <SimpleMetricGrid columns="two" items={data.checks} />
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}

export function PersonalMarketObservation({
  data,
}: {
  data: PersonalMarketObservationData;
}) {
  const template = useMemo(() => data.prompts.join("\n"), [data.prompts]);
  const [value, setValue] = useState(template);

  return (
    <TechnicalSectionCard
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
    </TechnicalSectionCard>
  );
}

export function TechnicalOutputSummary({
  data,
  detailLabels,
}: SharedBlockProps<TechnicalOutputSummaryData>) {
  return (
    <TechnicalSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleMetricGrid columns="two" items={data.items} />
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </TechnicalSectionCard>
  );
}
