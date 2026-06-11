"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Button, Card, CardBody, CardHeader, Chip, DataTable, MetricCard, SectionHeader, Tabs } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type {
  DetailLabels,
  RiskDetailGroup,
  ChecklistReadinessData,
  ChecklistReadinessItem,
  RiskDisclaimerData,
  RiskControlItem,
  RiskControlRoomData,
  RiskControlStatus,
  RiskEvidenceMapData,
  RiskEvidenceSource,
  RiskFieldItem,
  RiskFinalNoteData,
  RiskHeaderData,
  RiskJourneyCluster,
  RiskJourneyData,
  RiskNextActionsData,
  RiskOverviewData,
  RiskCaseFileData,
  RiskEvidenceStrength,
  RiskSeverity,
  RiskStatus,
  RiskStatusLegendData,
  RiskTimeHorizon,
  TransparencyGovernanceData,
  TransparencyCheckItem,
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

const severityLabel: Record<RiskSeverity, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  unknown: "Chưa rõ",
};

const severityTone: Record<RiskSeverity, "success" | "warning" | "danger" | "neutral"> = {
  low: "success",
  medium: "warning",
  high: "danger",
  unknown: "neutral",
};

const evidenceLabel: Record<RiskEvidenceStrength, string> = {
  weak: "Yếu",
  medium: "Vừa đủ",
  strong: "Mạnh",
  missing: "Thiếu",
};

const evidenceTone: Record<RiskEvidenceStrength, "success" | "warning" | "danger" | "neutral"> = {
  weak: "warning",
  medium: "neutral",
  strong: "success",
  missing: "danger",
};

const horizonLabel: Record<RiskTimeHorizon, string> = {
  short: "Ngắn hạn",
  medium: "Trung hạn",
  long: "Dài hạn",
  mixed: "Nhiều khung",
};

const controlStatusLabel: Record<RiskControlStatus, string> = {
  ok: "Ổn",
  watch: "Theo dõi",
  risk: "Có rủi ro",
  missing_data: "Thiếu dữ liệu",
  conflict: "Trái chiều",
};

const controlStatusTone: Record<RiskControlStatus, "success" | "warning" | "danger" | "neutral"> = {
  ok: "success",
  watch: "warning",
  risk: "danger",
  missing_data: "neutral",
  conflict: "warning",
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

export function RiskHeader({
  canContinueToChecklist = true,
  checklistDisabledReason,
  data,
}: {
  canContinueToChecklist?: boolean;
  checklistDisabledReason?: string;
  data: RiskHeaderData;
}) {
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
        <AnalysisNotePopover
          contextTitle={`${data.ticker} - ${data.moduleName}`}
          moduleId="risk"
          moduleName="Rủi ro"
          noteType="counter_thesis"
          stockSymbol={data.ticker}
        />
        {data.actions.map((action) => {
          const isChecklistAction = action.label.toLowerCase().includes("checklist");
          return (
            <Button
              key={action.label}
              disabled={action.disabled || (isChecklistAction && !canContinueToChecklist)}
              size="sm"
              variant={isChecklistAction && !canContinueToChecklist ? "ghost" : action.variant}
            >
              {isChecklistAction && !canContinueToChecklist
                ? checklistDisabledReason ?? "Hoàn thành kiểm tra rủi ro"
                : action.label}
            </Button>
          );
        })}
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
        <div className="flex flex-col gap-3 rounded-[4px] border border-border-soft bg-accent-soft/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted">
            {data.reflectionPrompt ?? "Ghi lại điều bạn còn lo ngại hoặc giả định rủi ro trong panel riêng."}
          </p>
          <AnalysisNotePopover
            contextTitle={data.title}
            moduleId={`risk-detail-${data.id}`}
            moduleName="Rủi ro"
            noteType="counter_thesis"
            stockSymbol="MWG"
            triggerLabel="Ghi chú rủi ro"
          />
        </div>
      </div>
    </RiskSectionCard>
  );
}

export function RiskFinalNote({ data }: { data: RiskFinalNoteData }) {
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
        <div className="flex flex-col gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted">
            Các ghi chú cá nhân trước khi sang Checklist được lưu trong panel riêng; trạng thái readiness và dữ liệu rủi ro vẫn hiển thị trực tiếp.
          </p>
          <AnalysisNotePopover
            contextTitle={data.title}
            moduleId="risk-final-note"
            moduleName="Rủi ro"
            noteType="follow_up"
            stockSymbol="MWG"
          />
        </div>
      </div>
    </RiskSectionCard>
  );
}

