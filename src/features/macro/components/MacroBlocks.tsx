"use client";

import { useMemo, useState } from "react";
import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type {
  MacroAction,
  MacroDataMeta,
  MacroInsightCardData,
  MacroJourneyData,
  MacroSectorImpactGroup,
  MacroSnapshotData,
  MacroThesisBuilderData,
  MacroThesisDraft,
  MacroTone,
  MacroTransmissionChain,
} from "../types";

type MacroNavigate = (moduleKey: string) => void;

type MacroActionButtonProps = {
  action: MacroAction;
  onNavigate?: MacroNavigate;
};

const toneLabel: Record<MacroTone, string> = {
  support: "Hỗ trợ",
  pressure: "Gây áp lực",
  neutral: "Trung tính",
  watch: "Cần theo dõi",
  mixed: "Dữ liệu trái chiều",
};

const toneChipVariant: Record<
  MacroTone,
  "neutral" | "accent" | "success" | "warning" | "danger"
> = {
  support: "success",
  pressure: "danger",
  neutral: "neutral",
  watch: "warning",
  mixed: "accent",
};

const tonePanelClasses: Record<MacroTone, string> = {
  support: "border-accent-green/60 bg-accent-green/5",
  pressure: "border-danger/60 bg-danger/5",
  neutral: "border-border-soft bg-neutral/45",
  watch: "border-warning/70 bg-warning/10",
  mixed: "border-border bg-accent-soft/45",
};

const moduleLabels: Record<string, string> = {
  macro: "Vĩ mô",
  industry: "Ngành",
  financials: "BCTC",
  valuation: "Định giá",
  risk: "Rủi ro",
};

function MacroActionButton({ action, onNavigate }: MacroActionButtonProps) {
  const variant = action.variant ?? "secondary";

  return (
    <Button
      size="sm"
      variant={variant}
      onClick={() => {
        if (action.targetModule !== "macro") {
          onNavigate?.(action.targetModule);
        }
      }}
    >
      {action.label}
    </Button>
  );
}

function MetaLine({ meta }: { meta: MacroDataMeta }) {
  const statusLabel: Record<MacroDataMeta["status"], string> = {
    mock: "Mock data",
    placeholder: "Placeholder",
    stale: "Cần cập nhật",
    fresh: "Đã cập nhật",
  };

  return (
    <div className="grid gap-1 border-t border-border-soft pt-3 text-[11px] leading-4 text-subtle sm:grid-cols-4">
      <span>Nguồn: {meta.source}</span>
      <span>Kỳ: {meta.period}</span>
      <span>Cập nhật: {meta.updatedAt}</span>
      <span>Trạng thái: {statusLabel[meta.status]}</span>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Chip key={item} size="sm">
          {item}
        </Chip>
      ))}
    </div>
  );
}

