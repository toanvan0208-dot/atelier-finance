"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, SectionHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import { checklistPurposes, checklistState } from "../data/checklist.data";
import type { ChecklistGroup, ChecklistPurposeId, ChecklistStatusId, ReadinessStatus } from "../types";

type ChecklistPageProps = {
  onNavigate: (key: string) => void;
};

type AnswerStatus = "available" | "unsure" | "missing";

type QuestionAnswer = {
  status?: AnswerStatus;
  note: string;
};

type AnswerMap = Record<string, Record<number, QuestionAnswer>>;

type DecisionModel = {
  readiness: ReadinessStatus;
  completedGroups: number;
  totalGroups: number;
  missingCriticalCount: number;
  unsureCount: number;
  nextAction: string;
  canSimulate: string;
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
  "Sẵn sàng cho bước tiếp theo": "border-[#7CCFAF] bg-[#DDF7EC] text-[#0F6B50]",
  "Tạm đủ để mô phỏng": "border-[#7BA7E8] bg-[#DCEBFF] text-[#184D8E]",
  "Có thể mô phỏng với cảnh báo": "border-[#7BA7E8] bg-[#DCEBFF] text-[#184D8E]",
  "Cần kiểm tra thêm": "border-[#E8BD5A] bg-[#FFF0C7] text-[#7A5200]",
  "Chưa nên đi tiếp": "border-[#E6A29B] bg-[#FBE3DC] text-[#8A342C]",
  "Thiếu dữ liệu quan trọng": "border-[#E6A29B] bg-[#FBE3DC] text-[#8A342C]",
};

const answerLabels: Record<AnswerStatus, string> = {
  available: "Đã có dữ liệu",
  unsure: "Chưa chắc",
  missing: "Chưa có dữ liệu",
};

const answerClasses: Record<AnswerStatus, string> = {
  available: "border-[#7CCFAF] bg-[#DDF7EC] text-[#0F6B50]",
  unsure: "border-[#E8BD5A] bg-[#FFF0C7] text-[#7A5200]",
  missing: "border-[#E6A29B] bg-[#FBE3DC] text-[#8A342C]",
};

function getInitialAnswers(groups: ChecklistGroup[]): AnswerMap {
  return groups.reduce<AnswerMap>((groupAcc, group) => {
    groupAcc[group.id] = group.questions.reduce<Record<number, QuestionAnswer>>((questionAcc, _question, index) => {
      if (index < group.answered) {
        questionAcc[index] = { status: "available", note: "" };
        return questionAcc;
      }

      if (group.status === "missing_important_data") {
        questionAcc[index] = { status: "missing", note: "" };
        return questionAcc;
      }

      if (group.status === "need_more_check" || group.status === "in_progress") {
        questionAcc[index] = { status: "unsure", note: "" };
        return questionAcc;
      }

      questionAcc[index] = { note: "" };
      return questionAcc;
    }, {});

    return groupAcc;
  }, {});
}

function getGroupAnsweredCount(group: ChecklistGroup, answers: AnswerMap) {
  return group.questions.filter((_question, index) => answers[group.id]?.[index]?.status === "available").length;
}

function getGroupMissingCount(group: ChecklistGroup, answers: AnswerMap) {
  return group.questions.filter((_question, index) => answers[group.id]?.[index]?.status === "missing").length;
}

function getGroupUnsureCount(group: ChecklistGroup, answers: AnswerMap) {
  return group.questions.filter((_question, index) => answers[group.id]?.[index]?.status === "unsure").length;
}

function getDerivedGroupStatus(group: ChecklistGroup, answers: AnswerMap): ChecklistStatusId {
  const missing = getGroupMissingCount(group, answers);
  const unsure = getGroupUnsureCount(group, answers);
  const answered = getGroupAnsweredCount(group, answers);

  if (missing > 0) return "missing_important_data";
  if (unsure > 0) return "need_more_check";
  if (answered === 0) return "not_started";
  if (answered < group.total) return "in_progress";
  return "basic_ok";
}

