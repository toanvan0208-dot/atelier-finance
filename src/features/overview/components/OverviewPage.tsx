"use client";

import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import { overviewState } from "../data/overview.data";
import type {
  OverviewAlertSeverity,
  OverviewPriority,
  OverviewProfileStatus,
  OverviewStepStatus,
} from "../types";

type OverviewPageProps = {
  onNavigate: (key: string) => void;
};

const stepStatusLabel: Record<OverviewStepStatus, string> = {
  not_started: "Chưa bắt đầu",
  in_progress: "Đang làm",
  needs_check: "Cần kiểm chứng",
  draft_done: "Đã có dữ liệu sơ bộ",
  warning: "Có cảnh báo",
};

const stepStatusTone: Record<OverviewStepStatus, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  not_started: "neutral",
  in_progress: "accent",
  needs_check: "warning",
  draft_done: "success",
  warning: "danger",
};

const priorityLabel: Record<OverviewPriority, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

const alertLabel: Record<OverviewAlertSeverity, string> = {
  soft: "Nhẹ",
  watch: "Cần theo dõi",
  important: "Quan trọng",
};

const alertTone: Record<OverviewAlertSeverity, "neutral" | "warning" | "danger"> = {
  soft: "neutral",
  watch: "warning",
  important: "danger",
};

const profileStatusLabel: Record<OverviewProfileStatus["status"], string> = {
  complete: "Đã thiết lập",
  incomplete: "Chưa hoàn tất",
  needs_update: "Cần cập nhật",
};

function OverviewHeader() {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">Tổng quan</Chip>
            {overviewState.isMock ? <Chip variant="neutral">Mock data</Chip> : null}
          </div>
          <h1 className="mt-3 font-brand text-2xl font-bold text-ink md:text-3xl">
            Dashboard điều phối phân tích
          </h1>
          <p className="mt-2 max-w-[78ch] text-sm leading-6 text-muted">
            Màn này giúp bạn biết case đang ở đâu, việc cần làm tiếp theo và dữ liệu nào cần kiểm chứng trước.
          </p>
        </div>
        <p className="max-w-[360px] rounded-[4px] border border-border-soft bg-accent-soft px-3 py-2 text-xs leading-5 text-muted">
          Không có tín hiệu giao dịch. Các trạng thái chỉ giúp điều phối học, kiểm tra dữ liệu và cảnh báo.
        </p>
      </div>
    </section>
  );
}

function CurrentCasePanel({ onNavigate }: OverviewPageProps) {
  const currentCase = overviewState.currentCase;

  if (!currentCase.hasCase) {
    return (
      <Card>
        <CardHeader title="Case đang phân tích" description="Bạn chưa chọn case phân tích." />
        <CardBody>
          <p className="text-sm leading-6 text-muted">
            Bắt đầu bằng Lọc cổ phiếu hoặc chọn một mã trong Watchlist.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => onNavigate("screening")}>Bắt đầu lọc cổ phiếu</Button>
            <Button variant="secondary" onClick={() => onNavigate("watchlist")}>Mở Watchlist</Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={`Case đang phân tích: ${currentCase.ticker}`}
        description={currentCase.companyName}
        chip={<Chip variant="neutral">{currentCase.industry}</Chip>}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Metric label="Giai đoạn hiện tại" value={currentCase.currentStage} />
          <Metric label="Tiến độ" value={currentCase.progressLabel} />
          <Metric label="Cảnh báo nổi bật" value={currentCase.mainWarning ?? "Chưa có"} tone="warning" />
        </div>
        {currentCase.temporaryThesis ? (
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <Chip size="sm" variant="accent">Thesis tạm thời</Chip>
            <p className="mt-2 text-sm leading-6 text-muted">{currentCase.temporaryThesis}</p>
          </div>
        ) : null}
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-xs font-bold text-ink">Dữ liệu thiếu quan trọng</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {currentCase.missingData.map((item) => (
              <Chip key={item} size="sm" variant="warning">{item}</Chip>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Metric({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "neutral" | "warning";
  value: string;
}) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <p className="text-[11px] font-bold uppercase text-subtle">{label}</p>
      <p className={cn("mt-1 text-sm font-bold leading-5 text-ink", tone === "warning" && "text-[#765416]")}>{value}</p>
    </div>
  );
}

