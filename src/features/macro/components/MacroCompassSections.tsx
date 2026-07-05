"use client";

import { useMemo, useState } from "react";
import { Button, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  formatMacroCompassMetricValue,
  macroCompassMetricStatusLabel,
} from "../lib/macro-compass-data-contract";
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

const coreMetricIds = ["gdp", "cpi", "domestic-rate", "usd-vnd", "exports", "credit-growth"];

const currentPictureMetricIds: Record<string, string> = {
  "Tăng trưởng GDP": "gdp",
  GDP: "gdp",
  CPI: "cpi",
  "Lãi suất": "domestic-rate",
  "Lãi suất trong nước": "domestic-rate",
  "USD/VND": "usd-vnd",
  "Tín dụng": "credit-growth",
  "Tăng trưởng tín dụng": "credit-growth",
  PMI: "pmi",
  "Dòng vốn ngoại": "foreign-flow",
  "Đầu tư công": "public-investment",
};

type CoreMetricReadingRole = {
  step: string;
  role: string;
  question: string;
  whyFirst: string;
};

const coreMetricReadingRoles: Record<string, CoreMetricReadingRole> = {
  gdp: {
    step: "Bước 1",
    role: "Nền tăng trưởng",
    question: "Kinh tế đang mở rộng hay chậm lại?",
    whyFirst: "GDP cho biết bức tranh nhu cầu chung trước khi nhìn sang từng ngành hoặc từng cổ phiếu.",
  },
  cpi: {
    step: "Bước 2",
    role: "Áp lực giá cả",
    question: "Tăng trưởng có bị lạm phát bóp lại không?",
    whyFirst: "CPI cho biết sức mua, chi phí đầu vào và rủi ro lãi suất có đang căng hay không.",
  },
  "domestic-rate": {
    step: "Bước 3",
    role: "Chi phí vốn",
    question: "Tiền trong nền kinh tế đang rẻ hay đắt?",
    whyFirst: "Lãi suất ảnh hưởng trực tiếp tới chi phí vay, định giá tài sản và sức chịu đựng của doanh nghiệp.",
  },
  "usd-vnd": {
    step: "Bước 4",
    role: "Áp lực tỷ giá",
    question: "Tỷ giá có tạo thêm áp lực lên chi phí hoặc dòng vốn không?",
    whyFirst: "USD/VND giúp kiểm tra áp lực nhập khẩu, nợ ngoại tệ, tâm lý vốn ngoại và chính sách tiền tệ.",
  },
  exports: {
    step: "Bước 5",
    role: "Cầu bên ngoài",
    question: "Đơn hàng thế giới có đang hỗ trợ Việt Nam không?",
    whyFirst: "Xuất khẩu xác nhận phần cầu bên ngoài, nhất là với sản xuất, logistics và khu công nghiệp.",
  },
  "credit-growth": {
    step: "Bước 6",
    role: "Dòng vốn trong nước",
    question: "Tín dụng có thật sự đi vào nền kinh tế không?",
    whyFirst: "Tín dụng giúp kiểm tra nội cầu và điều kiện vốn sau khi đã nhìn tăng trưởng, giá cả và tỷ giá.",
  },
};

const metricGroupLabel: Record<MacroCompassMetric["group"], string> = {
  world: "Thế giới",
  growth: "Tăng trưởng",
  inflation: "Lạm phát / lãi suất",
  currency: "Tỷ giá / dòng vốn",
  policy: "Chính sách",
};

type IndicatorReadingGroup = {
  id: string;
  title: string;
  question: string;
  description: string;
  codes: string[];
};

