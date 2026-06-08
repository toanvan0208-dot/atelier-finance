"use client";

import { Button, Card, CardBody, CardHeader, SectionHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import { overviewState } from "../data/overview.data";
import type { OverviewModule, OverviewStatus } from "../types";

type OverviewPageProps = {
  onNavigate: (key: string) => void;
};

const groupedModuleOrder: OverviewModule["group"][] = [
  "Chuẩn bị",
  "Phân tích",
  "Thực hành & quyết định",
];

const statusClasses: Record<OverviewStatus, string> = {
  "Chưa bắt đầu": "border-border-soft bg-neutral text-muted",
  "Đang làm": "border-[#7BA7E8] bg-[#DCEBFF] text-[#184D8E]",
  "Đã hoàn thành": "border-[#7CCFAF] bg-[#DDF7EC] text-[#0F6B50]",
  "Cần xem lại": "border-[#E8BD5A] bg-[#FFF0C7] text-[#7A5200]",
  "Thiếu dữ liệu": "border-[#E6A29B] bg-[#FBE3DC] text-[#8A342C]",
  "Chưa sẵn sàng": "border-[#D6B15C] bg-[#F8EBC3] text-[#765416]",
  "Xuyên suốt": "border-[#9FC4A5] bg-[#E8F3DC] text-[#386944]",
};

function ModuleStatusBadge({ status }: { status: OverviewStatus }) {
  return (
    <span className={cn("rounded-[3px] border px-2 py-0.5 text-[11px] font-bold", statusClasses[status])}>
      {status}
    </span>
  );
}

function OverviewHeader({ onNavigate }: OverviewPageProps) {
  const progress = overviewState.totalProgress;

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-5 border-b border-border-soft bg-surface-soft px-5 py-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Tổng quan</p>
          <h1 className="mt-2 font-brand text-2xl font-bold leading-tight text-ink md:text-3xl">
            Tổng quan hệ thống đầu tư
          </h1>
          <p className="mt-3 max-w-[820px] text-sm leading-7 text-muted">
            Theo dõi toàn bộ lộ trình từ hiểu bản thân, học nền tảng, vĩ mô, ngành, doanh nghiệp, BCTC,
            định giá, PVT, rủi ro, watchlist, checklist, mô phỏng và nhật ký.
          </p>
          <p className="mt-4 rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3 text-sm font-semibold leading-6 text-ink">
            Hệ thống không khuyến nghị mua/bán. Mục tiêu là giúp bạn hiểu dữ liệu, kiểm tra rủi ro và tự
            xây quyết định có cơ sở.
          </p>
        </div>
        <div className="grid gap-3 rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-hard-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-subtle">Giai đoạn hiện tại</p>
            <p className="mt-1 text-lg font-bold text-ink">{overviewState.userStage}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2">
              <p className="text-[11px] text-subtle">Tiến độ tổng</p>
              <p className="font-bold text-ink">
                {progress.completedSteps}/{progress.totalSteps} bước
              </p>
            </div>
            <div className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2">
              <p className="text-[11px] text-subtle">Bước tiếp theo</p>
              <p className="font-bold text-ink">Cấu hình lộ trình</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onNavigate(overviewState.nextBestAction.primaryModuleKey)}>
              Bắt đầu bước tiếp theo
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onNavigate("macro")}>
              Xem lộ trình
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onNavigate("learning")}>
              Hỏi AI hướng dẫn
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function NextBestActionCard({ onNavigate }: OverviewPageProps) {
  const action = overviewState.nextBestAction;

  return (
    <Card className="border-[2px]">
      <CardHeader
        title="Bước tiếp theo nên làm"
        description="Gợi ý từ logic hệ thống dựa trên dữ liệu còn thiếu và thứ tự lộ trình."
        chip={
          <span className="rounded-[3px] border border-border bg-accent px-2 py-0.5 text-[11px] font-bold text-ink">
            Ưu tiên {action.priority}
          </span>
        }
      />
      <CardBody>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <h2 className="font-brand text-xl font-bold text-ink">{action.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{action.reason}</p>
            <p className="mt-3 text-xs font-semibold text-subtle">Module liên quan: {action.relatedModule}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => onNavigate(action.primaryModuleKey)}>{action.primaryAction}</Button>
            <Button variant="secondary" onClick={() => onNavigate(action.secondaryModuleKey)}>
              {action.secondaryAction}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function ProgressStepCard({ module, index, onNavigate }: { module: OverviewModule; index: number; onNavigate: (key: string) => void }) {
  return (
    <button
      className="grid min-h-[188px] w-full content-between rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-hover"
      type="button"
      onClick={() => onNavigate(module.moduleKey)}
    >
      <span>
        <span className="mb-3 flex items-start justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[3px] border border-border bg-ink text-[11px] font-bold text-white">
              {index + 1}
            </span>
            <strong className="text-sm text-ink">{module.name}</strong>
          </span>
          <ModuleStatusBadge status={module.status} />
        </span>
        <span className="block text-xs leading-5 text-muted">{module.goal}</span>
        {module.missingData ? (
          <span className="mt-3 block rounded-[3px] border border-[#E6A29B] bg-[#FBE3DC] px-3 py-2 text-xs font-semibold text-[#8A342C]">
            {module.missingData}
          </span>
        ) : null}
      </span>
      <span className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-subtle">
          {module.completedSteps}/{module.totalSteps} bước
        </span>
        <span className="rounded-[3px] border border-border bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-ink">
          {module.action}
        </span>
      </span>
    </button>
  );
}

function InvestmentJourneyStepper({ onNavigate }: OverviewPageProps) {
  return (
    <section className="space-y-3">
      <SectionHeader
        title="Lộ trình phân tích của bạn"
        description="Bấm vào từng bước để mở module tương ứng. Tổng quan chỉ hiển thị mục tiêu, trạng thái và dữ liệu còn thiếu."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {overviewState.modules.map((module, index) => (
          <ProgressStepCard key={module.id} module={module} index={index} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

function InvestorProfileSummaryCard({ onNavigate }: OverviewPageProps) {
  const profile = overviewState.investorProfile;
  const rows = [
    ["Mục tiêu đầu tư", profile.goal],
    ["Khẩu vị rủi ro", profile.riskAppetite],
    ["Thời gian đầu tư", profile.timeHorizon],
    ["Hiểu biết tài chính", profile.financialKnowledge],
    ["Thói quen quyết định", profile.decisionHabit],
  ];

  return (
    <Card>
      <CardHeader title="Cấu hình lộ trình cá nhân" description="Card đại diện cho module Cấu hình lộ trình." chip={<ModuleStatusBadge status="Đang làm" />} />
      <CardBody className="space-y-4">
        <p className="text-sm leading-7 text-muted">
          Cấu hình lộ trình giúp hệ thống biết hôm nay bạn muốn học, phân tích, mô phỏng hay kiểm tra lại quyết định.
          Từ đó AI Tutor có thể giải thích đúng mức và nhắc đúng phần bạn đang vướng.
        </p>
        <div className="grid gap-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs">
              <span className="font-semibold text-subtle">{label}</span>
              <strong className="text-right text-ink">{value}</strong>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.behaviorFlags.map((flag) => (
            <span key={flag} className="rounded-[3px] border border-[#D6B15C] bg-[#F8EBC3] px-2.5 py-1 text-[11px] font-bold text-[#765416]">
              {flag}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onNavigate("route-config")}>Cấu hình lộ trình</Button>
          <Button size="sm" variant="secondary" onClick={() => onNavigate("route-config")}>Xem điểm cần chú ý</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function LearningPriorityCard({ onNavigate }: OverviewPageProps) {
  return (
    <Card>
      <CardHeader title="Học tập nên ưu tiên" description="Học tập là trợ giảng xuyên suốt, không phải bước cuối." />
      <CardBody className="space-y-4">
        <div className="grid gap-2">
          {overviewState.learning.recommendedLessons.map((lesson) => (
            <button
              key={lesson.title}
              className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-surface-hover"
              type="button"
              onClick={() => onNavigate("learning")}
            >
              <strong className="block text-sm text-ink">{lesson.title}</strong>
              <span className="mt-1 block text-xs text-muted">{lesson.duration} · Dùng trong: {lesson.usedIn}</span>
            </button>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-subtle">Chủ đề còn yếu</p>
          <div className="flex flex-wrap gap-2">
            {overviewState.learning.weakTopics.map((topic) => (
              <span key={topic} className="rounded-[3px] border border-border-soft bg-neutral px-2.5 py-1 text-[11px] font-semibold text-muted">
                {topic}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onNavigate("learning")}>Học bài gợi ý</Button>
          <Button size="sm" variant="secondary" onClick={() => onNavigate("learning")}>Làm quiz nhanh</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function AnalysisProgressGrid({ onNavigate }: OverviewPageProps) {
  return (
    <section className="space-y-3">
      <SectionHeader title="Tiến độ phân tích" description="Trạng thái module được nhóm theo Chuẩn bị, Phân tích, Thực hành & quyết định." />
      <div className="grid gap-4 xl:grid-cols-3">
        {groupedModuleOrder.map((group) => (
          <Card key={group}>
            <CardHeader title={group} />
            <CardBody className="space-y-2">
              {overviewState.modules
                .filter((module) => module.group === group)
                .map((module) => (
                  <button
                    key={module.id}
                    className="grid w-full gap-2 rounded-[3px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-surface-hover"
                    type="button"
                    onClick={() => onNavigate(module.moduleKey)}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <strong className="text-xs text-ink">{module.name}</strong>
                      <ModuleStatusBadge status={module.status} />
                    </span>
                    <span className="text-[11px] text-subtle">
                      {module.completedSteps}/{module.totalSteps} bước hoàn thành
                      {module.missingData ? ` · ${module.missingData}` : ""}
                    </span>
                  </button>
                ))}
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-3">
      <p className="mb-2 text-xs font-bold text-ink">{title}</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <p key={item} className="text-xs leading-5 text-muted">{item}</p>
        ))}
      </div>
    </div>
  );
}

function MacroSectorPreviewCard({ onNavigate }: OverviewPageProps) {
  const preview = overviewState.macroSector;

  return (
    <Card>
      <CardHeader title="Bối cảnh thị trường nhanh" description="Preview ngắn, không thay thế Module Vĩ mô hoặc Ngành." chip={<ModuleStatusBadge status="Chưa bắt đầu" />} />
      <CardBody className="space-y-4">
        <p className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-3 text-sm leading-6 text-muted">{preview.emptyState}</p>
        <div className="grid gap-3 md:grid-cols-3">
          <MiniList title="Điểm hỗ trợ" items={preview.supports} />
          <MiniList title="Điểm gây áp lực" items={preview.pressures} />
          <MiniList title="Ngành cần xem tiếp" items={preview.sectorsToReview} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onNavigate("macro")}>Mở Module Vĩ mô</Button>
          <Button size="sm" variant="secondary" onClick={() => onNavigate("industry")}>Mở Module Ngành</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function WatchlistQuickPanel({ onNavigate }: OverviewPageProps) {
  const watchlist = overviewState.watchlist;
  const stats = [
    ["Đang theo dõi", `${watchlist.total} mã`],
    ["Mới thêm", `${watchlist.newlyAdded} mã`],
    ["Thiếu thesis", `${watchlist.missingThesis} mã`],
    ["Cần xem lại", `${watchlist.needReview} mã`],
    ["Sẵn sàng mô phỏng", `${watchlist.readyForSimulation} mã`],
    ["Tạm loại", `${watchlist.paused} mã`],
  ];

  return (
    <Card>
      <CardHeader title="Ý tưởng đang theo dõi" description="Tóm tắt từ Watchlist, không hiển thị cổ phiếu nên mua." />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2">
              <p className="text-[11px] text-subtle">{label}</p>
              <p className="font-bold text-ink">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-2">
          {watchlist.ideas.map((idea) => (
            <button
              key={idea.ticker}
              className="grid gap-2 rounded-[3px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-surface-hover md:grid-cols-[72px_minmax(0,1fr)_180px]"
              type="button"
              onClick={() => onNavigate("watchlist")}
            >
              <strong className="text-base text-ink">{idea.ticker}</strong>
              <span>
                <span className="block text-xs font-bold text-ink">{idea.company}</span>
                <span className="block text-[11px] text-muted">Trạng thái: {idea.status} · Thiếu: {idea.missing}</span>
              </span>
              <span className="text-[11px] font-semibold text-subtle">{idea.nextStep}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onNavigate("watchlist")}>Mở Watchlist</Button>
          <Button size="sm" variant="secondary" onClick={() => onNavigate("screening")}>Thêm cổ phiếu</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function SimulationChecklistPanel({ onNavigate }: OverviewPageProps) {
  return (
    <section className="space-y-3">
      <SectionHeader title="Thực hành & quyết định" description="Checklist, mô phỏng và nhật ký giúp kiểm tra kỷ luật trước khi đi tiếp." />
      <div className="grid gap-3 lg:grid-cols-3">
        {overviewState.practice.map((item) => (
          <Card key={item.title}>
            <CardHeader title={item.title} />
            <CardBody className="space-y-4">
              <p className="min-h-[72px] text-sm leading-6 text-muted">{item.goal}</p>
              <div className="grid gap-2">
                <div className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs font-bold text-ink">
                  {item.metric}
                </div>
                <div className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs text-muted">
                  {item.secondaryMetric}
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onNavigate(item.moduleKey)}>{item.action}</Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}

function SoftAlertList({ onNavigate }: OverviewPageProps) {
  return (
    <Card>
      <CardHeader title="Điểm cần chú ý" description="Cảnh báo mềm, không phán xét và không gây hoảng." />
      <CardBody className="grid gap-3 lg:grid-cols-3">
        {overviewState.alerts.map((alert) => (
          <div key={alert.type} className="rounded-[4px] border-[1.5px] border-[#D6B15C] bg-[#FFF6D8] px-4 py-4">
            <p className="text-sm font-bold text-ink">{alert.title}</p>
            <p className="mt-2 min-h-[72px] text-xs leading-6 text-muted">{alert.message}</p>
            <p className="mt-3 text-[11px] font-semibold text-subtle">Module liên quan: {alert.module}</p>
            <Button className="mt-3" size="sm" variant="secondary" onClick={() => onNavigate(alert.moduleKey)}>
              {alert.action}
            </Button>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function OverviewPage({ onNavigate }: OverviewPageProps) {
  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-5">
      <OverviewHeader onNavigate={onNavigate} />
      <NextBestActionCard onNavigate={onNavigate} />

      <div className="grid gap-5 xl:grid-cols-2">
        <InvestorProfileSummaryCard onNavigate={onNavigate} />
        <LearningPriorityCard onNavigate={onNavigate} />
      </div>

      <InvestmentJourneyStepper onNavigate={onNavigate} />
      <AnalysisProgressGrid onNavigate={onNavigate} />
      <MacroSectorPreviewCard onNavigate={onNavigate} />
      <WatchlistQuickPanel onNavigate={onNavigate} />
      <SimulationChecklistPanel onNavigate={onNavigate} />
      <SoftAlertList onNavigate={onNavigate} />
    </div>
  );
}
