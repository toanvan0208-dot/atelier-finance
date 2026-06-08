import type { ReactNode } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  DataTable,
  SectionHeader,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type {
  FieldItem,
  IndustryAction,
  IndustryBlockData,
  IndustryHeaderData,
  IndustryInsightPanelData,
  IndustryJourneyData,
  IndustryQuickOverviewData,
  IndustryTableRow,
  IndustryTutorData,
  Tone,
} from "../types";

const toneVariant: Record<Tone, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  accent: "accent",
  danger: "danger",
  neutral: "neutral",
  success: "success",
  warning: "warning",
};

function ActionButtons({ actions }: { actions: IndustryAction[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          disabled={action.disabled}
          size="sm"
          variant={action.variant}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

function StatusChip({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <Chip size="sm" variant={toneVariant[tone]}>
      {label}
    </Chip>
  );
}

function FieldGrid({ items = [] }: { items?: FieldItem[] }) {
  if (items.length === 0) {
    return null;
  }

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
            {item.tone ? <StatusChip label={item.tone} tone={item.tone} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function TextList({ items = [] }: { items?: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <p
          key={item}
          className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted"
        >
          {item}
        </p>
      ))}
    </div>
  );
}

function IndustrySectionCard({
  action,
  children,
  description,
  icon,
  title,
}: {
  title: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
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

export function IndustryHeader({ data }: { data: IndustryHeaderData }) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <Chip variant="accent">{data.moduleName}</Chip>
            <Chip variant="neutral">{data.status}</Chip>
          </div>
          <h2 className="text-2xl font-bold leading-tight text-ink">{data.subtitle}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
              <p className="text-[11px] font-semibold text-subtle">Ngành đang phân tích</p>
              <p className="text-sm font-bold text-ink">{data.industryName}</p>
            </div>
            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
              <p className="text-[11px] font-semibold text-subtle">Loại hình ngành</p>
              <p className="text-sm font-bold text-ink">{data.industryType}</p>
            </div>
          </div>
        </div>
        <ActionButtons actions={data.actions} />
      </div>
    </section>
  );
}

export function IndustryQuickOverview({ data }: { data: IndustryQuickOverviewData }) {
  return (
    <div className="space-y-4">
      <SectionHeader description={data.description} icon={data.icon} title={data.title} />
      <Card>
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2">
            {data.answers.map((answer) => (
              <div
                key={answer.question}
                className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-ink">{answer.question}</p>
                  <StatusChip label={answer.status} tone={answer.tone} />
                </div>
                <p className="text-sm leading-6 text-muted">{answer.answer}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function IndustryJourney({ data }: { data: IndustryJourneyData }) {
  return (
    <aside className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft xl:sticky xl:top-5 xl:self-start">
      <h3 className="text-sm font-bold text-ink">{data.title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted">{data.description}</p>
      <div className="mt-4 max-h-none space-y-2 xl:max-h-[calc(100dvh-180px)] xl:overflow-y-auto xl:pr-1">
        {data.steps.map((step, index) => (
          <details
            key={`${step.group}-${step.title}`}
            className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
            open={index < 2}
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[11px] font-bold text-subtle">
                    {String(index + 1).padStart(2, "0")} · {step.group}
                  </p>
                  <p className="mt-1 text-xs font-bold text-ink">{step.title}</p>
                </div>
                <Chip size="sm" variant="neutral">{step.status}</Chip>
              </div>
            </summary>
            <div className="mt-3 space-y-2">
              <p className="text-[11px] leading-4 text-muted">{step.question}</p>
              <p className="text-[11px] font-semibold text-subtle">
                Module: {step.linkedModule}
              </p>
              <TextList items={step.details.slice(0, 3)} />
              <Button size="sm" variant="ghost">Xem chi tiết</Button>
            </div>
          </details>
        ))}
      </div>
    </aside>
  );
}

function IndustryDataTable({ data }: { data: NonNullable<IndustryBlockData["table"]> }) {
  const columns: Array<DataTableColumn<IndustryTableRow>> = data.columns.map((column) => ({
    key: column.key,
    header: column.header,
    align: column.align,
    cell: (row) => row[column.key] ?? "",
  }));

  return (
    <DataTable
      caption={data.caption}
      columns={columns}
      getRowKey={(row, index) => `${row.indicator ?? row.macroVariable ?? row.template ?? index}-${index}`}
      rows={data.rows}
    />
  );
}

export function IndustryBlock({ data }: { data: IndustryBlockData }) {
  return (
    <IndustrySectionCard
      description={data.centralQuestion}
      icon={data.icon}
      title={data.title}
      action={<Chip variant="accent">Bước {data.stepNumber}</Chip>}
    >
      <div className="space-y-4">
        <div className="rounded-[4px] border border-border bg-accent-soft px-3 py-3 shadow-hard-sm">
          <p className="text-xs font-bold text-ink">Nói dễ hiểu</p>
          <p className="mt-1 text-xs leading-5 text-muted">{data.easyExplanation}</p>
        </div>

        <FieldGrid items={data.fields} />

        {data.valueChain ? (
          <div className="grid gap-2 sm:grid-cols-4">
            {data.valueChain.map((node, index) => (
              <div
                key={node}
                className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3 text-center shadow-hard-sm"
              >
                <p className="font-mono text-[11px] font-bold text-subtle">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 text-xs font-bold text-ink">{node}</p>
              </div>
            ))}
          </div>
        ) : null}

        {data.states ? (
          <div className="grid gap-3 md:grid-cols-3">
            {data.states.map((state) => (
              <div
                key={state.label}
                className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-ink">{state.label}</p>
                  <StatusChip label="Theo dõi" tone={state.tone} />
                </div>
                <p className="text-xs leading-5 text-muted">{state.description}</p>
                <p className="mt-2 text-[11px] font-semibold text-subtle">
                  Xác nhận: {state.evidence}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-muted">
                  Dễ hiểu sai: {state.pitfall}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {data.examples ? (
          <div className="grid gap-3 md:grid-cols-3">
            {data.examples.map((example) => (
              <div
                key={example.title}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
              >
                <p className="text-xs font-bold text-ink">{example.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{example.content}</p>
              </div>
            ))}
          </div>
        ) : null}

        {data.table ? <IndustryDataTable data={data.table} /> : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-bold text-ink">Dữ liệu cần xem</p>
            <TextList items={data.dataToWatch} />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-ink">Liên kết module</p>
            <TextList items={data.moduleLinks} />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-ink">Dễ hiểu sai ở đâu</p>
            <TextList items={data.pitfalls} />
          </div>
        </div>

        {data.outputPrompts ? (
          <details className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <summary className="cursor-pointer text-xs font-bold text-ink">
              Xem chi tiết
            </summary>
            <div className="mt-3 grid gap-2">
              {data.outputPrompts.map((prompt) => (
                <label key={prompt} className="grid gap-1">
                  <span className="text-[11px] font-semibold text-subtle">{prompt}</span>
                  <input
                    className="h-9 rounded-[4px] border border-border bg-surface px-3 text-xs text-ink outline-none focus:bg-accent-soft/35"
                    placeholder="Ghi nhận ngắn..."
                  />
                </label>
              ))}
            </div>
          </details>
        ) : (
          <details className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <summary className="cursor-pointer text-xs font-bold text-ink">
              Xem chi tiết
            </summary>
            <p className="mt-2 text-xs leading-5 text-muted">
              Nếu phần này chưa rõ, hãy quay lại module liên quan trước khi chuyển sang bước sau.
            </p>
          </details>
        )}
      </div>
    </IndustrySectionCard>
  );
}

export function IndustryInsightPanel({ data }: { data: IndustryInsightPanelData }) {
  return (
    <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
      <IndustrySectionCard description={data.description} icon="LK" title={data.title}>
        <div className="space-y-3">
          {data.links.map((link) => (
            <div
              key={link.moduleName}
              className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
            >
              <p className="text-xs font-bold text-ink">{link.moduleName}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{link.howItConnects}</p>
              <p className="mt-2 text-[11px] font-semibold text-subtle">
                Cần kiểm tra: {link.nextCheck}
              </p>
            </div>
          ))}
        </div>
      </IndustrySectionCard>
    </aside>
  );
}

export function IndustryTutorNote({ data }: { data: IndustryTutorData }) {
  return (
    <IndustrySectionCard icon="AI" title={data.title}>
      <TextList items={data.notes} />
    </IndustrySectionCard>
  );
}

export function IndustryDisclaimer({
  content,
  title,
}: {
  title: string;
  content: string;
}) {
  return (
    <Card className="bg-surface-soft">
      <CardHeader icon="!" title={title} />
      <CardBody>
        <p className="text-xs leading-5 text-muted">{content}</p>
      </CardBody>
    </Card>
  );
}

export function IndustryNextActions({
  actions,
  description,
  title,
}: {
  title: string;
  description: string;
  actions: IndustryAction[];
}) {
  return (
    <Card>
      <CardHeader description={description} icon=">" title={title} />
      <CardBody>
        <ActionButtons actions={actions} />
      </CardBody>
    </Card>
  );
}