const indicatorReadingGroups: IndicatorReadingGroup[] = [
  {
    id: "domestic-engine",
    title: "1. Sức khỏe nền kinh tế",
    question: "Nền kinh tế đang mở rộng hay chậm lại?",
    description:
      "Đọc trước để biết nền nhu cầu chung. Nhóm này chưa nói cổ phiếu nào tốt, chỉ cho biết bối cảnh tăng trưởng có thuận hay không.",
    codes: ["GDP_GROWTH", "PMI_MANUFACTURING", "EXPORT_GROWTH", "CREDIT_GROWTH", "PUBLIC_INVESTMENT"],
  },
  {
    id: "cost-of-money",
    title: "2. Áp lực chi phí vốn và giá cả",
    question: "Doanh nghiệp có thể chịu sức ép từ lạm phát, lãi vay hoặc tỷ giá không?",
    description:
      "Đọc sau tăng trưởng để tránh hiểu nhầm: tăng trưởng tốt nhưng chi phí vốn, chi phí đầu vào hoặc tỷ giá căng thì tác động lên từng ngành sẽ rất khác.",
    codes: ["CPI_YOY", "POLICY_RATE", "USD_VND"],
  },
  {
    id: "market-money",
    title: "3. Dòng tiền trên thị trường",
    question: "Dòng tiền vào thị trường đang khỏe hay yếu?",
    description:
      "Nhóm này chỉ dùng để hiểu thanh khoản và tâm lý thị trường, không dùng như tín hiệu mua bán.",
    codes: ["MARKET_TRADING_VALUE", "FOREIGN_NET_FLOW"],
  },
  {
    id: "global-pressure",
    title: "4. Yếu tố thế giới chỉ xem khi có liên quan",
    question: "Bối cảnh bên ngoài có đang tạo áp lực lên tỷ giá, chi phí đầu vào hoặc dòng vốn không?",
    description:
      "Không cần đọc nhóm này đầu tiên. Chỉ mở khi USD/VND, giá năng lượng hoặc dòng vốn đang là vấn đề cần kiểm tra.",
    codes: ["FED_FUNDS_RATE", "DXY", "BRENT_OIL_PRICE"],
  },
];

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
  metrics,
  onNavigate,
}: {
  data: MacroCompassData["currentPicture"];
  metrics: MacroCompassMetric[];
  onNavigate?: MacroNavigate;
}) {
  const metricMap = useMemo(() => new Map(metrics.map((metric) => [metric.id, metric])), [metrics]);

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
          <PanelList
            metricMap={metricMap}
            title="Ba lực hỗ trợ chính"
            items={data.supports}
          />
          <PanelList
            metricMap={metricMap}
            title="Dữ liệu chưa xác nhận"
            items={data.unconfirmed}
          />
        </div>
        <div className="grid gap-4">
          <PanelList
            metricMap={metricMap}
            title="Ba lực gây áp lực chính"
            items={data.pressures}
          />
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

      <MacroCurrentPictureEvidence metrics={metrics} />
    </section>
  );
}

function MacroCurrentPictureEvidence({ metrics }: { metrics: MacroCompassMetric[] }) {
  const visibleMetrics = useCoreMacroMetrics(metrics);

  if (!visibleMetrics.length) return null;

  return (
    <div id="core-indicators" className="scroll-mt-6 border-t border-border-soft p-5">
      <div className="rounded-[8px] border-[1.5px] border-border bg-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[820px]">
            <p className="text-xs font-bold uppercase text-muted">Dữ liệu giải thích cho bức tranh trên</p>
            <h3 className="mt-1 text-lg font-extrabold text-ink">6 câu hỏi vĩ mô đầu tiên</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Hệ thống không chọn 6 chỉ số này để học thuộc. Đây là luồng kiểm tra tối thiểu:
              tăng trưởng có khỏe không, giá cả và chi phí vốn có bóp lại không, tỷ giá có tạo áp lực không,
              rồi xuất khẩu và tín dụng có xác nhận bức tranh đó không.
            </p>
          </div>
          <Chip variant="neutral">Bằng chứng nền</Chip>
        </div>

        <CoreMacroReadingFlow metrics={visibleMetrics} />
      </div>
    </div>
  );
}

