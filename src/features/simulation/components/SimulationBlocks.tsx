import { Button, Chip, DataTable, SectionHeader, Tabs } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type {
  AbnormalMoveSectionData,
  CaseStudySectionData,
  ChecklistSectionData,
  DetailLabels,
  FieldItem,
  JournalSectionData,
  MilestoneSectionData,
  ModeSectionData,
  NavigationSectionData,
  OutputSummaryData,
  PerformanceSectionData,
  PortfolioSectionData,
  PositionSectionData,
  ReflectionSectionData,
  ScenarioSectionData,
  Tone,
} from "../types";
import { DetailToggleCard } from "./DetailToggleCard";
import { ReflectionBox } from "./ReflectionBox";
import { SimulationSectionCard } from "./SimulationSectionCard";
import { ToneChip } from "./ToneChip";

type BlockProps<T> = {
  data: T;
  detailLabels: DetailLabels;
};

const toneVariant: Record<Tone, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  accent: "accent",
  danger: "danger",
  neutral: "neutral",
  success: "success",
  warning: "warning",
};

function FieldGrid({ items }: { items: FieldItem[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
        >
          <p className="text-[11px] font-semibold text-subtle">{item.label}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-ink">{item.value}</p>
            {item.tone ? <ToneChip tone={item.tone} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function SectionFooter({ data, labels }: { data: { details?: string[] }; labels: DetailLabels }) {
  return <DetailToggleCard details={data.details} labels={labels} />;
}

export function SimulationPrecheckBlock({
  data,
  detailLabels,
}: BlockProps<ChecklistSectionData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <div className="grid gap-2">
          {data.items.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[3px] border border-border bg-accent-soft text-[10px] font-bold text-ink">
                {item.checked ? "OK" : "--"}
              </span>
              <div>
                <p className="text-xs font-bold text-ink">{item.label}</p>
                <p className="mt-1 text-[11px] font-semibold text-subtle">Nguồn: {item.source}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.actions.map((action) => (
            <Button key={action.label} size="sm" variant={action.variant}>
              {action.label}
            </Button>
          ))}
        </div>
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationModeBlock({ data, detailLabels }: BlockProps<ModeSectionData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {data.modes.map((mode) => (
            <div
              key={mode.title}
              className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-ink">{mode.title}</h4>
                {mode.active ? <Chip variant="accent">Đang dùng</Chip> : null}
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">{mode.description}</p>
              <div className="mt-3 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
                  Phù hợp
                </p>
                <TextList items={mode.suitableFor} />
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
                  Không phù hợp
                </p>
                <TextList items={mode.notSuitableFor} />
              </div>
            </div>
          ))}
        </div>
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationThesisBlock({
  data,
  detailLabels,
}: BlockProps<ReflectionSectionData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <TextList items={data.prompts} />
        {data.guidance ? (
          <p className="rounded-[4px] border border-border-soft bg-accent-soft px-3 py-3 text-xs leading-5 text-muted">
            {data.guidance}
          </p>
        ) : null}
        <ReflectionBox placeholder={data.placeholder} />
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationPositionBlock({
  data,
  detailLabels,
}: BlockProps<PositionSectionData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <FieldGrid items={data.fields} />
        <p className="rounded-[4px] border border-border bg-accent-soft px-3 py-3 text-xs leading-5 text-muted">
          {data.reminder}
        </p>
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationPortfolioBlock({
  data,
  detailLabels,
}: BlockProps<PortfolioSectionData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <FieldGrid items={data.questions} />
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationMilestoneBlock({
  data,
  detailLabels,
}: BlockProps<MilestoneSectionData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <FieldGrid items={data.milestones} />
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationPerformanceBlock({
  data,
  detailLabels,
}: BlockProps<PerformanceSectionData>) {
  const benchmarkColumns: Array<DataTableColumn<FieldItem>> = [
    { key: "label", header: "Mốc so sánh", cell: (row) => row.label },
    {
      key: "value",
      header: "Kết quả giả lập",
      cell: (row) => <span className="font-mono font-bold text-ink">{row.value}</span>,
      align: "right",
    },
  ];

  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <FieldGrid items={data.metrics} />
        <DataTable
          caption="Bảng so sánh kết quả mô phỏng"
          columns={benchmarkColumns}
          getRowKey={(row) => row.label}
          rows={data.benchmarks}
        />
        <FieldGrid items={data.causes} />
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationAbnormalMoveBlock({
  data,
  detailLabels,
}: BlockProps<AbnormalMoveSectionData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <FieldGrid items={data.signal} />
        <SectionHeader
          description="Tách biến động giá khỏi chất lượng thesis để tránh phản ứng cảm tính."
          title="Giả thuyết cần kiểm tra"
        />
        <TextList items={data.hypotheses} />
        <FieldGrid items={data.checks} />
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationScenarioBlock({
  data,
  detailLabels,
}: BlockProps<ScenarioSectionData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {data.scenarios.map((scenario) => (
            <div
              key={scenario.title}
              className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-ink">{scenario.title}</h4>
                <Chip size="sm" variant={toneVariant[scenario.tone]}>
                  {scenario.moduleToReview}
                </Chip>
              </div>
              <div className="mt-3">
                <TextList items={scenario.questions} />
              </div>
            </div>
          ))}
        </div>
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationCaseStudyBlock({
  data,
  detailLabels,
}: BlockProps<CaseStudySectionData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SectionHeader
          description="Dữ liệu được khóa theo mốc thời gian để người học không bị thiên kiến biết trước kết quả."
          title="Luồng case study"
        />
        <TextList items={data.flow} />
        <div className="flex flex-wrap gap-2">
          {data.caseTypes.map((type) => (
            <Chip key={type} variant="neutral">
              {type}
            </Chip>
          ))}
        </div>
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationJournalBlock({
  data,
  detailLabels,
}: BlockProps<JournalSectionData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <Tabs
          ariaLabel="Nhật ký mô phỏng"
          items={[
            {
              value: "fields",
              label: "Mẫu nhật ký",
              content: <TextList items={data.journalFields} />,
            },
            {
              value: "review",
              label: "Câu hỏi hậu kiểm",
              content: <TextList items={data.reviewQuestions} />,
            },
            {
              value: "result",
              label: "Phân loại kết quả",
              content: <FieldGrid items={data.resultTypes} />,
            },
          ]}
        />
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationNavigationBlock({
  data,
  detailLabels,
}: BlockProps<NavigationSectionData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <FieldGrid items={data.directions} />
        <p className="rounded-[4px] border border-border bg-accent-soft px-3 py-3 text-xs leading-5 text-muted">
          {data.reminder}
        </p>
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}

export function SimulationOutputSummaryBlock({
  data,
  detailLabels,
}: BlockProps<OutputSummaryData>) {
  return (
    <SimulationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <TextList items={data.fields} />
        <FieldGrid items={data.readiness} />
        <SectionFooter data={data} labels={detailLabels} />
      </div>
    </SimulationSectionCard>
  );
}
