"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, SectionHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import { checklistPurposes, checklistState } from "../data/checklist.data";
import type { ChecklistGroup, ChecklistPurposeId, ChecklistStatusId, ReadinessStatus } from "../types";

type ChecklistPageProps = {
  onNavigate: (key: string) => void;
};

const statusLabels: Record<ChecklistStatusId, string> = {
  not_started: "Chưa làm",
  in_progress: "Đang kiểm tra",
  basic_ok: "Ổn ở mức cơ bản",
  need_more_check: "Cần kiểm tra thêm",
  missing_important_data: "Thiếu dữ liệu quan trọng",
};

const statusClasses: Record<ChecklistStatusId, string> = {
  not_started: "border-border-soft bg-neutral text-muted",
  in_progress: "border-[#7BA7E8] bg-[#DCEBFF] text-[#184D8E]",
  basic_ok: "border-[#7CCFAF] bg-[#DDF7EC] text-[#0F6B50]",
  need_more_check: "border-[#E8BD5A] bg-[#FFF0C7] text-[#7A5200]",
  missing_important_data: "border-[#E6A29B] bg-[#FBE3DC] text-[#8A342C]",
};

const readinessClasses: Record<ReadinessStatus, string> = {
  "Có thể đi tiếp": "border-[#7CCFAF] bg-[#DDF7EC] text-[#0F6B50]",
  "Cần kiểm tra thêm": "border-[#E8BD5A] bg-[#FFF0C7] text-[#7A5200]",
  "Chưa nên quyết định vội": "border-[#E6A29B] bg-[#FBE3DC] text-[#8A342C]",
  "Nên mô phỏng trước": "border-[#7BA7E8] bg-[#DCEBFF] text-[#184D8E]",
  "Nên quay lại phân tích": "border-[#D6B15C] bg-[#F8EBC3] text-[#765416]",
};

function ChecklistStatusBadge({ status }: { status: ChecklistStatusId }) {
  return (
    <span className={cn("rounded-[3px] border px-2 py-0.5 text-[11px] font-bold", statusClasses[status])}>
      {statusLabels[status]}
    </span>
  );
}

function ReadinessBadge({ status }: { status: ReadinessStatus }) {
  return (
    <span className={cn("rounded-[3px] border px-2.5 py-1 text-[11px] font-bold", readinessClasses[status])}>
      {status}
    </span>
  );
}