function PanelList({
  items,
  metricMap,
  title,
}: {
  items: MacroCompassData["currentPicture"]["supports"];
  metricMap: Map<string, MacroCompassMetric>;
  title: string;
}) {
  return (
    <article className="rounded-[6px] border border-border-soft bg-surface p-4">
      <h3 className="text-sm font-extrabold text-ink">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.map((item) => {
          const metricId = currentPictureMetricIds[item.label];
          const linkedMetric = metricId ? metricMap.get(metricId) : null;
          const content = (
            <>
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm text-ink">{item.label}</strong>
                <Chip size="sm" variant={toneChip[item.tone]}>
                  {toneLabel[item.tone]}
                </Chip>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted">{item.value}</p>
              {linkedMetric ? (
                <p className="mt-2 text-[11px] font-bold uppercase text-subtle">
                  Bấm để xem dữ liệu giải thích
                </p>
              ) : null}
            </>
          );

          if (!linkedMetric || !metricId) {
            return (
              <div key={item.label} className={cn("rounded-[5px] border p-3", toneClass[item.tone])}>
                {content}
              </div>
            );
          }

          return (
            <details
              key={item.label}
              className={cn(
                "group rounded-[5px] border transition hover:-translate-y-0.5 hover:shadow-hard-sm",
                toneClass[item.tone]
              )}
            >
              <summary className="cursor-pointer list-none p-3 focus:outline-none focus:ring-2 focus:ring-ink/20">
                {content}
              </summary>
              <div className="border-t border-border-soft p-3">
                <CoreMacroMetricCard metric={linkedMetric} />
              </div>
            </details>
          );
        })}
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

function useCoreMacroMetrics(metrics: MacroCompassMetric[]) {
  const metricMap = useMemo(() => new Map(metrics.map((metric) => [metric.id, metric])), [metrics]);
  return coreMetricIds
    .map((id) => metricMap.get(id))
    .filter((metric): metric is MacroCompassMetric => Boolean(metric));
}

function CoreMacroReadingFlow({ metrics }: { metrics: MacroCompassMetric[] }) {
  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => {
        const readingRole = coreMetricReadingRoles[metric.id];

        if (!readingRole) return null;

        return (
          <div key={`reading-${metric.id}`} className="rounded-[5px] border border-border-soft bg-canvas p-3">
            <p className="text-[11px] font-bold uppercase text-subtle">
              {readingRole.step} · {readingRole.role}
            </p>
            <p className="mt-2 text-sm font-semibold leading-5 text-ink">{readingRole.question}</p>
          </div>
        );
      })}
    </div>
  );
}