function getDecisionModel(groups: ChecklistGroup[], priorityIds: Set<string>, answers: AnswerMap): DecisionModel {
  const priorityGroups = groups.filter((group) => priorityIds.has(group.id));
  const missingCriticalCount = priorityGroups.reduce((sum, group) => sum + getGroupMissingCount(group, answers), 0);
  const unsureCount = priorityGroups.reduce((sum, group) => sum + getGroupUnsureCount(group, answers), 0);
  const completedGroups = groups.filter((group) => getDerivedGroupStatus(group, answers) === "basic_ok").length;
  const stablePriorityGroups = priorityGroups.filter((group) => getDerivedGroupStatus(group, answers) === "basic_ok").length;
  const totalPriorityQuestions = priorityGroups.reduce((sum, group) => sum + group.total, 0);
  const availablePriorityQuestions = priorityGroups.reduce((sum, group) => sum + getGroupAnsweredCount(group, answers), 0);
  const availableRatio = totalPriorityQuestions === 0 ? 0 : availablePriorityQuestions / totalPriorityQuestions;

  if (missingCriticalCount > 0) {
    return {
      readiness: "Chưa nên đi tiếp",
      completedGroups,
      totalGroups: groups.length,
      missingCriticalCount,
      unsureCount,
      canSimulate: "Chưa đủ",
      nextAction: "Bổ sung dữ liệu quan trọng ở nhóm ưu tiên trước khi chuyển bước.",
    };
  }

  if (unsureCount >= 4) {
    return {
      readiness: "Cần kiểm tra thêm",
      completedGroups,
      totalGroups: groups.length,
      missingCriticalCount,
      unsureCount,
      canSimulate: "Chỉ nên mô phỏng có cảnh báo",
      nextAction: "Giảm số câu trả lời 'chưa chắc' trong các nhóm ưu tiên.",
    };
  }

  if (stablePriorityGroups === priorityGroups.length) {
    return {
      readiness: "Sẵn sàng cho bước tiếp theo",
      completedGroups,
      totalGroups: groups.length,
      missingCriticalCount,
      unsureCount,
      canSimulate: "Có thể",
      nextAction: "Đặt mốc xem lại thesis và ghi nhật ký trước khi chuyển bước.",
    };
  }

  if (availableRatio >= 0.65) {
    return {
      readiness: "Tạm đủ để mô phỏng",
      completedGroups,
      totalGroups: groups.length,
      missingCriticalCount,
      unsureCount,
      canSimulate: "Có thể mô phỏng với cảnh báo",
      nextAction: "Tạo mô phỏng nhỏ và tiếp tục theo dõi các câu còn chưa chắc.",
    };
  }

  return {
    readiness: "Cần kiểm tra thêm",
    completedGroups,
    totalGroups: groups.length,
    missingCriticalCount,
    unsureCount,
    canSimulate: "Chưa đủ rõ",
    nextAction: "Ưu tiên mở nhóm có dữ liệu thiếu nhiều nhất.",
  };
}

function ChecklistStatusBadge({ status }: { status: ChecklistStatusId }) {
  return <span className={cn("rounded-[3px] border px-2 py-0.5 text-[11px] font-bold", statusClasses[status])}>{statusLabels[status]}</span>;
}

function ReadinessBadge({ status }: { status: ReadinessStatus }) {
  return <span className={cn("rounded-[3px] border px-2.5 py-1 text-[11px] font-bold", readinessClasses[status])}>{status}</span>;
}