function NextBestActionPanel({ onNavigate }: OverviewPageProps) {
  const action = overviewState.nextAction;

  return (
    <Card className="border-[2px] border-border">
      <CardHeader
        title="Việc nên làm tiếp theo"
        description={action.relatedModule}
        chip={<Chip variant="warning">Ưu tiên {priorityLabel[action.priority]}</Chip>}
      />
      <CardBody className="space-y-4">
        <div>
          <h2 className="font-brand text-xl font-bold leading-6 text-ink">{action.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{action.reason}</p>
        </div>
        <Button
          className="w-full"
          onClick={() => onNavigate(action.targetModuleKey ?? "overview")}
        >
          {action.primaryAction}
        </Button>
        {action.secondaryAction ? (
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => onNavigate(action.secondaryTargetModuleKey ?? action.targetModuleKey ?? "overview")}
          >
            {action.secondaryAction}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}

function MissingDataSummary({ onNavigate }: OverviewPageProps) {
  return (
    <Card>
      <CardHeader title="Dữ liệu còn thiếu" description="Chỉ hiển thị các điểm cần kiểm chứng trước." />
      <CardBody className="space-y-2">
        {overviewState.missingData.slice(0, 4).map((item) => (
          <button
            key={item.id}
            className="w-full rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-left transition hover:border-border hover:bg-accent-soft"
            type="button"
            onClick={() => onNavigate(item.moduleKey)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">{item.label}</p>
              <Chip size="sm" variant="neutral">{item.relatedModule}</Chip>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">{item.reason}</p>
          </button>
        ))}
      </CardBody>
    </Card>
  );
}

function ProgressSummary() {
  const draftDoneCount = overviewState.pipeline.filter((step) => step.status !== "not_started").length;

  return (
    <Card>
      <CardHeader title="Tiến độ phân tích" description={`${draftDoneCount}/8 bước có dữ liệu sơ bộ hoặc đang kiểm tra.`} />
      <CardBody>
        <div className="h-3 rounded-full bg-surface-soft">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.round((draftDoneCount / overviewState.pipeline.length) * 100)}%` }}
          />
        </div>
        <div className="mt-3 grid gap-2">
          {overviewState.pipeline.slice(0, 4).map((step) => (
            <div key={step.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-ink">{step.label}</span>
              <Chip size="sm" variant={stepStatusTone[step.status]}>{stepStatusLabel[step.status]}</Chip>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function ProfileStatusMiniCard({ onNavigate }: OverviewPageProps) {
  const profile = overviewState.profileStatus;

  return (
    <Card>
      <CardHeader
        title="Hồ sơ phân tích"
        description={profileStatusLabel[profile.status]}
        chip={<Chip variant={profile.status === "complete" ? "success" : "warning"}>{profileStatusLabel[profile.status]}</Chip>}
      />
      <CardBody>
        <p className="text-sm leading-6 text-muted">{profile.summary}</p>
        <Button className="mt-4" size="sm" variant="secondary" onClick={() => onNavigate(profile.moduleKey)}>
          {profile.ctaLabel}
        </Button>
      </CardBody>
    </Card>
  );
}

function OverviewCommandCenter({ onNavigate }: OverviewPageProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <CurrentCasePanel onNavigate={onNavigate} />
        <NextBestActionPanel onNavigate={onNavigate} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ProgressSummary />
        <MissingDataSummary onNavigate={onNavigate} />
        <ProfileStatusMiniCard onNavigate={onNavigate} />
      </div>
    </section>
  );
}

function AnalysisPipeline({ onNavigate }: OverviewPageProps) {
  return (
    <Card>
      <CardHeader
        title="Lộ trình phân tích"
        description="Pipeline chỉ gồm các module phân tích chính, không bao gồm Hồ sơ phân tích."
      />
      <CardBody>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {overviewState.pipeline.map((step, index) => (
            <button
              key={step.id}
              className="min-w-[190px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-accent-soft"
              type="button"
              onClick={() => onNavigate(step.moduleKey)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-[3px] border-[1.5px] border-border bg-surface font-mono text-[11px] font-bold text-ink">
                  {index + 1}
                </span>
                <Chip size="sm" variant={stepStatusTone[step.status]}>{stepStatusLabel[step.status]}</Chip>
              </div>
              <p className="mt-3 text-sm font-bold leading-5 text-ink">{step.label}</p>
              <p className="mt-1 min-h-10 text-xs leading-5 text-muted">{step.shortOutput}</p>
              <span className="mt-3 inline-block text-[11px] font-bold text-ink">{step.ctaLabel}</span>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function PriorityAlertsPanel({ onNavigate }: OverviewPageProps) {
  return (
    <Card>
      <CardHeader title="Cảnh báo cần xem trước" description="Chỉ giữ các cảnh báo quan trọng nhất, không thay thế phân tích chi tiết." />
      <CardBody className="grid gap-3 lg:grid-cols-2">
        {overviewState.alerts.slice(0, 4).map((alert) => (
          <div key={alert.id} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Chip size="sm" variant={alertTone[alert.severity]}>{alertLabel[alert.severity]}</Chip>
              <Chip size="sm" variant="neutral">{alert.relatedModule}</Chip>
            </div>
            <p className="mt-3 text-sm font-bold text-ink">{alert.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{alert.reason}</p>
            <Button className="mt-3" size="sm" variant="secondary" onClick={() => onNavigate(alert.moduleKey)}>
              {alert.ctaLabel}
            </Button>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function WatchlistSnapshot({ onNavigate }: OverviewPageProps) {
  return (
    <Card>
      <CardHeader
        title="Watchlist cần chú ý"
        description={`${overviewState.watchlist.total} mã đang theo dõi. Tổng quan chỉ hiển thị snapshot.`}
      />
      <CardBody className="space-y-3">
        {overviewState.watchlist.ideas.slice(0, 3).map((idea) => (
          <button
            key={idea.ticker}
            className="grid w-full gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-accent-soft md:grid-cols-[72px_minmax(0,1fr)_130px]"
            type="button"
            onClick={() => onNavigate(idea.moduleKey)}
          >
            <strong className="text-lg text-ink">{idea.ticker}</strong>
            <span>
              <span className="block text-sm font-bold text-ink">{idea.company}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">{idea.currentStep} · {idea.mainWarning}</span>
            </span>
            <span className="text-xs font-bold text-ink md:text-right">{idea.nextAction}</span>
          </button>
        ))}
        <Button size="sm" variant="secondary" onClick={() => onNavigate("watchlist")}>Mở Watchlist</Button>
      </CardBody>
    </Card>
  );
}

function LearningHelper({ onNavigate }: OverviewPageProps) {
  return (
    <Card>
      <CardHeader
        title="Học nhanh trước bước tiếp theo"
        description={`Gợi ý theo bước hiện tại: ${overviewState.learning.currentStep}.`}
      />
      <CardBody className="space-y-2">
        {overviewState.learning.lessons.slice(0, 3).map((lesson) => (
          <button
            key={lesson.title}
            className="w-full rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-accent-soft"
            type="button"
            onClick={() => onNavigate(lesson.moduleKey)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">{lesson.title}</p>
              <Chip size="sm" variant="neutral">{lesson.duration}</Chip>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">{lesson.reason}</p>
          </button>
        ))}
      </CardBody>
    </Card>
  );
}

function PracticeSnapshot({ onNavigate }: OverviewPageProps) {
  return (
    <Card>
      <CardHeader title="Thực hành và ghi chú" description="Phần phụ để kiểm tra kỷ luật sau khi dữ liệu chính đã rõ hơn." />
      <CardBody className="grid gap-3 lg:grid-cols-3">
        {overviewState.practice.map((item) => (
          <div key={item.id} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <Chip size="sm" variant="neutral">{item.status}</Chip>
            <p className="mt-3 text-sm font-bold text-ink">{item.title}</p>
            <p className="mt-1 min-h-10 text-xs leading-5 text-muted">{item.helperText}</p>
            <Button className="mt-3" size="sm" variant="secondary" onClick={() => onNavigate(item.moduleKey)}>
              {item.ctaLabel}
            </Button>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function OverviewDisclaimer() {
  return (
    <p className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-3 text-sm leading-6 text-muted shadow-soft">
      {overviewState.disclaimer}
    </p>
  );
}

export function OverviewPage({ onNavigate }: OverviewPageProps) {
  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <OverviewHeader />
      <OverviewCommandCenter onNavigate={onNavigate} />
      <AnalysisPipeline onNavigate={onNavigate} />
      <PriorityAlertsPanel onNavigate={onNavigate} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <WatchlistSnapshot onNavigate={onNavigate} />
        <LearningHelper onNavigate={onNavigate} />
      </div>
      <PracticeSnapshot onNavigate={onNavigate} />
      <OverviewDisclaimer />
    </div>
  );
}