function CoreMacroMetricCard({ metric }: { metric: MacroCompassMetric }) {
  const readingRole = coreMetricReadingRoles[metric.id];
  const sourceText = metric.sourceName
    ? `${metric.sourceName}${metric.period ? ` · ${metric.period}` : ""}`
    : "Chưa có nguồn đã rà soát";
  const dataStatus = macroCompassMetricStatusLabel(metric);
  const firstWarning = metric.warnings[0];
  const missingValueNote =
    metric.value === null
      ? "Chỉ số này vẫn nằm trong luồng đọc vì nó là mắt xích cần kiểm tra, nhưng hiện chưa có dữ liệu đã kiểm duyệt nên chưa dùng để kết luận."
      : null;

  return (
    <article
      className={cn(
        "rounded-[8px] border-[1.5px] bg-surface p-4 shadow-soft",
        toneClass[metric.tone]
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-subtle">
            {readingRole
              ? `${readingRole.step} · ${readingRole.role}`
              : metricGroupLabel[metric.group]}
          </p>
          <h3 className="mt-1 text-base font-extrabold text-ink">{metric.name}</h3>
          <p className="mt-1 text-lg font-extrabold text-ink">
            {formatMacroCompassMetricValue(metric)}
          </p>
        </div>
        <Chip variant={toneChip[metric.tone]}>{dataStatus}</Chip>
      </div>

      <div className="mt-4 grid gap-3 text-sm leading-6 text-muted">
        {readingRole ? (
          <div className="rounded-[5px] border border-border-soft bg-canvas p-3">
            <p>
              <span className="font-bold text-ink">Câu hỏi cần trả lời: </span>
              {readingRole.question}
            </p>
            <p className="mt-1">
              <span className="font-bold text-ink">Vì sao đọc ở đây: </span>
              {readingRole.whyFirst}
            </p>
            {missingValueNote ? <p className="mt-1 font-semibold text-ink">{missingValueNote}</p> : null}
          </div>
        ) : null}
        {metric.practicalReading ? (
          <div className="rounded-[5px] border border-border-soft bg-canvas p-3">
            <p>
              <span className="font-bold text-ink">Con số này nói gì: </span>
              {metric.practicalReading.current}
            </p>
            <p className="mt-1">
              <span className="font-bold text-ink">Mốc đọc nhanh: </span>
              {metric.practicalReading.benchmark}
            </p>
            <p className="mt-1">
              <span className="font-bold text-ink">Ảnh hưởng thực tế: </span>
              {metric.practicalReading.impact}
            </p>
            <p className="mt-1">
              <span className="font-bold text-ink">Đừng kết luận vội: </span>
              {metric.practicalReading.caveat}
            </p>
          </div>
        ) : (
          <>
            <p>
              <span className="font-bold text-ink">Đọc nhanh: </span>
              {metric.simpleMeaning}
            </p>
            <p>
              <span className="font-bold text-ink">Tác động: </span>
              {metric.marketImpact}
            </p>
            <p>
              <span className="font-bold text-ink">Cần kiểm tra tiếp: </span>
              {metric.whatToCheckNext}
            </p>
          </>
        )}
      </div>

      <div className="mt-4 grid gap-2 rounded-[5px] border border-border-soft bg-canvas p-3 text-xs leading-5 text-muted">
        <p>
          <span className="font-bold text-ink">Nguồn/kỳ dữ liệu: </span>
          {sourceText}
        </p>
        {firstWarning ? <p>{firstWarning}</p> : null}
      </div>
    </article>
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

type MacroIndicatorDbObservation = {
  sourceLabel: string;
  observationDate?: string;
  value: number | string;
  unit?: string | null;
  productionApproved: boolean;
  needsReview: boolean;
  provenance?: {
    semanticCaveats?: string[];
  };
};

type MacroIndicatorRuntimeViewItem = {
  indicatorCode: string;
  displayName: string;
  description: string;
  supportStatus: string;
  inCurrentFrontend?: boolean;
  latestObservation?: MacroIndicatorDbObservation | null;
  latestObservations?: MacroIndicatorDbObservation[];
  limitations?: string[];
  freshness?: {
    staleStatus: "fresh" | "stale" | "unknown";
  };
};

export function MacroIndicatorUniverseSection({ data }: { data: MacroCompassData }) {
  if (!data.indicatorUniverse || data.indicatorUniverse.length === 0) return null;

  const indicators = data.indicatorUniverse as MacroIndicatorRuntimeViewItem[];
  const guidedIndicatorCodes = indicatorReadingGroups
    .flatMap((group) => group.codes)
    .filter((code, index, list) => list.indexOf(code) === index);
  const hiddenIndicators = indicators.filter((indicator) => !guidedIndicatorCodes.includes(indicator.indicatorCode));

  return (
    <section className="space-y-4">
      <SectionIntro
        id="indicator-universe"
        question="Muốn kiểm tra toàn bộ nguồn dữ liệu thì xem ở đâu?"
        title="Dữ liệu vĩ mô hệ thống đang theo dõi"
        description="Phần tra cứu trạng thái nguồn: dữ liệu nào đã có, dữ liệu nào đang chờ rà soát và dữ liệu nào chưa nên dùng để diễn giải."
      />
      <details className="rounded-[8px] border border-border-soft bg-canvas p-4">
        <summary className="cursor-pointer list-none text-sm font-extrabold text-ink underline-offset-4 hover:underline">
          Dữ liệu phụ trợ đang ẩn ({hiddenIndicators.length})
        </summary>
        <p className="mt-2 text-xs font-semibold leading-5 text-muted">
          Các chỉ số này phục vụ mở rộng nguồn và kiểm toán dữ liệu. Người mới chưa cần đọc ở bước phân tích chính.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hiddenIndicators.map((indicator) => {
          const latestObservations =
            indicator.latestObservations && indicator.latestObservations.length > 0
              ? indicator.latestObservations
              : indicator.latestObservation
                ? [indicator.latestObservation]
                : [];
          let tone: "success" | "warning" | "neutral" | "danger" | "accent" = "neutral";
          let statusText = "Chưa hỗ trợ";

          if (indicator.supportStatus === "db_backed") {
            if (indicator.freshness?.staleStatus === "stale") {
              tone = "warning";
              statusText = "Dữ liệu có thể đã cũ";
            } else {
              tone = "success";
              statusText = "Có dữ liệu hệ thống";
            }
          } else if (indicator.supportStatus === "candidate_source_identified") {
            tone = "accent";
            statusText = "Đã xác định nguồn candidate";
          } else if (indicator.supportStatus === "source_assessment_needed") {
            tone = "warning";
            statusText = "Cần đánh giá nguồn";
          } else if (indicator.supportStatus === "planned") {
            tone = "neutral";
            statusText = "Dự kiến hỗ trợ";
          }

          if (indicator.inCurrentFrontend && !indicator.latestObservation) {
            statusText = "Chưa có dữ liệu quan sát";
          }

          return (
            <article key={indicator.indicatorCode} className="rounded-[8px] border-[1.5px] border-border-soft bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-ink">{indicator.displayName}</h3>
                  <p className="mt-1 text-xs font-bold text-muted">{indicator.indicatorCode}</p>
                </div>
                <Chip size="sm" variant={tone}>{statusText}</Chip>
              </div>
              
              <div className="mt-4 text-xs leading-5 text-muted">
                <p>{indicator.description}</p>
                {latestObservations.length > 0 && (
                  <div className="mt-3 rounded border border-border-soft bg-canvas p-3">
                    <p className="font-bold text-ink">Số liệu gần nhất:</p>
                    <div className="mt-2 grid gap-2">
                      {latestObservations.map((observation: MacroIndicatorDbObservation) => (
                        <div key={`${observation.sourceLabel}-${observation.unit}-${observation.observationDate}`} className="rounded border border-border-soft bg-surface p-2">
                          <p className="text-sm font-bold">{observation.value} {observation.unit}</p>
                          {observation.observationDate ? (
                            <p className="mt-1">Ngày dữ liệu: {observation.observationDate.slice(0, 10)}</p>
                          ) : null}
                          <p className="mt-1">Dữ liệu đang được rà soát.</p>
                          {observation.provenance?.semanticCaveats?.map((caveat: string) => (
                            <p key={caveat} className="mt-1 text-muted">{caveat}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                    {indicator.limitations?.map((limitation: string) => (
                      <p key={limitation} className="mt-2 text-muted">{limitation}</p>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
        </div>
      </details>
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
              <p className="mt-1 text-sm font-bold text-ink">{formatMacroCompassMetricValue(metric)}</p>
            </div>
            <Chip variant={toneChip[metric.tone]}>{macroCompassMetricStatusLabel(metric)}</Chip>
          </div>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-muted">
            {metric.freshness?.staleStatus === "stale" ? (
              <div className="rounded-[5px] border border-warning bg-warning/10 p-3 text-sm leading-6">
                <p className="font-bold text-ink">Cảnh báo độ mới dữ liệu</p>
                <p className="mt-1 text-muted">{metric.freshness.reason}</p>
                {metric.asOf ? <p className="mt-1 text-muted">Ngày dữ liệu: {metric.asOf}</p> : null}
              </div>
            ) : null}
            {metric.practicalReading ? (
              <div className="rounded-[5px] border border-border-soft bg-canvas p-3">
                <p>
                  <span className="font-bold text-ink">Con số này nói gì: </span>
                  {metric.practicalReading.current}
                </p>
                <p className="mt-1">
                  <span className="font-bold text-ink">Mốc đọc nhanh: </span>
                  {metric.practicalReading.benchmark}
                </p>
              </div>
            ) : (
              <>
                <p>
                  <span className="font-bold text-ink">Cách hiểu đơn giản: </span>
                  {metric.simpleMeaning}
                </p>
                <p>
                  <span className="font-bold text-ink">Tác động đến thị trường: </span>
                  {metric.marketImpact}
                </p>
              </>
            )}
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer list-none text-xs font-bold text-ink underline-offset-4 hover:underline">
              Xem ngành liên quan
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <MiniBlock title="Ngành cần chú ý" items={metric.relatedSectors} />
              <div className="rounded-[4px] border border-border-soft bg-canvas p-3 text-xs leading-5 text-muted">
                <strong className="text-ink">Trạng thái dữ liệu: </strong>
                {metric.confidence}
                {metric.warnings[0] ? <p className="mt-2">{metric.warnings[0]}</p> : null}
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
  const displayQuestion =
    id === "indicator-universe" ? "Có dữ liệu nào hệ thống theo dõi nhưng người mới chưa cần đọc ngay?" : question;
  const displayTitle = id === "indicator-universe" ? "Dữ liệu phụ trợ và nguồn mở rộng" : title;
  const displayDescription =
    id === "indicator-universe"
      ? "Phần này phục vụ kiểm toán nguồn và mở rộng dữ liệu. Luồng đọc chính đã nằm ở các card chỉ số phía trên; người mới có thể bỏ qua phần này."
      : description;

  return (
    <div id={id} className="scroll-mt-6">
      <p className="text-xs font-bold uppercase text-muted">{displayQuestion}</p>
      <h2 className="mt-1 text-xl font-extrabold text-ink">{displayTitle}</h2>
      <p className="mt-2 max-w-[780px] text-sm leading-6 text-muted">{displayDescription}</p>
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
