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
  TechnicalFieldItem,
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

type SharedBlockProps<T> = {
  data: T;
  detailLabels: DetailLabels;
};

function parseSignedNumber(value: string) {
  const match = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function toneClass(tone?: TechnicalFieldItem["tone"]) {
  if (tone === "success") return "bg-[#00A676]";
  if (tone === "warning") return "bg-warning";
  if (tone === "danger") return "bg-danger";
  if (tone === "accent") return "bg-accent";
  return "bg-neutral";
}

function TrendVisual({ items }: { items: TechnicalFieldItem[] }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="mb-3 text-sm font-bold text-ink">Bản đồ xu hướng theo khung thời gian</p>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item, index) => (
          <div key={item.label} className="relative rounded-[4px] border border-border bg-surface-soft px-3 py-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-ink">{item.label}</p>
              <Chip size="sm" variant={item.tone ?? "neutral"}>{item.value}</Chip>
            </div>
            <div className="flex h-12 items-end gap-1">
              {[0, 1, 2, 3, 4].map((bar) => (
                <span
                  key={bar}
                  className={`flex-1 rounded-t-[3px] ${toneClass(item.tone)}`}
                  style={{ height: `${28 + bar * 12 + (index === 2 ? -bar * 8 : 0)}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelativeStrengthVisual({ rows }: { rows: RelativeStrengthData["rows"] }) {
  const values = rows.map((row) => parseSignedNumber(row.change));
  const min = Math.min(-1, ...values);
  const max = Math.max(1, ...values);

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="mb-3 text-sm font-bold text-ink">So sức tương đối</p>
      <div className="space-y-3">
        {rows.map((row) => {
          const value = parseSignedNumber(row.change);
          const left = ((Math.min(value, 0) - min) / (max - min)) * 100;
          const width = (Math.abs(value) / (max - min)) * 100;

          return (
            <div key={row.name}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-ink">{row.name}</span>
                <span className="font-mono font-bold text-muted">{row.change}</span>
              </div>
              <div className="relative h-5 rounded-[3px] border border-border-soft bg-surface-soft">
                <span className="absolute left-1/2 top-0 h-full w-px bg-border" />
                <span
                  className={`absolute top-1 h-3 rounded-[3px] ${value >= 0 ? "bg-[#00A676]" : "bg-warning"}`}
                  style={{ left: `${left}%`, width: `${Math.max(8, width)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VolatilityRangeVisual({ items }: { items: TechnicalFieldItem[] }) {
  const range = items.find((item) => item.label.includes("Biên độ"))?.value ?? "";
  const numbers = range.match(/\d+([\.,]\d+)?/g)?.map((value) => Number(value.replace(".", "").replace(",", "."))) ?? [];
  const low = numbers[0] ?? 31_000;
  const high = numbers[1] ?? 45_000;
  const current = 42_000;
  const position = ((current - low) / Math.max(1, high - low)) * 100;

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="mb-3 text-sm font-bold text-ink">Dải biến động quan sát</p>
      <div className="relative h-8 rounded-[4px] border border-border bg-surface-soft">
        <div className="absolute left-[18%] top-0 h-full w-px bg-border-soft" />
        <div className="absolute left-[50%] top-0 h-full w-px bg-border-soft" />
        <div className="absolute left-[82%] top-0 h-full w-px bg-border-soft" />
        <span
          className="absolute top-[-6px] h-10 w-1 rounded-full bg-accent"
          style={{ left: `${Math.max(0, Math.min(100, position))}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-semibold text-subtle">
        <span>{low.toLocaleString("vi-VN")}</span>
        <span>Hiện tại 42.000</span>
        <span>{high.toLocaleString("vi-VN")}</span>
      </div>
    </div>
  );
}

function PricePositionVisual({ items }: { items: TechnicalFieldItem[] }) {
  const current = items.find((item) => item.label.includes("hiện tại"))?.value ?? "42.000";
  const support = items.find((item) => item.label.includes("hỗ trợ"))?.value ?? "38.000-40.000";
  const resistance = items.find((item) => item.label.includes("kháng cự"))?.value ?? "44.000-46.000";

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="mb-3 text-sm font-bold text-ink">Vị trí giá trong vùng phản ứng</p>
      <div className="grid gap-2">
        <div className="rounded-[4px] border border-border bg-surface-soft px-3 py-2">
          <p className="text-[11px] font-bold text-subtle">Vùng kháng cự</p>
          <p className="text-sm font-bold text-ink">{resistance}</p>
        </div>
        <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-3 py-2 shadow-hard-sm">
          <p className="text-[11px] font-bold text-subtle">Giá hiện tại</p>
          <p className="text-sm font-bold text-ink">{current}</p>
        </div>
        <div className="rounded-[4px] border border-border bg-surface-soft px-3 py-2">
          <p className="text-[11px] font-bold text-subtle">Vùng hỗ trợ</p>
          <p className="text-sm font-bold text-ink">{support}</p>
        </div>
      </div>
    </div>
  );
}

function EventTimelineVisual({ rows }: { rows: NewsEvent[] }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="mb-3 text-sm font-bold text-ink">Timeline sự kiện</p>
      <div className="relative grid gap-3 before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border-soft">
        {rows.map((row) => (
          <div key={`${row.date}-${row.title}`} className="relative grid gap-1 pl-7">
            <span className="absolute left-0 top-1 h-5 w-5 rounded-[3px] border-[1.5px] border-border bg-accent-soft" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-subtle">{row.date}</span>
              <Chip size="sm" variant={row.relevance === "Cao" ? "warning" : "neutral"}>{row.relevance}</Chip>
            </div>
            <p className="text-xs font-bold text-ink">{row.title}</p>
            <p className="text-[11px] text-muted">{row.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        <TrendVisual items={data.trends} />
        <SimpleMetricGrid columns="three" items={data.trends} />
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
        <RelativeStrengthVisual rows={data.rows} />
        <DataTable
          caption={data.title}
          columns={columns}
          getRowKey={(row) => row.name}
          rows={data.rows}
        />
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
        <VolatilityRangeVisual items={data.metrics} />
        <SimpleMetricGrid columns="three" items={data.metrics} />
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
        <PricePositionVisual items={data.metrics} />
        <SimpleMetricGrid columns="three" items={data.metrics} />
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
        <EventTimelineVisual rows={data.rows} />
        <DataTable
          caption={data.title}
          columns={columns}
          getRowKey={(row) => `${row.date}-${row.title}`}
          rows={data.rows}
        />
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