function DecisionStatusBar({
  purposeLabel,
  decision,
}: {
  purposeLabel: string;
  decision: DecisionModel;
}) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="accent">Checklist</Chip>
          <Chip>Mock data</Chip>
          <span className="text-xs font-semibold text-muted">
            {checklistState.ticker} · {checklistState.companyName} · {checklistState.industry}
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.04em] text-subtle">Decision Status Bar</p>
            <h1 className="mt-2 font-brand text-2xl font-bold leading-tight text-ink md:text-3xl">
              {decision.readiness}
            </h1>
            <p className="mt-2 max-w-[820px] text-sm leading-7 text-muted">
              Checklist chỉ kiểm tra độ đủ dữ liệu, rủi ro, luận điểm ngược chiều và cảm xúc. Công cụ này không xếp hạng hành động giao dịch.
            </p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Hành động tiếp theo</p>
            <p className="mt-2 text-sm font-bold leading-6 text-ink">{decision.nextAction}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
            <p className="text-[11px] font-semibold text-subtle">Mục tiêu</p>
            <p className="mt-1 text-sm font-bold text-ink">{purposeLabel}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
            <p className="text-[11px] font-semibold text-subtle">Nhóm hoàn thành</p>
            <p className="mt-1 text-sm font-bold text-ink">{decision.completedGroups}/{decision.totalGroups}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
            <p className="text-[11px] font-semibold text-subtle">Thiếu quan trọng</p>
            <p className="mt-1 text-sm font-bold text-ink">{decision.missingCriticalCount} điểm</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
            <p className="text-[11px] font-semibold text-subtle">Mô phỏng</p>
            <p className="mt-1 text-sm font-bold text-ink">{decision.canSimulate}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function ChecklistPurposeTabs({
  selectedPurpose,
  onSelect,
}: {
  selectedPurpose: ChecklistPurposeId;
  onSelect: (purpose: ChecklistPurposeId) => void;
}) {
  const selected = checklistPurposes.find((purpose) => purpose.id === selectedPurpose) ?? checklistPurposes[0];

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Bạn kiểm tra để làm gì?"
        description="Chọn mục tiêu để hệ thống đưa nhóm cần xử lý lên trước."
      />
      <div className="flex flex-wrap gap-2 rounded-[4px] border border-border-soft bg-surface-soft p-2">
        {checklistPurposes.map((purpose) => {
          const isSelected = selectedPurpose === purpose.id;

          return (
            <button
              key={purpose.id}
              className={cn(
                "rounded-[3px] border px-3 py-2 text-xs font-bold transition",
                isSelected ? "border-border bg-ink text-white shadow-soft" : "border-border-soft bg-surface text-muted hover:border-border hover:text-ink"
              )}
              type="button"
              onClick={() => onSelect(purpose.id)}
              aria-pressed={isSelected}
            >
              {purpose.label}
            </button>
          );
        })}
      </div>
      <div className="rounded-[4px] border border-border-soft bg-accent-soft px-4 py-3">
        <p className="text-sm font-bold text-ink">{selected.label}</p>
        <p className="mt-1 text-sm leading-6 text-muted">{selected.description}</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-muted">{selected.explanation}</p>
      </div>
    </section>
  );
}

