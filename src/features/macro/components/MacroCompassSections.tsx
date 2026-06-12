"use client";

import { useMemo, useState } from "react";
import { Button, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type {
  MacroAffectedSector,
  MacroCompassAction,
  MacroCompassData,
  MacroCompassMetric,
  MacroCompassTone,
  MacroEarlyWarning,
  MacroTermDefinition,
  MacroTransmissionPath,
} from "../types";

type MacroNavigate = (moduleKey: string) => void;

const toneLabel: Record<MacroCompassTone, string> = {
  support: "Hỗ trợ",
  pressure: "Áp lực",
  watch: "Cần theo dõi",
  neutral: "Chưa đủ dữ liệu",
  mixed: "Trái chiều",
};

const toneChip: Record<MacroCompassTone, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  support: "success",
  pressure: "danger",
  watch: "warning",
  neutral: "neutral",
  mixed: "accent",
};

const toneClass: Record<MacroCompassTone, string> = {
  support: "border-accent-green/50 bg-accent-green/5",
  pressure: "border-danger/50 bg-danger/5",
  watch: "border-warning/70 bg-warning/10",
  neutral: "border-border-soft bg-neutral/50",
  mixed: "border-border bg-accent-soft/45",
};

function MacroActionButton({
  action,
  onNavigate,
}: {
  action: MacroCompassAction;
  onNavigate?: MacroNavigate;
}) {
  return (
    <Button
      size="sm"
      variant={action.variant ?? "secondary"}
      onClick={() => {
        if (action.targetAnchor) {
          document.getElementById(action.targetAnchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (action.targetModule) {
          onNavigate?.(action.targetModule);
        }
      }}
    >
      {action.label}
    </Button>
  );
}

export function MacroTermTooltip({
  termIds,
  terms,
}: {
  termIds: string[];
  terms: MacroTermDefinition[];
}) {
  const termMap = useMemo(() => new Map(terms.map((term) => [term.id, term])), [terms]);
  const visibleTerms = termIds.map((id) => termMap.get(id)).filter(Boolean);

  if (!visibleTerms.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleTerms.map((term) =>
        term ? (
          <details key={term.id} className="group relative">
            <summary className="list-none">
              <Chip size="sm" variant="neutral">
                {term.label}
              </Chip>
            </summary>
            <p className="mt-2 max-w-[260px] rounded-[4px] border border-border-soft bg-surface p-3 text-xs leading-5 text-muted shadow-hard-sm">
              {term.definition}
            </p>
          </details>
        ) : null
      )}
    </div>
  );
}

export function MacroCurrentPicture({
  data,
  onNavigate,
}: {
  data: MacroCompassData["currentPicture"];
  onNavigate?: MacroNavigate;
}) {
  return (
    <section className="rounded-[8px] border-[1.5px] border-border bg-canvas shadow-hard">
      <div className="border-b border-border-soft p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-ink">Bức tranh vĩ mô hiện tại</h2>
            <p className="mt-2 max-w-[760px] text-sm leading-6 text-muted">{data.summary}</p>
          </div>
          <Chip variant={toneChip[data.tone]}>{data.state}</Chip>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-4">
          <PanelList title="Ba lực hỗ trợ chính" items={data.supports} />
          <PanelList title="Dữ liệu chưa xác nhận" items={data.unconfirmed} />
        </div>
        <div className="grid gap-4">
          <PanelList title="Ba lực gây áp lực chính" items={data.pressures} />
          <div className="rounded-[6px] border border-border-soft bg-surface p-4">
            <h3 className="text-sm font-extrabold text-ink">Bước tiếp theo</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.actions.map((action) => (
                <MacroActionButton key={action.label} action={action} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PanelList({
  items,
  title,
}: {
  items: MacroCompassData["currentPicture"]["supports"];
  title: string;
}) {
  return (
    <article className="rounded-[6px] border border-border-soft bg-surface p-4">
      <h3 className="text-sm font-extrabold text-ink">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item.label} className={cn("rounded-[5px] border p-3", toneClass[item.tone])}>
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm text-ink">{item.label}</strong>
              <Chip size="sm" variant={toneChip[item.tone]}>
                {toneLabel[item.tone]}
              </Chip>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">{item.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function MacroTransmissionSection({
  paths,
  terms,
}: {
  paths: MacroTransmissionPath[];
  terms: MacroTermDefinition[];
}) {
  return (
    <section className="space-y-4">
      <SectionIntro
        id="transmission"
        question="Yếu tố này truyền sang thị trường bằng cách nào?"
        title="Bản đồ truyền dẫn vĩ mô"
        description="Mỗi chuỗi chỉ giữ 4-5 mắt xích để thấy biến vĩ mô đi qua tỷ giá, dòng vốn, ngành và dữ liệu cần kiểm tra ra sao."
      />
      <div className="grid gap-4">
        {paths.map((path) => (
          <article key={path.id} className={cn("rounded-[8px] border-[1.5px] bg-surface p-4", toneClass[path.tone])}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-extrabold text-ink">{path.title}</h3>
                <div className="mt-2">
                  <MacroTermTooltip termIds={path.termIds} terms={terms} />
                </div>
              </div>
              <Chip variant={toneChip[path.tone]}>{toneLabel[path.tone]}</Chip>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
              {path.steps.map((step, index) => (
                <div key={`${path.id}-${step.label}-${index}`} className="rounded-[5px] border border-border-soft bg-canvas p-3">
                  <p className="text-[11px] font-bold uppercase text-subtle">{step.label}</p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-ink">{step.text}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function WorldContextSection({ metrics }: { metrics: MacroCompassMetric[] }) {
  return (
    <MetricSection
      description="Chỉ giữ các biến quốc tế có đường truyền rõ tới tỷ giá, dòng vốn, xuất khẩu hoặc chi phí đầu vào của Việt Nam."
      id="world-context"
      metrics={metrics}
      question="Thế giới đang hỗ trợ hay gây áp lực cho Việt Nam?"
      title="Bối cảnh thế giới"
    />
  );
}

export function VietnamContextSection({ metrics }: { metrics: MacroCompassMetric[] }) {
  const groups = [
    { id: "growth", label: "Tăng trưởng và sản xuất" },
    { id: "inflation", label: "Lạm phát và lãi suất" },
    { id: "currency", label: "Tỷ giá và dòng vốn" },
    { id: "policy", label: "Chính sách và đầu tư công" },
  ];
  const [activeGroup, setActiveGroup] = useState(groups[0].id);
  const visibleMetrics = metrics.filter((metric) => metric.group === activeGroup);

  return (
    <section className="space-y-4">
      <SectionIntro
        id="vietnam-context"
        question="Trong nước đang mạnh, yếu hay trái chiều ở điểm nào?"
        title="Bối cảnh Việt Nam"
        description="Nhóm chỉ số theo chủ đề để người mới không phải đọc một bảng kinh tế dày đặc."
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {groups.map((group) => (
          <button
            key={group.id}
            className={cn(
              "shrink-0 rounded-[4px] border px-3 py-2 text-xs font-bold transition",
              activeGroup === group.id
                ? "border-border bg-accent text-ink shadow-hard-sm"
                : "border-border-soft bg-surface text-muted hover:border-border hover:text-ink"
            )}
            type="button"
            onClick={() => setActiveGroup(group.id)}
          >
            {group.label}
          </button>
        ))}
      </div>
      <MetricGrid metrics={visibleMetrics} />
    </section>
  );
}

function MetricSection({
  description,
  id,
  metrics,
  question,
  title,
}: {
  description: string;
  id: string;
  metrics: MacroCompassMetric[];
  question: string;
  title: string;
}) {
  return (
    <section className="space-y-4">
      <SectionIntro id={id} question={question} title={title} description={description} />
      <MetricGrid metrics={metrics} />
    </section>
  );
}

function MetricGrid({ metrics }: { metrics: MacroCompassMetric[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {metrics.map((metric) => (
        <article key={metric.id} className={cn("rounded-[8px] border-[1.5px] bg-surface p-4", toneClass[metric.tone])}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-ink">{metric.name}</h3>
              <p className="mt-1 text-sm font-bold text-ink">{metric.value}</p>
            </div>
            <Chip variant={toneChip[metric.tone]}>{metric.status}</Chip>
          </div>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-muted">
            <p>
              <span className="font-bold text-ink">Cách hiểu đơn giản: </span>
              {metric.simpleMeaning}
            </p>
            <p>
              <span className="font-bold text-ink">Tác động đến thị trường: </span>
              {metric.marketImpact}
            </p>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer list-none text-xs font-bold text-ink underline-offset-4 hover:underline">
              Xem ngành liên quan và độ tin cậy
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <MiniBlock title="Ngành cần chú ý" items={metric.relatedSectors} />
              <div className="rounded-[4px] border border-border-soft bg-canvas p-3 text-xs leading-5 text-muted">
                <strong className="text-ink">Trạng thái dữ liệu: </strong>
                {metric.confidence}
              </div>
            </div>
          </details>
        </article>
      ))}
    </div>
  );
}

export function AffectedSectorsSection({
  onNavigate,
  sectors,
}: {
  sectors: MacroAffectedSector[];
  onNavigate?: MacroNavigate;
}) {
  return (
    <section id="affected-sectors" className="scroll-mt-6 space-y-4">
      <SectionIntro
        question="Ngành nào bị ảnh hưởng nhiều nhất?"
        title="Ngành nào bị ảnh hưởng?"
        description="Đây là cầu nối sang module Phân tích ngành: không chỉ nói ngành hưởng lợi hay bất lợi, mà giải thích cơ chế và điều cần kiểm tra tiếp."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {sectors.map((sector) => (
          <article key={sector.id} className={cn("rounded-[8px] border-[1.5px] bg-surface p-4", toneClass[sector.tone])}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-ink">{sector.sector}</h3>
                <p className="mt-1 text-xs font-bold text-muted">{sector.group}</p>
              </div>
              <Chip variant={toneChip[sector.tone]}>{sector.impactLevel}</Chip>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <p>
                <span className="font-bold text-ink">Yếu tố tác động: </span>
                {sector.macroDriver}
              </p>
              <p>
                <span className="font-bold text-ink">Cơ chế: </span>
                {sector.mechanism}
              </p>
              <p>
                <span className="font-bold text-ink">Cần kiểm tra tiếp: </span>
                {sector.nextCheck}
              </p>
            </div>
            <Button className="mt-4" size="sm" variant="secondary" onClick={() => onNavigate?.("industry")}>
              Phân tích ngành này
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function EarlyWarningSection({ warnings }: { warnings: MacroEarlyWarning[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleWarnings = showAll ? warnings : warnings.filter((warning) => warning.isPrimary);

  return (
    <section id="early-warning" className="scroll-mt-6 space-y-4">
      <SectionIntro
        question="Cảnh báo nào cần theo dõi trước?"
        title="Tín hiệu cảnh báo sớm"
        description="Màn hình chính chỉ giữ 3 cảnh báo quan trọng nhất. Các cảnh báo khác nằm trong phần mở rộng."
      />
      <div className="grid gap-4">
        {visibleWarnings.map((warning) => (
          <WarningCard key={warning.id} warning={warning} />
        ))}
      </div>
      <Button size="sm" variant="secondary" onClick={() => setShowAll((value) => !value)}>
        {showAll ? "Thu gọn cảnh báo" : "Xem thêm cảnh báo"}
      </Button>
    </section>
  );
}

function WarningCard({ warning }: { warning: MacroEarlyWarning }) {
  return (
    <article className={cn("rounded-[8px] border-[1.5px] bg-surface p-4", toneClass[warning.tone])}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-ink">{warning.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{warning.why}</p>
        </div>
        <Chip variant={toneChip[warning.tone]}>{warning.level}</Chip>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <InfoBox title="Dữ liệu đang xác nhận" text={warning.confirmingData} />
        <MiniBlock title="Ngành/cổ phiếu có thể bị ảnh hưởng" items={warning.affected} />
        <InfoBox title="Nên làm gì tiếp" text={warning.nextAction} />
      </div>
    </article>
  );
}

export function MacroConclusionPanel({
  data,
  onNavigate,
}: {
  data: MacroCompassData["conclusion"];
  onNavigate?: MacroNavigate;
}) {
  return (
    <section className="rounded-[8px] border-[1.5px] border-border bg-canvas p-5 shadow-hard">
      <h2 className="text-xl font-extrabold text-ink">Kết luận vĩ mô có điều kiện</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Kết luận này giúp biết nên làm gì tiếp, không yêu cầu tự xây thesis hay trả lời quiz phức tạp.
      </p>
      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        {data.blocks.map((block) => (
          <article key={block.title} className={cn("rounded-[6px] border p-4", toneClass[block.tone])}>
            <h3 className="text-sm font-extrabold text-ink">{block.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{block.content}</p>
          </article>
        ))}
      </div>
      <p className="mt-5 rounded-[5px] border border-warning bg-warning/10 p-4 text-sm font-semibold leading-6 text-ink">
        {data.warning}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {data.actions.map((action) => (
          <MacroActionButton key={action.label} action={action} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

function SectionIntro({
  description,
  id,
  question,
  title,
}: {
  description: string;
  id?: string;
  question: string;
  title: string;
}) {
  return (
    <div id={id} className="scroll-mt-6">
      <p className="text-xs font-bold uppercase text-muted">{question}</p>
      <h2 className="mt-1 text-xl font-extrabold text-ink">{title}</h2>
      <p className="mt-2 max-w-[780px] text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

function MiniBlock({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-canvas p-3">
      <p className="text-[11px] font-bold uppercase text-subtle">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Chip key={item} size="sm" variant="neutral">
            {item}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function InfoBox({ text, title }: { text: string; title: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-canvas p-3">
      <p className="text-[11px] font-bold uppercase text-subtle">{title}</p>
      <p className="mt-2 text-xs leading-5 text-muted">{text}</p>
    </div>
  );
}
