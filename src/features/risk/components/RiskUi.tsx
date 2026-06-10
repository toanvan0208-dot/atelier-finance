"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button, Card, CardBody, CardHeader, Chip, DataTable, MetricCard, SectionHeader, Tabs } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type {
  DetailLabels,
  RiskDetailGroup,
  RiskDisclaimerData,
  RiskFieldItem,
  RiskFinalNoteData,
  RiskHeaderData,
  RiskJourneyData,
  RiskNextActionsData,
  RiskOverviewData,
  RiskStatus,
  RiskStatusLegendData,
} from "../types";

type RiskSectionCardProps = {
  title: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
};

const statusTone: Record<RiskStatus, "neutral" | "warning" | "danger"> = {
  "Cần theo dõi": "neutral",
  "Cần kiểm tra thêm": "warning",
  "Chưa phù hợp để quyết định vội": "danger",
};

export function RiskSectionCard({
  action,
  children,
  description,
  icon,
  title,
}: RiskSectionCardProps) {
  return (
    <Card>
      <CardHeader
        action={action}
        description={description}
        icon={icon}
        title={title}
      />
      <CardBody>{children}</CardBody>
    </Card>
  );
}

export function DetailToggleCard({
  details = [],
  labels,
}: {
  details?: string[];
  labels: DetailLabels;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (details.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <Button
        size="sm"
        variant={isOpen ? "secondary" : "ghost"}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? labels.collapseButtonLabel : labels.detailButtonLabel}
      </Button>
      {isOpen ? (
        <div className="mt-3 space-y-2">
          {details.map((detail) => (
            <div key={detail} className="flex gap-2 text-xs leading-5 text-muted">
              <Chip size="sm" variant="neutral">{labels.detailChipLabel}</Chip>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SimpleMetricGrid({
  columns = "two",
  items,
}: {
  columns?: "one" | "two" | "three";
  items: RiskFieldItem[];
}) {
  const classes = {
    one: "space-y-3",
    two: "grid gap-3 sm:grid-cols-2",
    three: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
  };

  return (
    <div className={classes[columns]}>
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
        >
          <Chip size="sm" variant={item.tone ?? "neutral"}>{item.label}</Chip>
          <p className="mt-2 text-sm leading-6 text-muted">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function RiskHeader({ data }: { data: RiskHeaderData }) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">{data.moduleName}</Chip>
            <Chip variant="warning">{data.reviewStatus}</Chip>
          </div>
          <h1 className="mt-3 font-brand text-2xl font-bold text-ink">
            {data.ticker} - {data.companyName}
          </h1>
          <p className="mt-2 max-w-[72ch] text-sm leading-6 text-muted">{data.subtitle}</p>
          <p className="mt-2 max-w-[72ch] text-sm leading-6 text-muted">{data.previousContext}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[300px] xl:grid-cols-1">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
            <p className="text-[11px] font-bold uppercase text-subtle">Ngành</p>
            <p className="text-sm font-bold text-ink">{data.industry}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
            <p className="text-[11px] font-bold uppercase text-subtle">Trạng thái rà soát</p>
            <p className="text-sm font-bold text-ink">{data.reviewStatus}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {data.actions.map((action) => (
          <Button key={action.label} size="sm" variant={action.variant}>
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

export function RiskOverview({ data }: { data: RiskOverviewData }) {
  return (
    <section>
      <SectionHeader description={data.description} icon={data.icon} title={data.title} />
      <div className="grid gap-3 xl:grid-cols-3">
        {data.metrics.map((metric) => (
          <MetricCard
            key={metric.title}
            description={metric.description}
            icon={metric.icon}
            status={metric.status}
            title={metric.title}
            value={metric.value}
          />
        ))}
      </div>
      <p className="mt-4 rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-3 text-sm leading-6 text-muted shadow-soft">
        {data.reminder}
      </p>
    </section>
  );
}

export function RiskProgressSidebar({ data }: { data: RiskJourneyData }) {
  const reviewedCount = data.steps.filter((step) => step.status !== "Chưa phù hợp để quyết định vội").length;
  const progressPercent = Math.round((reviewedCount / Math.max(data.steps.length, 1)) * 100);

  return (
    <aside className="xl:sticky xl:top-20 xl:self-start">
      <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
        <h2 className="font-brand text-sm font-bold text-ink">{data.title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted">{data.description}</p>
        <div className="mt-4 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-ink">Đã rà soát</span>
            <span className="font-mono text-muted">{reviewedCount}/{data.steps.length}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 xl:block xl:space-y-2 xl:overflow-visible xl:pb-0">
          {data.steps.map((step) => (
            <div
              key={step.order}
              className="min-w-[230px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 xl:min-w-0"
            >
              <div className="flex items-start gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-border bg-surface font-mono text-[10px] font-bold text-ink">
                  {step.order}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-5 text-ink">{step.title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-muted">{step.question}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Chip size="sm" variant={statusTone[step.status]}>{step.status}</Chip>
                    <Chip size="sm" variant="neutral">{step.source}</Chip>
                  </div>
                  <Button size="sm" variant="ghost">
                    {step.detailButtonLabel}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function RiskStatusLegend({ data }: { data: RiskStatusLegendData }) {
  return (
    <RiskSectionCard description={data.description} icon="S" title={data.title}>
      <div className="grid gap-3 xl:grid-cols-3">
        {data.items.map((item) => (
          <div key={item.status} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <Chip variant={statusTone[item.status]}>{item.status}</Chip>
            <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
            <p className="mt-2 text-xs leading-5 text-subtle">Lý do: {item.reason}</p>
            <p className="mt-1 text-xs leading-5 text-subtle">Dữ liệu: {item.source}</p>
            <p className="mt-1 text-xs leading-5 text-subtle">Tiếp theo: {item.nextCheck}</p>
            <Button size="sm" variant="ghost">
              Quay lại module liên quan
            </Button>
          </div>
        ))}
      </div>
    </RiskSectionCard>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-muted">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export function RiskDetailCard({
  data,
  detailLabels,
}: {
  data: RiskDetailGroup;
  detailLabels: DetailLabels;
}) {
  const [note, setNote] = useState("");
  const tabs = [
    {
      value: "questions",
      label: "Câu hỏi chính",
      content: <BulletList items={data.mainQuestions} />,
    },
    {
      value: "evidence",
      label: "Dữ liệu liên kết",
      content: (
        <div className="space-y-3">
          <SimpleMetricGrid columns="two" items={data.evidence} />
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <Chip size="sm" variant="neutral">Dữ liệu cần xem</Chip>
            <BulletList items={data.dataToReview} />
          </div>
        </div>
      ),
    },
    {
      value: "watch",
      label: "Cần theo dõi",
      content: <SimpleMetricGrid columns="two" items={[
        { label: "Dấu hiệu", value: data.watchSigns.join("; "), tone: "neutral" },
        { label: "Kiểm tra thêm", value: data.checkFurther.join("; "), tone: "warning" },
      ]} />,
    },
  ];

  return (
    <RiskSectionCard
      action={<Chip variant={statusTone[data.status]}>{data.status}</Chip>}
      description={data.centralQuestion}
      icon={`${data.order}`}
      title={data.title}
    >
      <div className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-2">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <Chip size="sm" variant="accent">Nói dễ hiểu</Chip>
            <p className="mt-2 text-sm leading-6 text-muted">{data.plainExplanation}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <Chip size="sm" variant="neutral">Vì sao cần quan tâm?</Chip>
            <p className="mt-2 text-sm leading-6 text-muted">{data.whyCare}</p>
          </div>
        </div>
        <Tabs ariaLabel={data.title} items={tabs} />
        <DetailToggleCard details={data.advancedQuestions} labels={detailLabels} />
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <div className="flex flex-wrap gap-2">
            {data.sourceModules.map((source) => <Chip key={source} size="sm" variant="neutral">{source}</Chip>)}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{data.statusReason}</p>
          <Button size="sm" variant="secondary">{data.sourceActionLabel}</Button>
        </div>
        {data.reflectionPrompt ? (
          <p className="rounded-[4px] border border-border-soft bg-accent-soft/70 px-3 py-2 text-sm leading-6 text-muted">
            {data.reflectionPrompt}
          </p>
        ) : null}
        <textarea
          className="min-h-24 w-full resize-y rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:bg-accent-soft"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ghi chú cá nhân cho nhóm rủi ro này..."
        />
      </div>
    </RiskSectionCard>
  );
}

export function RiskFinalNote({ data }: { data: RiskFinalNoteData }) {
  const template = useMemo(() => data.prompts.join("\n"), [data.prompts]);
  const [value, setValue] = useState(template);
  const columns: Array<DataTableColumn<RiskFieldItem>> = [
    { key: "label", header: "Trường", cell: (row) => <span className="font-medium text-ink">{row.label}</span> },
    { key: "value", header: "Ghi nhận mẫu", cell: (row) => row.value },
  ];

  return (
    <RiskSectionCard
      action={<Chip variant={statusTone[data.readiness]}>{data.readiness}</Chip>}
      description={data.description}
      icon="N"
      title={data.title}
    >
      <div className="space-y-4">
        <DataTable
          caption={data.title}
          columns={columns}
          getRowKey={(row) => row.label}
          rows={data.fields}
        />
        <p className="rounded-[4px] border-[1.5px] border-border bg-warning/25 px-3 py-2 text-sm leading-6 text-muted">
          {data.readinessReminder}
        </p>
        <textarea
          className="min-h-72 w-full resize-y rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:bg-accent-soft"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={data.placeholder}
        />
      </div>
    </RiskSectionCard>
  );
}

export function RiskDisclaimer({ data }: { data: RiskDisclaimerData }) {
  return (
    <Card>
      <CardHeader icon="!" title={data.title} />
      <CardBody>
        <p className="text-sm leading-7 text-muted">{data.content}</p>
      </CardBody>
    </Card>
  );
}

export function RiskNextActions({ data }: { data: RiskNextActionsData }) {
  return (
    <Card>
      <CardHeader description={data.description} icon="→" title={data.title} />
      <CardBody>
        <div className="flex flex-wrap gap-2">
          {data.actions.map((action) => (
            <Button
              key={action.label}
              disabled={action.disabled}
              variant={action.variant}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