function RiskModal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4 py-6">
      <div className="max-h-[88vh] w-full max-w-[720px] overflow-y-auto rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-border-soft bg-surface px-4 py-3">
          <h3 className="font-brand text-lg font-bold text-ink">{title}</h3>
          <Button size="sm" variant="ghost" onClick={onClose}>Đóng</Button>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <Chip size="sm" variant="neutral">{label}</Chip>
      <div className="mt-2 text-sm leading-6 text-muted">{children}</div>
    </div>
  );
}

function RiskControlDetail({ item }: { item: RiskControlItem }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">{item.summary}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldBlock label="Mức độ">
          <Chip variant={severityTone[item.severity]}>{severityLabel[item.severity]}</Chip>
        </FieldBlock>
        <FieldBlock label="Bằng chứng">
          <Chip variant={evidenceTone[item.evidenceStrength]}>{evidenceLabel[item.evidenceStrength]}</Chip>
        </FieldBlock>
        <FieldBlock label="Khung thời gian">
          {horizonLabel[item.horizon]}
        </FieldBlock>
      </div>
      <FieldBlock label="Module liên quan">
        <div className="flex flex-wrap gap-2">
          {item.sourceModules.map((source) => <Chip key={source} size="sm" variant="neutral">{source}</Chip>)}
        </div>
      </FieldBlock>
      {item.missingEvidence?.length ? (
        <FieldBlock label="Thiếu bằng chứng">
          <BulletList items={item.missingEvidence} />
        </FieldBlock>
      ) : null}
      {item.ctaLabel ? <Button size="sm" variant="secondary">{item.ctaLabel}</Button> : null}
    </div>
  );
}

export function RiskControlRoom({ data }: { data: RiskControlRoomData }) {
  const [selectedRisk, setSelectedRisk] = useState<RiskControlItem | null>(null);

  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft">
      <div className="flex flex-col gap-4 border-b border-border-soft px-4 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">{data.title}</Chip>
            {data.isMock ? <Chip variant="neutral">Mock data</Chip> : null}
          </div>
          <h2 className="mt-3 font-brand text-xl font-bold text-ink">{data.ticker} - bản đồ rủi ro sơ bộ</h2>
          <p className="mt-2 max-w-[72ch] text-sm leading-6 text-muted">{data.conclusion}</p>
        </div>
        <div className="min-w-[220px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-[11px] font-bold uppercase text-subtle">Checklist readiness</p>
          <p className="mt-1 font-brand text-xl font-bold text-ink">
            {data.checklistReadinessSummary.completed}/{data.checklistReadinessSummary.total}
          </p>
          <Chip size="sm" variant="warning">{data.checklistReadinessSummary.status}</Chip>
          <p className="mt-2 text-xs leading-5 text-muted">{data.checklistReadinessSummary.helperText}</p>
        </div>
      </div>
      <div className="grid gap-4 px-4 py-4 xl:grid-cols-2">
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="font-brand text-sm font-bold text-ink">Risk matrix</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {data.topRisks.map((item) => (
                <button
                  key={`matrix-${item.id}`}
                  className="min-h-20 rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-left"
                  type="button"
                  onClick={() => setSelectedRisk(item)}
                >
                  <Chip size="sm" variant={severityTone[item.severity]}>{severityLabel[item.severity]}</Chip>
                  <p className="mt-2 text-xs font-bold leading-5 text-ink">{item.title}</p>
                  <p className="text-[11px] leading-4 text-subtle">Bằng chứng: {evidenceLabel[item.evidenceStrength]}</p>
                </button>
              ))}
            </div>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="font-brand text-sm font-bold text-ink">Bằng chứng còn thiếu</p>
            <div className="mt-3 space-y-2">
              {data.missingEvidence.map((item) => (
                <div key={item.id} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink">{item.label}</p>
                    <Chip size="sm" variant="neutral">{item.module}</Chip>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">{item.reason}</p>
                </div>
              ))}
            </div>
        </div>
      </div>
      {selectedRisk ? (
        <RiskModal title={selectedRisk.title} onClose={() => setSelectedRisk(null)}>
          <RiskControlDetail item={selectedRisk} />
        </RiskModal>
      ) : null}
    </section>
  );
}