function MiniList({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
        {title}
      </p>
      <ul className="grid gap-1.5 text-xs leading-5 text-muted">
        {items.map((item) => (
          <li key={item} className="rounded-[3px] bg-surface-soft px-2 py-1">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MacroHeader({
  overview,
}: {
  overview: MacroJourneyData["overview"];
}) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.04em] text-accent">
          <span className="grid h-7 w-7 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft text-[10px] font-bold text-accent">
            {overview.icon}
          </span>
          <span>{overview.eyebrow}</span>
        </div>
        <AnalysisNotePopover
          contextTitle={overview.title}
          moduleId="macro"
          moduleName="Vĩ mô"
          noteType="assumption"
        />
      </div>
      <h1 className="font-brand text-2xl font-bold text-ink sm:text-3xl">
        {overview.title}
      </h1>
      <p className="mt-2 max-w-[760px] text-sm leading-7 text-muted">
        {overview.description}
      </p>
      <div className="mt-4 rounded-[4px] border border-border-soft bg-accent-soft/60 px-4 py-3 text-sm font-semibold leading-6 text-ink">
        {overview.centralQuestion}
      </div>
    </div>
  );
}

export function MacroSnapshot({
  data,
}: {
  data: MacroSnapshotData;
  onNavigate?: MacroNavigate;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
              {data.eyebrow}
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">{data.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{data.description}</p>
          </div>
          <Chip variant={toneChipVariant[data.stateTone]}>{data.currentState}</Chip>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
          <h3 className="text-sm font-bold text-ink">Ba điểm hỗ trợ</h3>
          <div className="mt-3 grid gap-2">
            {data.supportPoints.map((point) => (
              <div
                key={point.label}
                className={cn("rounded-[4px] border px-3 py-2", tonePanelClasses[point.tone])}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs text-ink">{point.label}</strong>
                  <Chip size="sm" variant={toneChipVariant[point.tone]}>
                    {toneLabel[point.tone]}
                  </Chip>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{point.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
          <h3 className="text-sm font-bold text-ink">Ba điểm gây áp lực</h3>
          <div className="mt-3 grid gap-2">
            {data.pressurePoints.map((point) => (
              <div
                key={point.label}
                className={cn("rounded-[4px] border px-3 py-2", tonePanelClasses[point.tone])}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs text-ink">{point.label}</strong>
                  <Chip size="sm" variant={toneChipVariant[point.tone]}>
                    {toneLabel[point.tone]}
                  </Chip>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{point.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
          <h3 className="text-sm font-bold text-ink">Dữ liệu chưa xác nhận</h3>
          <div className="mt-3 grid gap-2">
            {data.unconfirmedData.map((point) => (
              <div
                key={point.label}
                className={cn("rounded-[4px] border px-3 py-2", tonePanelClasses[point.tone])}
              >
                <strong className="text-xs text-ink">{point.label}</strong>
                <p className="mt-1 text-xs leading-5 text-muted">{point.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
          <MiniList items={data.nextQuestions} title="Câu hỏi cần trả lời tiếp" />
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
            Ngành cần xem tiếp
          </p>
          <ChipList items={data.affectedSectors} />
        </div>
      </div>

      <MetaLine meta={data.meta} />
    </div>
  );
}

export function MacroTransmissionMap({
  chains,
}: {
  chains: MacroTransmissionChain[];
}) {
  return (
    <div className="grid gap-4">
      {chains.map((chain) => (
        <article
          key={chain.id}
          className={cn("rounded-[4px] border-[1.5px] bg-surface px-4 py-4", tonePanelClasses[chain.tone])}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-ink">{chain.title}</h3>
              <p className="mt-1 text-xs font-semibold text-subtle">
                Biến vĩ mô: {chain.macroVariable}
              </p>
            </div>
            <Chip variant={toneChipVariant[chain.tone]}>{toneLabel[chain.tone]}</Chip>
          </div>

          <div className="mt-4 rounded-[4px] border border-border-soft bg-surface px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
              Nói dễ hiểu
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">{chain.simpleMeaning}</p>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            {chain.impactChannel.map((step, index) => (
              <div
                key={`${chain.id}-${step}`}
                className="min-h-[92px] rounded-[4px] border border-border-soft bg-surface px-3 py-3"
              >
                <span className="font-mono text-[11px] font-bold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-xs font-semibold leading-5 text-ink">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <MiniList items={chain.relatedSectors} title="Ngành liên quan" />
            <MiniList items={chain.verificationData} title="Dữ liệu cần kiểm chứng" />
            <MiniList items={chain.linkedModules} title="Module cần đi tiếp" />
          </div>
          <div className="mt-4">
            <MetaLine meta={chain.meta} />
          </div>
        </article>
      ))}
    </div>
  );
}

export function MacroInsightCard({
  insight,
  onNavigate,
}: {
  insight: MacroInsightCardData;
  onNavigate?: MacroNavigate;
}) {
  return (
    <article
      className={cn("flex h-full flex-col rounded-[4px] border-[1.5px] bg-surface px-4 py-4", tonePanelClasses[insight.tone])}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">{insight.title}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-muted">
            {insight.question}
          </p>
        </div>
        <Chip variant={toneChipVariant[insight.tone]}>{insight.status}</Chip>
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
            Nói dễ hiểu
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">{insight.simpleMeaning}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
            Kênh truyền dẫn
          </p>
          <p className="mt-1 rounded-[3px] bg-surface px-3 py-2 text-xs font-semibold leading-5 text-ink">
            {insight.transmission}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniList items={insight.relatedSectors} title="Ngành liên quan" />
          <MiniList items={insight.verificationData} title="Cần kiểm chứng" />
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
            Module liên kết
          </p>
          <ChipList items={insight.linkedModules} />
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {insight.actions.map((action) => (
            <MacroActionButton
              key={action.label}
              action={action}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        <MetaLine meta={insight.meta} />
      </div>
    </article>
  );
}

export function MacroInsightGrid({
  insights,
  onNavigate,
}: {
  insights: MacroInsightCardData[];
  onNavigate?: MacroNavigate;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {insights.map((insight) => (
        <MacroInsightCard
          key={insight.id}
          insight={insight}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export function MacroSectorImpactMap({
  groups,
  onNavigate,
}: {
  groups: MacroSectorImpactGroup[];
  onNavigate?: MacroNavigate;
}) {
  return (
    <div className="grid gap-4">
      <div className="rounded-[4px] border border-border-soft bg-accent-soft/50 px-4 py-3 text-sm leading-6 text-ink">
        “Hưởng lợi” không có nghĩa là có thể chuyển thành hành động giao dịch trong ngành đó. Cần
        kiểm chứng bằng dữ liệu ngành, BCTC, định giá và rủi ro.
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <section
            key={group.id}
            className={cn("rounded-[4px] border-[1.5px] bg-surface px-4 py-4", tonePanelClasses[group.tone])}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink">{group.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted">{group.description}</p>
              </div>
              <Chip variant={toneChipVariant[group.tone]}>{toneLabel[group.tone]}</Chip>
            </div>

            <div className="mt-4 grid gap-3">
              {group.items.map((item) => (
                <article
                  key={item.sector}
                  className="rounded-[4px] border border-border-soft bg-surface px-3 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-ink">{item.sector}</h4>
                      <p className="mt-1 text-xs leading-5 text-muted">{item.reason}</p>
                    </div>
                    <Chip size="sm" variant="neutral">
                      {item.horizon}
                    </Chip>
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    <MiniList items={item.macroVariables} title="Biến vĩ mô" />
                    <MiniList items={item.verificationData} title="Cần xác nhận" />
                    <MiniList items={item.risks} title="Rủi ro cần lưu ý" />
                  </div>
                  <div className="mt-3">
                    <MacroActionButton
                      action={item.action}
                      onNavigate={onNavigate}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function MacroDisclaimer({
  content,
  title,
}: MacroJourneyData["disclaimer"]) {
  return (
    <Card>
      <CardHeader
        chip={<Chip variant="warning">Cần kiểm chứng</Chip>}
        title={title}
      />
      <CardBody>
        <p className="text-sm leading-7 text-muted">{content}</p>
      </CardBody>
    </Card>
  );
}

export function MacroInsightPanel({
  data,
}: {
  data: MacroJourneyData;
}) {
  const topSectors = data.sectorImpactGroups.flatMap((group) =>
    group.items.slice(0, 1).map((item) => item.sector)
  );

  return (
    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
      <Card>
        <CardHeader title="Ngành nên kiểm chứng tiếp" />
        <CardBody>
          <ChipList items={topSectors} />
        </CardBody>
      </Card>
    </aside>
  );
}

export function MacroThesisBuilder({
  data,
}: {
  data: MacroThesisBuilderData;
  onNavigate?: MacroNavigate;
}) {
  const [draft, setDraft] = useState<MacroThesisDraft>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const answeredQuestions = useMemo(
    () =>
      data.questions
        .map((question) => ({
          id: question.id,
          label: question.label,
          prompt: question.prompt,
          answer: draft[question.id],
        }))
        .filter((answer) => answer.answer),
    [data.questions, draft]
  );
  const currentQuestion = data.questions[currentIndex];
  const currentAnswer = currentQuestion ? draft[currentQuestion.id] : undefined;
  const isComplete = answeredQuestions.length === data.questions.length;
  const understandingLevel =
    answeredQuestions.length === 0
      ? "Chưa có dữ liệu"
      : isComplete
        ? "Đã hoàn thành bộ trắc nghiệm"
        : "Đang ghi nhận mức hiểu biết";

  function handleSelect(questionId: string, optionId: string) {
    const question = data.questions.find((item) => item.id === questionId);
    const option = question?.options.find((item) => item.id === optionId);

    if (!question || !option) {
      return;
    }

    setDraft((current) => ({
      ...current,
      [questionId]: option,
    }));

    const questionIndex = data.questions.findIndex((item) => item.id === questionId);
    if (questionIndex >= 0 && questionIndex < data.questions.length - 1) {
      setCurrentIndex(questionIndex + 1);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-ink">{data.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{data.description}</p>
          </div>
          <Chip variant="accent">
            {data.questions.length} câu kiểm tra nhanh
          </Chip>
        </div>

        <div className="mt-4 rounded-[4px] border border-border-soft bg-accent-soft/45 px-3 py-3 text-xs leading-5 text-muted">
          {data.tutorRule}
        </div>

        {currentQuestion ? (
          <div className="mt-4 rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
                  {currentQuestion.label} / {data.questions.length}
                </p>
                <h4 className="mt-1 text-lg font-bold leading-6 text-ink">
                  {currentQuestion.prompt}
                </h4>
              </div>
              <Chip variant={currentAnswer ? "success" : "warning"}>
                {currentAnswer ? "Đã trả lời" : "Chọn 1 đáp án"}
              </Chip>
            </div>

            <div className="mt-4 grid gap-2">
              {currentQuestion.options.map((option) => {
                const isSelected = currentAnswer?.id === option.id;

                return (
                  <button
                    key={option.id}
                    className={cn(
                      "rounded-[4px] border-[1.5px] px-3 py-3 text-left text-sm font-semibold leading-6 transition active:translate-y-[1px]",
                      isSelected
                        ? "border-border bg-accent-soft text-ink shadow-hard-sm"
                        : "border-border-soft bg-surface text-muted hover:border-border hover:bg-surface-hover hover:text-ink"
                    )}
                    type="button"
                    onClick={() => handleSelect(currentQuestion.id, option.id)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {currentAnswer ? (
              <div className="mt-4 rounded-[4px] border border-border-soft bg-surface px-3 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
                  Phản hồi học tập
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {currentAnswer.tutorNote}
                </p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={currentIndex === 0}
                size="sm"
                variant="secondary"
                onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              >
                Câu trước
              </Button>
              <Button
                disabled={!currentAnswer || currentIndex >= data.questions.length - 1}
                size="sm"
                variant="secondary"
                onClick={() =>
                  setCurrentIndex((index) =>
                    Math.min(data.questions.length - 1, index + 1)
                  )
                }
              >
                Câu tiếp theo
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
                Hệ thống ghi nhận
              </p>
              <p className="mt-1 text-sm font-bold text-ink">{understandingLevel}</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Sau mỗi câu trả lời, hệ thống lưu lựa chọn và phản hồi để ước lượng
                bạn đang hiểu bối cảnh vĩ mô đến đâu. Kết quả này dùng cho gợi ý học
                tập và câu hỏi tiếp theo, không tạo bản nhận định cá nhân.
              </p>
            </div>
            <Chip variant={answeredQuestions.length ? "accent" : "neutral"}>
              {answeredQuestions.length}/{data.questions.length}
            </Chip>
          </div>

          {isComplete ? (
            <div className="mt-3 rounded-[4px] border border-border-soft bg-accent-soft/60 px-3 py-3 text-xs leading-5 text-ink">
              Bạn đã hoàn thành bộ trắc nghiệm vĩ mô. Hệ thống đã ghi nhận hồ sơ
              hiểu biết của bạn để dùng cho các module tiếp theo.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function MacroModuleBadge({ moduleKey }: { moduleKey: string }) {
  return <Chip size="sm">{moduleLabels[moduleKey] ?? moduleKey}</Chip>;
}