function ChecklistHeader({ purposeLabel }: { purposeLabel: string }) {
  const state = checklistState;

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Chip variant="accent">Checklist</Chip>
          <ReadinessBadge status={state.readinessStatus} />
        </div>
        <div>
          <h1 className="font-brand text-2xl font-bold leading-tight text-ink md:text-3xl">
            Checklist
          </h1>
          <p className="mt-2 max-w-[860px] text-sm leading-7 text-muted">
            Kiểm tra dữ liệu, thesis, rủi ro và cảm xúc trước khi đi tiếp.
          </p>
        </div>
        <p className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3 text-sm font-semibold leading-6 text-ink">
          Checklist không phải công cụ khuyến nghị mua/bán. Đây là bước dừng lại để kiểm tra chất lượng
          phân tích trước khi mô phỏng hoặc trước khi ra quyết định.
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Mã cổ phiếu", state.ticker],
            ["Doanh nghiệp", state.companyName],
            ["Ngành", state.industry],
            ["Mục tiêu kiểm tra", purposeLabel],
            ["Đã hoàn thành", `${state.completedGroups}/${state.totalGroups} nhóm`],
            ["Điểm còn thiếu", `${state.missingPoints.length} điểm`],
            ["Trạng thái", state.readinessStatus],
            ["Hành động tiếp theo", state.result.nextAction],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="text-[11px] font-semibold text-subtle">{label}</p>
              <p className="mt-1 text-sm font-bold leading-5 text-ink">{value}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function ChecklistPurposeSelector({
  selectedPurpose,
  onSelect,
}: {
  selectedPurpose: ChecklistPurposeId;
  onSelect: (purpose: ChecklistPurposeId) => void;
}) {
  const selected = checklistPurposes.find((purpose) => purpose.id === selectedPurpose) ?? checklistPurposes[0];

  return (
    <section>
      <SectionHeader
        title="Bạn đang kiểm tra để làm gì?"
        description="Checklist sẽ ưu tiên các nhóm câu hỏi phù hợp với mục tiêu bạn chọn. Bạn vẫn có thể mở rộng để xem toàn bộ checklist."
      />
      <div className="grid gap-3 lg:grid-cols-5">
        {checklistPurposes.map((purpose) => {
          const isSelected = selectedPurpose === purpose.id;

          return (
            <button
              key={purpose.id}
              className={cn(
                "grid min-h-[168px] content-between rounded-[4px] border-[1.5px] px-4 py-4 text-left shadow-soft transition hover:-translate-y-0.5",
                isSelected ? "border-border bg-ink text-white" : "border-border bg-surface text-ink hover:bg-surface-hover"
              )}
              type="button"
              onClick={() => onSelect(purpose.id)}
              aria-pressed={isSelected}
            >
              <strong className={isSelected ? "text-sm text-white" : "text-sm text-ink"}>{purpose.label}</strong>
              <span className={isSelected ? "mt-2 text-xs leading-5 text-white/75" : "mt-2 text-xs leading-5 text-muted"}>
                {purpose.description}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs font-semibold leading-5 text-muted">
        {selected.explanation}
      </p>
    </section>
  );
}

function RelatedModuleButton({
  label,
  moduleKey,
  onNavigate,
}: {
  label: string;
  moduleKey: string;
  onNavigate: (key: string) => void;
}) {
  return (
    <button
      className="rounded-[3px] border border-border-soft bg-surface-soft px-2.5 py-1 text-[11px] font-bold text-muted transition hover:border-border hover:bg-surface-hover hover:text-ink"
      type="button"
      onClick={() => onNavigate(moduleKey)}
    >
      {label}
    </button>
  );
}

function ChecklistGroupCard({
  group,
  isPriority,
  onOpen,
  onNavigate,
}: {
  group: ChecklistGroup;
  isPriority: boolean;
  onOpen: (group: ChecklistGroup) => void;
  onNavigate: (key: string) => void;
}) {
  return (
    <Card className={cn(isPriority && "border-[2px] bg-accent-soft/25")}>
      <CardHeader
        title={group.name}
        description={group.goal}
        chip={<ChecklistStatusBadge status={group.status} />}
      />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2">
            <p className="text-[11px] text-subtle">Đã trả lời</p>
            <p className="font-bold text-ink">{group.answered}/{group.total}</p>
          </div>
          <div className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2">
            <p className="text-[11px] text-subtle">Độ ưu tiên</p>
            <p className="font-bold text-ink">{isPriority ? "Ưu tiên" : "Có thể xem thêm"}</p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-subtle">Điểm còn thiếu</p>
          <div className="grid gap-2">
            {group.missingPoints.slice(0, 2).map((point) => (
              <p key={point} className="rounded-[3px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs leading-5 text-[#765416]">
                {point}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-subtle">Module liên quan</p>
          <div className="flex flex-wrap gap-2">
            {group.relatedModules.slice(0, 3).map((module) => (
              <RelatedModuleButton
                key={module.moduleKey}
                label={module.label}
                moduleKey={module.moduleKey}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onOpen(group)}>Mở kiểm tra</Button>
          {group.status === "missing_important_data" || group.status === "need_more_check" ? (
            <Button size="sm" variant="secondary" onClick={() => onNavigate(group.relatedModules[0]?.moduleKey ?? "overview")}>
              Quay lại module liên quan
            </Button>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}

function ChecklistQuestionItem({ question, index }: { question: string; index: number }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <p className="font-mono text-[11px] font-bold text-subtle">Câu {index + 1}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-ink">{question}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Đã có dữ liệu", "Cần kiểm tra thêm", "Chưa rõ"].map((label) => (
          <button
            key={label}
            className="rounded-[3px] border border-border-soft bg-surface px-2.5 py-1 text-[11px] font-bold text-muted transition hover:border-border hover:bg-surface-hover hover:text-ink"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChecklistQuestionDrawer({
  group,
  onClose,
  onNavigate,
}: {
  group: ChecklistGroup | null;
  onClose: () => void;
  onNavigate: (key: string) => void;
}) {
  if (!group) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-ink/35" type="button" aria-label="Đóng kiểm tra" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 w-full max-w-[560px] overflow-y-auto border-l-[1.5px] border-border bg-page px-5 py-5 shadow-hard">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Mở kiểm tra</p>
            <h2 className="mt-1 text-lg font-bold text-ink">{group.name}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{group.goal}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onClose}>Đóng</Button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <ChecklistStatusBadge status={group.status} />
          {group.relatedModules.map((module) => (
            <RelatedModuleButton
              key={module.moduleKey}
              label={module.label}
              moduleKey={module.moduleKey}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        {group.softWarning ? (
          <p className="mb-4 rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs font-semibold leading-5 text-[#765416]">
            {group.softWarning}
          </p>
        ) : null}
        <div className="grid gap-3">
          {group.questions.map((question, index) => (
            <ChecklistQuestionItem key={question} question={question} index={index} />
          ))}
        </div>
      </aside>
    </div>
  );
}

function ChecklistGroupGrid({
  selectedPurpose,
  onOpen,
  onNavigate,
}: {
  selectedPurpose: ChecklistPurposeId;
  onOpen: (group: ChecklistGroup) => void;
  onNavigate: (key: string) => void;
}) {
  const selected = checklistPurposes.find((purpose) => purpose.id === selectedPurpose) ?? checklistPurposes[0];
  const priorityIds = new Set(selected.priorityGroupIds);
  const groups = [...checklistState.groups].sort((a, b) => Number(priorityIds.has(b.id)) - Number(priorityIds.has(a.id)));

  return (
    <section>
      <SectionHeader
        title="Checklist thống nhất"
        description="9 nhóm kiểm tra dùng chung cho mọi tình huống. Nhóm ưu tiên được đưa lên trước theo mục tiêu bạn chọn."
      />
      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {groups.map((group) => (
          <ChecklistGroupCard
            key={group.id}
            group={group}
            isPriority={priorityIds.has(group.id)}
            onOpen={onOpen}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}

function ChecklistMissingDataAlert() {
  return (
    <Card>
      <CardHeader title="Điểm còn thiếu nổi bật" description="Các điểm này cần xử lý trước khi đi tiếp." />
      <CardBody className="grid gap-2 md:grid-cols-3">
        {checklistState.missingPoints.map((point) => (
          <p key={point} className="rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs font-semibold leading-5 text-[#765416]">
            {point}
          </p>
        ))}
      </CardBody>
    </Card>
  );
}

function ChecklistResultSummary({ onNavigate }: ChecklistPageProps) {
  const result = checklistState.result;

  return (
    <Card>
      <CardHeader
        title="Bản kiểm tra trước khi đi tiếp"
        description="Kết quả này tóm tắt điểm đã hiểu, điểm còn thiếu và nơi nên quay lại."
        chip={<ReadinessBadge status={result.readiness} />}
      />
      <CardBody className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Mã cổ phiếu", checklistState.ticker],
            ["Doanh nghiệp", checklistState.companyName],
            ["Ngành", checklistState.industry],
            ["Mức độ sẵn sàng", result.readiness],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="text-[11px] font-semibold text-subtle">{label}</p>
              <p className="mt-1 text-sm font-bold text-ink">{value}</p>
            </div>
          ))}
        </div>
        <section>
          <SectionHeader title="Thesis chính" />
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-sm leading-6 text-muted">
            {checklistState.thesis}
          </p>
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <SectionHeader title="Dữ liệu xác nhận thesis" />
            <div className="grid gap-2">
              {checklistState.confirmingData.map((item) => (
                <p key={item} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">{item}</p>
              ))}
            </div>
          </section>
          <section>
            <SectionHeader title="Dữ liệu phủ định thesis" />
            <div className="grid gap-2">
              {checklistState.disconfirmingData.map((item) => (
                <p key={item} className="rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs leading-5 text-[#765416]">{item}</p>
              ))}
            </div>
          </section>
        </div>
        <ChecklistNextActionPanel onNavigate={onNavigate} />
      </CardBody>
    </Card>
  );
}

function ChecklistNextActionPanel({ onNavigate }: ChecklistPageProps) {
  const result = checklistState.result;

  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-4">
      <p className="text-sm font-bold text-ink">Hành động tiếp theo</p>
      <p className="mt-1 text-sm leading-6 text-muted">{result.nextAction}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => onNavigate("simulation")}>Tạo mô phỏng</Button>
        {result.suggestedModules.map((module) => (
          <Button key={module.moduleKey} variant="secondary" onClick={() => onNavigate(module.moduleKey)}>
            Quay lại {module.label}
          </Button>
        ))}
        <Button variant="secondary" onClick={() => onNavigate("journal")}>Ghi nhật ký</Button>
        <Button variant="ghost" onClick={() => onNavigate("learning")}>Học bài liên quan</Button>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {result.recommendedLessons.map((lesson) => (
          <p key={lesson} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs font-semibold text-muted">
            {lesson}
          </p>
        ))}
      </div>
    </section>
  );
}

export function ChecklistPage({ onNavigate }: ChecklistPageProps) {
  const [selectedPurpose, setSelectedPurpose] = useState<ChecklistPurposeId>(checklistState.checklistPurpose);
  const [openGroup, setOpenGroup] = useState<ChecklistGroup | null>(null);
  const purposeLabel = useMemo(
    () => checklistPurposes.find((purpose) => purpose.id === selectedPurpose)?.label ?? "Đưa vào mô phỏng",
    [selectedPurpose]
  );

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-5">
      <ChecklistHeader purposeLabel={purposeLabel} />
      <ChecklistPurposeSelector selectedPurpose={selectedPurpose} onSelect={setSelectedPurpose} />
      <ChecklistMissingDataAlert />
      <ChecklistGroupGrid
        selectedPurpose={selectedPurpose}
        onOpen={setOpenGroup}
        onNavigate={onNavigate}
      />
      <ChecklistResultSummary onNavigate={onNavigate} />
      <ChecklistQuestionDrawer
        group={openGroup}
        onClose={() => setOpenGroup(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