export function RiskEvidenceMap({ data }: { data: RiskEvidenceMapData }) {
  const [selectedSource, setSelectedSource] = useState<RiskEvidenceSource | null>(null);

  return (
    <RiskSectionCard description={data.description} icon="E" title={data.title}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.sources.map((source) => (
          <button
            key={source.id}
            className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-accent-soft"
            type="button"
            onClick={() => setSelectedSource(source)}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">{source.label}</p>
              <Chip size="sm" variant={controlStatusTone[source.status]}>{controlStatusLabel[source.status]}</Chip>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              {source.relatedRisks.length} nhóm rủi ro liên quan, {source.missingEvidence.length} mục còn thiếu.
            </p>
          </button>
        ))}
      </div>
      {selectedSource ? (
        <RiskModal title={selectedSource.label} onClose={() => setSelectedSource(null)}>
          <div className="space-y-4">
            <FieldBlock label="Rủi ro liên quan">
              <div className="flex flex-wrap gap-2">
                {selectedSource.relatedRisks.map((risk) => <Chip key={risk} size="sm" variant="neutral">{risk}</Chip>)}
              </div>
            </FieldBlock>
            <FieldBlock label="Bằng chứng đã có">
              <BulletList items={selectedSource.availableEvidence} />
            </FieldBlock>
            <FieldBlock label="Bằng chứng còn thiếu">
              <BulletList items={selectedSource.missingEvidence} />
            </FieldBlock>
          </div>
        </RiskModal>
      ) : null}
    </RiskSectionCard>
  );
}

function RiskGroupDetail({ data, detailLabels }: { data: RiskDetailGroup; detailLabels: DetailLabels }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">{data.plainExplanation}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldBlock label="Vì sao cần quan tâm?">{data.whyCare}</FieldBlock>
        <FieldBlock label="Trạng thái">
          <Chip variant={statusTone[data.status]}>{data.status}</Chip>
          <p className="mt-2">{data.statusReason}</p>
        </FieldBlock>
      </div>
      <FieldBlock label="Câu hỏi chính">
        <BulletList items={data.mainQuestions} />
      </FieldBlock>
      <FieldBlock label="Dữ liệu cần xem">
        <BulletList items={data.dataToReview} />
      </FieldBlock>
      <FieldBlock label="Dấu hiệu cần theo dõi">
        <BulletList items={data.watchSigns} />
      </FieldBlock>
      <DetailToggleCard details={data.advancedQuestions} labels={detailLabels} />
      <div className="flex flex-col gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted">
          Ghi chú cá nhân, giả định rủi ro hoặc điều muốn kiểm tra thêm được đặt trong panel riêng.
        </p>
        <AnalysisNotePopover
          contextTitle={data.title}
          moduleId={`risk-group-${data.id}`}
          moduleName="Rủi ro"
          noteType="counter_thesis"
          stockSymbol="MWG"
          triggerLabel="Ghi chú rủi ro"
        />
      </div>
    </div>
  );
}