function ChecklistGroupCard({
  group,
  status,
  answered,
  missing,
  isPriority,
  compact = false,
  onOpen,
}: {
  group: ChecklistGroup;
  status: ChecklistStatusId;
  answered: number;
  missing: number;
  isPriority: boolean;
  compact?: boolean;
  onOpen: (group: ChecklistGroup) => void;
}) {
  const progress = Math.round((answered / group.total) * 100);

  return (
    <article className={cn("rounded-[4px] border bg-surface px-4 py-4", isPriority ? "border-border shadow-soft" : "border-border-soft")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">{isPriority ? "Nhóm ưu tiên" : "Nhóm tham chiếu"}</p>
          <h3 className="mt-1 text-base font-bold text-ink">{group.name}</h3>
          {!compact ? <p className="mt-1 text-sm leading-6 text-muted">{group.goal}</p> : null}
        </div>
        <ChecklistStatusBadge status={status} />
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-bold text-subtle">
          <span>Tiến độ</span>
          <span>{answered}/{group.total}</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-neutral">
          <div className="h-2 rounded-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <p className="mt-3 rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
        {missing > 0 ? group.missingPoints[0] ?? "Còn câu hỏi thiếu dữ liệu." : group.missingPoints[0] ?? "Chưa có điểm thiếu nổi bật."}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-subtle">{missing} câu thiếu dữ liệu</span>
        <Button size="sm" onClick={() => onOpen(group)}>Mở kiểm tra</Button>
      </div>
    </article>
  );
}

function ChecklistPriorityGroups({
  groups,
  priorityIds,
  answers,
  onOpen,
}: {
  groups: ChecklistGroup[];
  priorityIds: Set<string>;
  answers: AnswerMap;
  onOpen: (group: ChecklistGroup) => void;
}) {
  const priorityGroups = groups
    .filter((group) => priorityIds.has(group.id) || getDerivedGroupStatus(group, answers) === "missing_important_data" || getDerivedGroupStatus(group, answers) === "need_more_check")
    .sort((a, b) => {
      const aMissing = getGroupMissingCount(a, answers);
      const bMissing = getGroupMissingCount(b, answers);
      if (aMissing !== bMissing) return bMissing - aMissing;
      return Number(priorityIds.has(b.id)) - Number(priorityIds.has(a.id));
    })
    .slice(0, 5);

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Việc cần xử lý trước"
        description="Chỉ hiển thị nhóm thiếu dữ liệu, cần kiểm tra thêm hoặc thuộc mục tiêu ưu tiên."
      />
      <div className="grid gap-3 xl:grid-cols-2">
        {priorityGroups.map((group) => (
          <ChecklistGroupCard
            key={group.id}
            group={group}
            status={getDerivedGroupStatus(group, answers)}
            answered={getGroupAnsweredCount(group, answers)}
            missing={getGroupMissingCount(group, answers)}
            isPriority={priorityIds.has(group.id)}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}

function AllChecklistGroups({
  groups,
  priorityIds,
  answers,
  onOpen,
}: {
  groups: ChecklistGroup[];
  priorityIds: Set<string>;
  answers: AnswerMap;
  onOpen: (group: ChecklistGroup) => void;
}) {
  return (
    <details className="rounded-[4px] border border-border bg-surface">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-ink">
        Tất cả nhóm checklist · {groups.length} nhóm
      </summary>
      <div className="grid gap-3 border-t border-border-soft px-4 py-4 xl:grid-cols-2">
        {groups.map((group) => (
          <ChecklistGroupCard
            key={group.id}
            group={group}
            status={getDerivedGroupStatus(group, answers)}
            answered={getGroupAnsweredCount(group, answers)}
            missing={getGroupMissingCount(group, answers)}
            isPriority={priorityIds.has(group.id)}
            compact
            onOpen={onOpen}
          />
        ))}
      </div>
    </details>
  );
}

function ChecklistDecisionSummary({
  decision,
  onNavigate,
}: ChecklistPageProps & {
  decision: DecisionModel;
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-4">
      <Card>
        <CardHeader
          title="Bản kiểm tra trước khi đi tiếp"
          description="Kết luận tạm thời dựa trên trạng thái câu hỏi hiện tại."
          chip={<ReadinessBadge status={decision.readiness} />}
        />
        <CardBody className="space-y-4">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Kết luận</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink">
              {decision.readiness === "Tạm đủ để mô phỏng" || decision.readiness === "Sẵn sàng cho bước tiếp theo"
                ? "Có thể chuyển sang mô phỏng, nhưng vẫn cần giữ cảnh báo và mốc xem lại thesis."
                : "Chưa đủ dữ liệu để chuyển bước một cách có kỷ luật."}
            </p>
          </div>
          <SummaryBlock label="Có thể mô phỏng?" value={decision.canSimulate} />
          <SummaryBlock label="Thesis chính" value={checklistState.thesis} />
          <SummaryList title="Dữ liệu xác nhận thesis" items={checklistState.confirmingData} />
          <SummaryList title="Dữ liệu phủ định thesis" items={checklistState.disconfirmingData} warning />
          <SummaryList title="Rủi ro lớn còn thiếu" items={checklistState.missingPoints} warning />
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-xs font-bold text-ink">Hành động tiếp theo</p>
            <p className="mt-1 text-sm leading-6 text-muted">{decision.nextAction}</p>
            <div className="mt-3 grid gap-2">
              <Button onClick={() => onNavigate("risk")}>Mở module cần bổ sung</Button>
              <Button variant="secondary" onClick={() => onNavigate("journal")}>Ghi nhật ký</Button>
              <Button variant="ghost" onClick={() => onNavigate("simulation")}>Mở mô phỏng</Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </aside>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">{label}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{value}</p>
    </div>
  );
}

function SummaryList({ title, items, warning = false }: { title: string; items: string[]; warning?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">{title}</p>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <p
            key={item}
            className={cn(
              "rounded-[3px] border px-3 py-2 text-xs leading-5",
              warning ? "border-[#D6B15C] bg-[#FFF6D8] text-[#765416]" : "border-border-soft bg-surface-soft text-muted"
            )}
          >
            {item}
          </p>
        ))}
      </div>
    </div>
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

function ChecklistQuestionDrawer({
  group,
  answers,
  onAnswerChange,
  onClose,
  onNavigate,
}: {
  group: ChecklistGroup | null;
  answers: AnswerMap;
  onAnswerChange: (groupId: string, index: number, answer: QuestionAnswer) => void;
  onClose: () => void;
  onNavigate: (key: string) => void;
}) {
  if (!group) return null;

  const answered = getGroupAnsweredCount(group, answers);
  const status = getDerivedGroupStatus(group, answers);
  const progress = Math.round((answered / group.total) * 100);

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-ink/35" type="button" aria-label="Đóng kiểm tra" onClick={onClose} />
      <aside className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto border-t-[1.5px] border-border bg-page px-5 py-5 shadow-hard md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-[620px] md:border-l-[1.5px] md:border-t-0">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Drawer kiểm tra chi tiết</p>
            <h2 className="mt-1 text-lg font-bold text-ink">{group.name}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{group.goal}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onClose}>Đóng</Button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <ChecklistStatusBadge status={status} />
          {group.relatedModules.map((module) => (
            <RelatedModuleButton key={module.moduleKey} label={module.label} moduleKey={module.moduleKey} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="mb-4 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-subtle">
            <span>Tiến độ nhóm</span>
            <span>{answered}/{group.total}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-neutral">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {group.softWarning ? (
          <p className="mb-4 rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs font-semibold leading-5 text-[#765416]">
            {group.softWarning}
          </p>
        ) : null}
        <div className="grid gap-3">
          {group.questions.map((question, index) => {
            const current = answers[group.id]?.[index] ?? { note: "" };

            return (
              <div key={question} className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
                <p className="font-mono text-[11px] font-bold text-subtle">Câu {index + 1}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-ink">{question}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["available", "unsure", "missing"] as AnswerStatus[]).map((statusKey) => {
                    const isSelected = current.status === statusKey;

                    return (
                      <button
                        key={statusKey}
                        className={cn(
                          "rounded-[3px] border px-2.5 py-1 text-[11px] font-bold transition",
                          isSelected ? answerClasses[statusKey] : "border-border-soft bg-surface-soft text-muted hover:border-border hover:text-ink"
                        )}
                        type="button"
                        onClick={() => onAnswerChange(group.id, index, { ...current, status: statusKey })}
                      >
                        {answerLabels[statusKey]}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Cần xem / bằng chứng</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {group.relatedModules.map((module) => module.label).join(", ")} · ghi lại dữ liệu đã kiểm tra hoặc lý do còn nghi ngờ.
                  </p>
                  <textarea
                    className="mt-2 min-h-[72px] w-full resize-y rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-border"
                    value={current.note}
                    placeholder="Ví dụ: CFO dương nhưng khoản phải thu tăng nhanh, cần kiểm tra thêm."
                    onChange={(event) => onAnswerChange(group.id, index, { ...current, note: event.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function ChecklistDisclaimer() {
  return (
    <p className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 text-xs font-semibold leading-5 text-muted">
      Checklist là lớp kiểm soát chất lượng phân tích. Kết quả chỉ phản ánh mức độ đầy đủ của dữ liệu mock và câu trả lời hiện tại, không phải khuyến nghị giao dịch.
    </p>
  );
}

export function ChecklistPage({ onNavigate }: ChecklistPageProps) {
  const [selectedPurpose, setSelectedPurpose] = useState<ChecklistPurposeId>(checklistState.checklistPurpose);
  const [openGroup, setOpenGroup] = useState<ChecklistGroup | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>(() => getInitialAnswers(checklistState.groups));

  const selected = useMemo(
    () => checklistPurposes.find((purpose) => purpose.id === selectedPurpose) ?? checklistPurposes[0],
    [selectedPurpose]
  );
  const priorityIds = useMemo(() => new Set(selected.priorityGroupIds), [selected]);
  const decision = useMemo(
    () => getDecisionModel(checklistState.groups, priorityIds, answers),
    [answers, priorityIds]
  );

  function handleAnswerChange(groupId: string, index: number, answer: QuestionAnswer) {
    setAnswers((current) => ({
      ...current,
      [groupId]: {
        ...current[groupId],
        [index]: answer,
      },
    }));
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5">
      <DecisionStatusBar purposeLabel={selected.label} decision={decision} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <ChecklistPurposeTabs selectedPurpose={selectedPurpose} onSelect={setSelectedPurpose} />
          <ChecklistPriorityGroups
            groups={checklistState.groups}
            priorityIds={priorityIds}
            answers={answers}
            onOpen={setOpenGroup}
          />
          <AllChecklistGroups
            groups={checklistState.groups}
            priorityIds={priorityIds}
            answers={answers}
            onOpen={setOpenGroup}
          />
          <ChecklistDisclaimer />
        </main>
        <ChecklistDecisionSummary decision={decision} onNavigate={onNavigate} />
      </div>
      <ChecklistQuestionDrawer
        group={openGroup}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        onClose={() => setOpenGroup(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