export function RiskAnalysisJourney({
  clusters,
  detailLabels,
  riskGroups,
}: {
  clusters: RiskJourneyCluster[];
  detailLabels: DetailLabels;
  riskGroups: RiskDetailGroup[];
}) {
  const [selectedGroup, setSelectedGroup] = useState<RiskDetailGroup | null>(null);
  const groupsById = useMemo(() => new Map(riskGroups.map((group) => [group.id, group])), [riskGroups]);
  const tabs = clusters.map((cluster) => {
    const clusterGroups = cluster.groupIds
      .map((groupId) => groupsById.get(groupId))
      .filter((group): group is RiskDetailGroup => Boolean(group));

    return {
      value: cluster.id,
      label: cluster.title,
      content: (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-brand text-lg font-bold text-ink">{cluster.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{cluster.description}</p>
            </div>
            <Chip variant="warning">{cluster.status}</Chip>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {clusterGroups.map((group) => (
              <button
                key={group.id}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-accent-soft"
                type="button"
                onClick={() => setSelectedGroup(group)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-[3px] border-[1.5px] border-border bg-surface font-mono text-[11px] font-bold text-ink">
                    {group.order}
                  </span>
                  <Chip size="sm" variant={statusTone[group.status]}>{group.status}</Chip>
                </div>
                <p className="mt-3 text-sm font-bold leading-5 text-ink">{group.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{group.centralQuestion}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {group.sourceModules.map((source) => <Chip key={source} size="sm" variant="neutral">{source}</Chip>)}
                </div>
              </button>
            ))}
          </div>
        </div>
      ),
    };
  });

  return (
    <RiskSectionCard
      description="9 nhóm rủi ro được gom thành 4 cụm để đọc theo tab, mỗi nhóm mở chi tiết bằng popup."
      icon="R"
      title="Lộ trình phân tích rủi ro"
    >
      <Tabs ariaLabel="Lộ trình phân tích rủi ro" items={tabs} />
      {selectedGroup ? (
        <RiskModal title={selectedGroup.title} onClose={() => setSelectedGroup(null)}>
          <RiskGroupDetail data={selectedGroup} detailLabels={detailLabels} />
        </RiskModal>
      ) : null}
    </RiskSectionCard>
  );
}

export function TransparencyGovernancePanel({ data }: { data: TransparencyGovernanceData }) {
  const [selectedItem, setSelectedItem] = useState<TransparencyCheckItem | null>(null);

  return (
    <RiskSectionCard description={data.description} icon="T" title={data.title}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.items.map((item) => (
          <button
            key={item.id}
            className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-accent-soft"
            type="button"
            onClick={() => setSelectedItem(item)}
          >
            <div className="flex flex-wrap gap-1">
              <Chip size="sm" variant={controlStatusTone[item.status]}>{controlStatusLabel[item.status]}</Chip>
              <Chip size="sm" variant={severityTone[item.severity]}>{severityLabel[item.severity]}</Chip>
            </div>
            <p className="mt-3 text-sm font-bold leading-5 text-ink">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{item.explanation}</p>
          </button>
        ))}
      </div>
      {selectedItem ? (
        <RiskModal title={selectedItem.label} onClose={() => setSelectedItem(null)}>
          <div className="space-y-4">
            <p className="text-sm leading-6 text-muted">{selectedItem.explanation}</p>
            <FieldBlock label="Dữ liệu cần kiểm tra">
              <BulletList items={selectedItem.dataToCheck} />
            </FieldBlock>
          </div>
        </RiskModal>
      ) : null}
    </RiskSectionCard>
  );
}

export function RiskCaseFile({ data }: { data: RiskCaseFileData }) {
  return (
    <RiskSectionCard description={data.description} icon="C" title={data.title}>
      <div className="grid gap-3 xl:grid-cols-2">
        <FieldBlock label="Rủi ro ưu tiên"><BulletList items={data.topRisks} /></FieldBlock>
        <FieldBlock label="Bằng chứng còn thiếu"><BulletList items={data.missingEvidence} /></FieldBlock>
        <FieldBlock label="Điều kiện phá thesis"><BulletList items={data.thesisBreakers} /></FieldBlock>
        <FieldBlock label="Rủi ro cần theo dõi"><BulletList items={data.monitorRisks} /></FieldBlock>
      </div>
      <div className="mt-4 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
        <Chip size="sm" variant="warning">Điều kiện trước Checklist</Chip>
        <BulletList items={data.checklistConditions} />
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-ink">Ghi chú case rủi ro</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Lưu điều bạn lo ngại, giả định rủi ro hoặc việc cần kiểm tra thêm trước khi sang Checklist.
          </p>
        </div>
        <AnalysisNotePopover
          contextTitle={data.title}
          moduleId="risk-case-file"
          moduleName="Rủi ro"
          noteType="counter_thesis"
          stockSymbol="MWG"
        />
      </div>
    </RiskSectionCard>
  );
}

function readinessTone(status: ChecklistReadinessItem["status"]) {
  if (status === "done") return "success";
  if (status === "needs_review") return "warning";
  return "neutral";
}

function readinessLabel(status: ChecklistReadinessItem["status"]) {
  if (status === "done") return "Đã có";
  if (status === "needs_review") return "Cần xem lại";
  return "Còn thiếu";
}

export function ChecklistReadinessPanel({ data }: { data: ChecklistReadinessData }) {
  const isReady = data.completed >= data.total;
  const progress = Math.round((data.completed / Math.max(data.total, 1)) * 100);

  return (
    <RiskSectionCard
      action={<Chip variant={isReady ? "success" : "warning"}>{data.status}</Chip>}
      description={data.description}
      icon="5"
      title={data.title}
    >
      <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-bold text-ink">Tiến độ sẵn sàng</span>
          <span className="font-mono text-muted">{data.completed}/{data.total}</span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-surface">
          <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">{data.helperText}</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {data.items.map((item) => (
          <div key={item.id} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <Chip size="sm" variant={readinessTone(item.status)}>{readinessLabel(item.status)}</Chip>
            <p className="mt-2 text-sm font-bold text-ink">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{item.helperText}</p>
          </div>
        ))}
      </div>
      <Button disabled={!isReady} variant={isReady ? "primary" : "ghost"}>
        {isReady ? data.ctaLabel : data.disabledCtaLabel}
      </Button>
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

export function RiskNextActions({
  canContinueToChecklist = true,
  data,
}: {
  canContinueToChecklist?: boolean;
  data: RiskNextActionsData;
}) {
  return (
    <Card>
      <CardHeader description={data.description} icon="→" title={data.title} />
      <CardBody>
        <div className="flex flex-wrap gap-2">
          {data.actions.map((action) => {
            const isChecklistAction = action.label.toLowerCase().includes("checklist");
            return (
              <Button
                key={action.label}
                disabled={action.disabled || (isChecklistAction && !canContinueToChecklist)}
                variant={isChecklistAction && !canContinueToChecklist ? "ghost" : action.variant}
              >
                {isChecklistAction && !canContinueToChecklist ? "Hoàn thành case rủi ro trước" : action.label}
              </Button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
