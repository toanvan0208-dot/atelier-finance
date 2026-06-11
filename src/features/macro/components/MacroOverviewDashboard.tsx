"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type {
  MacroDataMeta,
  MacroJourneyData,
  MacroMetric,
  MacroSectorTile,
  MacroTone,
  MacroTransmissionChain,
  MacroWarningSignal,
} from "../types";

type MacroOverviewDashboardProps = {
  data: MacroJourneyData;
  onNavigate?: (moduleKey: string) => void;
};

type DetailSection = {
  title: string;
  content: ReactNode;
};

type DetailState = {
  title: string;
  tone: MacroTone;
  subtitle?: string;
  sections: DetailSection[];
};

type DetailTab = "metrics" | "transmission" | "sectors" | "warnings" | "sources";

const toneLabel: Record<MacroTone, string> = {
  support: "Hỗ trợ",
  pressure: "Áp lực",
  neutral: "Trung tính",
  watch: "Cần theo dõi",
  mixed: "Trái chiều",
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
  support: "border-accent-green/60 bg-accent-green/10",
  pressure: "border-danger/60 bg-danger/10",
  neutral: "border-border-soft bg-neutral/45",
  watch: "border-warning/70 bg-warning/10",
  mixed: "border-border bg-accent-soft/55",
};

const heatToneClasses: Record<MacroTone, string> = {
  support: "border-accent-green bg-accent-green/15 text-ink",
  pressure: "border-danger bg-danger/15 text-ink",
  neutral: "border-border-soft bg-surface-soft text-ink",
  watch: "border-warning bg-warning/15 text-ink",
  mixed: "border-border bg-accent-soft/70 text-ink",
};

const dataStatusLabel: Record<MacroDataMeta["status"], string> = {
  mock: "Mock data",
  placeholder: "Placeholder",
  stale: "Cần cập nhật",
  fresh: "Đã cập nhật",
};

const detailTabs: Array<{ id: DetailTab; label: string }> = [
  { id: "metrics", label: "Chỉ số chính" },
  { id: "transmission", label: "Kênh truyền dẫn" },
  { id: "sectors", label: "Tác động ngành" },
  { id: "warnings", label: "Cảnh báo" },
  { id: "sources", label: "Nguồn dữ liệu" },
];

function DetailModal({ detail, onClose }: { detail: DetailState; onClose: () => void }) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-[820px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Chip variant={toneChipVariant[detail.tone]}>{toneLabel[detail.tone]}</Chip>
              {detail.subtitle ? <Chip variant="neutral">{detail.subtitle}</Chip> : null}
            </div>
            <h2 className="text-lg font-bold leading-tight text-ink">{detail.title}</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
        <div className="max-h-[calc(92dvh-104px)] overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid gap-4 md:grid-cols-2">
            {detail.sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
              >
                <h3 className="text-xs font-bold uppercase tracking-[0.03em] text-subtle">
                  {section.title}
                </h3>
                <div className="mt-2 text-sm leading-6 text-muted">{section.content}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-1.5">
      {items.map((item) => (
        <li key={item} className="rounded-[3px] bg-surface px-2 py-1 text-xs leading-5 text-muted">
          {item}
        </li>
      ))}
    </ul>
  );
}

function ShortTextList({ items, limit = 3 }: { items: string[]; limit?: number }) {
  return <TextList items={items.slice(0, limit)} />;
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

function Sparkline({ values = [], tone }: { values?: number[]; tone: MacroTone }) {
  if (values.length < 2) {
    return <div className="h-8 rounded-[3px] bg-surface-soft" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 30 - ((value - min) / range) * 24;
      return `${x},${y}`;
    })
    .join(" ");

  const strokeClass =
    tone === "support"
      ? "stroke-accent-green"
      : tone === "pressure"
        ? "stroke-danger"
        : tone === "watch"
          ? "stroke-warning"
          : "stroke-accent";

  return (
    <svg className="h-8 w-full" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} className={cn("fill-none stroke-[2.5]", strokeClass)} />
    </svg>
  );
}

function MetricCard({
  metric,
  onOpen,
}: {
  metric: MacroMetric;
  onOpen: (metric: MacroMetric) => void;
}) {
  return (
    <article className="rounded-[4px] border border-border-soft bg-surface px-3 py-3 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-subtle">{metric.label}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-brand text-2xl font-bold text-ink">{metric.value}</span>
            {metric.unit ? <span className="text-xs font-bold text-muted">{metric.unit}</span> : null}
          </div>
        </div>
        <Chip size="sm" variant={toneChipVariant[metric.status]}>
          {toneLabel[metric.status]}
        </Chip>
      </div>
      <p className="mt-1 text-[11px] font-semibold text-subtle">{metric.period}</p>
      {metric.change ? <p className="text-[11px] font-bold text-ink">{metric.change}</p> : null}
      <div className="mt-2">
        <Sparkline values={metric.sparkline} tone={metric.status} />
      </div>
      <p className="mt-2 min-h-[34px] text-xs leading-5 text-muted">{metric.explanation}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        {metric.isMock ? <Chip size="sm" variant="neutral">Mock data</Chip> : <span />}
        <Button size="sm" variant="ghost" onClick={() => onOpen(metric)}>
          Chi tiết
        </Button>
      </div>
    </article>
  );
}

function SectorHeatmap({
  tiles,
  compact = false,
  onOpen,
}: {
  tiles: MacroSectorTile[];
  compact?: boolean;
  onOpen: (tile: MacroSectorTile) => void;
}) {
  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 lg:grid-cols-4")}>
      {tiles.map((tile) => (
        <button
          key={tile.id}
          className={cn(
            "min-h-[104px] rounded-[4px] border-[1.5px] px-3 py-3 text-left shadow-soft transition hover:-translate-y-0.5",
            heatToneClasses[tile.status]
          )}
          type="button"
          onClick={() => onOpen(tile)}
        >
          <span className="block text-sm font-bold leading-5">{tile.name}</span>
          <span className="mt-2 flex flex-wrap gap-1">
            <Chip size="sm" variant={toneChipVariant[tile.status]}>{toneLabel[tile.status]}</Chip>
            {tile.horizon ? <Chip size="sm" variant="neutral">{tile.horizon}</Chip> : null}
          </span>
          <span className="mt-2 line-clamp-2 block text-[11px] font-semibold leading-4 text-muted">
            {tile.shortReason}
          </span>
        </button>
      ))}
    </div>
  );
}

function openMetricDetail(metric: MacroMetric): DetailState {
  return {
    title: metric.label,
    subtitle: `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`,
    tone: metric.status,
    sections: [
      { title: "Chỉ số này là gì?", content: metric.detail?.definition ?? "Cần bổ sung mô tả." },
      { title: "Số hiện tại nói gì?", content: metric.detail?.currentReading ?? metric.explanation },
      { title: "Cần kiểm chứng tiếp", content: <ShortTextList items={metric.detail?.nextChecks ?? []} /> },
      { title: "Xem sâu hơn", content: "Đọc tiếp ở Global Macro, Vietnam Macro hoặc Macro Transmission Map trong lộ trình bên dưới." },
      {
        title: "Nguồn dữ liệu",
        content: (
          <div className="grid gap-1 text-xs">
            <span>Nguồn: {metric.source ?? "Chưa có"}</span>
            <span>Cập nhật: {metric.updatedAt ?? "Chưa có"}</span>
            <span>Trạng thái: {metric.isMock ? "Mock data" : "Đã cập nhật"}</span>
          </div>
        ),
      },
    ],
  };
}

function openSectorDetail(tile: MacroSectorTile): DetailState {
  return {
    title: tile.name,
    subtitle: tile.horizon,
    tone: tile.status,
    sections: [
      { title: "Vì sao cần xem?", content: tile.detail.whyAffected },
      { title: "Thời hạn tác động", content: tile.horizon ?? "Cần cập nhật" },
      { title: "3 chỉ số cần kiểm chứng", content: <ShortTextList items={tile.detail.keyChecks} /> },
      { title: "Module nên xem tiếp", content: <ChipList items={tile.detail.nextModule} /> },
      {
        title: "Cảnh báo",
        content: `${tile.detail.warning} Hưởng lợi từ vĩ mô không có nghĩa là có thể chuyển thành hành động giao dịch trong ngành đó.`,
      },
    ],
  };
}

function openChainDetail(chain: MacroTransmissionChain): DetailState {
  const compactChain = [
    chain.impactChannel[0],
    chain.impactChannel[Math.min(1, chain.impactChannel.length - 1)],
    chain.impactChannel[Math.min(2, chain.impactChannel.length - 1)],
    chain.impactChannel[chain.impactChannel.length - 1],
  ].filter((item, index, list) => item && list.indexOf(item) === index);

  return {
    title: chain.title,
    subtitle: chain.macroVariable,
    tone: chain.tone,
    sections: [
      { title: "Tóm tắt", content: chain.simpleMeaning },
      { title: "Chuỗi rút gọn", content: <TextList items={compactChain} /> },
      { title: "Module kiểm chứng", content: <ChipList items={chain.linkedModules} /> },
      { title: "Xem sâu hơn", content: "Đọc chi tiết ở bước Macro Transmission Map trong lộ trình bên dưới." },
    ],
  };
}

function openWarningDetail(signal: MacroWarningSignal): DetailState {
  return {
    title: signal.signal,
    subtitle: signal.status,
    tone: signal.tone,
    sections: [
      { title: "Cảnh báo điều gì?", content: signal.meaning },
      { title: "Dữ liệu cần chờ thêm", content: signal.evidence },
      { title: "Ngành liên quan", content: <ChipList items={signal.relatedSectors} /> },
      {
        title: "Lưu ý",
        content: "Không kết luận từ một tín hiệu đơn lẻ. Cần kiểm chứng thêm bằng dữ liệu ngành, BCTC và rủi ro.",
      },
      { title: "Xem sâu hơn", content: "Đọc chi tiết ở bước 6: Early Warning Dashboard." },
    ],
  };
}

function openHowToReadDetail(): DetailState {
  return {
    title: "Cách đọc dashboard",
    tone: "neutral",
    sections: [
      {
        title: "Mục đích",
        content: "Dashboard dùng để đọc bối cảnh vĩ mô, không phải tín hiệu giao dịch.",
      },
      {
        title: "Cách hiểu trạng thái",
        content: "Hỗ trợ là gió thuận, Áp lực là gió ngược, Cần theo dõi là chưa đủ chắc, Trái chiều là dữ liệu đang xung đột.",
      },
      {
        title: "Cách đọc số liệu",
        content: "Nhìn giá trị hiện tại, thay đổi so với kỳ trước, trạng thái và câu giải thích ngắn.",
      },
      {
        title: "Vì sao cần kiểm chứng",
        content: "Một chỉ số vĩ mô tốt chưa chắc đã đi vào doanh thu, biên lợi nhuận và dòng tiền doanh nghiệp.",
      },
      {
        title: "Đi tiếp thế nào",
        content: "Sau dashboard, nên kiểm chứng ở Module Ngành, BCTC, Định giá và Rủi ro.",
      },
    ],
  };
}

function DetailedMacroDashboard({
  data,
  activeTab,
  onTabChange,
  onOpenDetail,
}: {
  data: MacroJourneyData;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onOpenDetail: (detail: DetailState) => void;
}) {
  const metaItems = useMemo(
    () => [
      data.snapshot.meta,
      ...data.transmissionChains.map((chain) => chain.meta),
      ...data.globalInsights.map((insight) => insight.meta),
      ...data.vietnamInsights.map((insight) => insight.meta),
      ...data.warningSignals.map((signal) => signal.meta),
    ],
    [data]
  );
  const uniqueMeta = Array.from(
    new Map(metaItems.map((meta) => [`${meta.source}-${meta.status}`, meta])).values()
  );

  return (
    <Card>
      <CardHeader
        action={
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-[4px] border border-border-soft bg-surface-soft p-1">
            {detailTabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  className={cn(
                    "whitespace-nowrap rounded-[3px] px-3 py-2 text-xs font-bold transition",
                    isActive ? "bg-ink text-white shadow-hard-sm" : "text-muted hover:bg-surface-hover hover:text-ink"
                  )}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  aria-pressed={isActive}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        }
        title="Chế độ chi tiết"
      />
      <CardBody>
        {activeTab === "metrics" ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.dashboard.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} onOpen={(item) => onOpenDetail(openMetricDetail(item))} />
            ))}
          </div>
        ) : null}

        {activeTab === "transmission" ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.transmissionChains.slice(0, 5).map((chain) => (
              <article key={chain.id} className={cn("rounded-[4px] border px-3 py-3", tonePanelClasses[chain.tone])}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-ink">{chain.title}</h4>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{chain.simpleMeaning}</p>
                  </div>
                  <Chip size="sm" variant={toneChipVariant[chain.tone]}>{toneLabel[chain.tone]}</Chip>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Chip size="sm" variant="neutral">
                    {chain.linkedModules.slice(0, 3).join(" / ")}
                  </Chip>
                  <Button size="sm" variant="ghost" onClick={() => onOpenDetail(openChainDetail(chain))}>
                    Xem kênh truyền dẫn
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {activeTab === "sectors" ? (
          <div className="space-y-3">
            <p className="rounded-[4px] border border-warning bg-warning/10 px-3 py-2 text-xs font-bold leading-5 text-ink">
              Hưởng lợi từ vĩ mô không có nghĩa là có thể chuyển thành hành động giao dịch trong ngành đó. Cần kiểm chứng tiếp bằng dữ liệu ngành, BCTC, định giá và rủi ro.
            </p>
            <SectorHeatmap
              tiles={data.dashboard.sectorTiles}
              onOpen={(tile) => onOpenDetail(openSectorDetail(tile))}
            />
          </div>
        ) : null}

        {activeTab === "warnings" ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.warningSignals.slice(0, 4).map((signal) => (
              <article key={signal.id} className={cn("rounded-[4px] border px-3 py-3", tonePanelClasses[signal.tone])}>
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-bold leading-5 text-ink">{signal.signal}</p>
                  <Chip size="sm" variant={toneChipVariant[signal.tone]}>{signal.status}</Chip>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{signal.meaning}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Chip size="sm" variant="warning">Xem bước 6</Chip>
                  <Button size="sm" variant="ghost" onClick={() => onOpenDetail(openWarningDetail(signal))}>
                    Chi tiết
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {activeTab === "sources" ? (
          <div className="grid gap-3 md:grid-cols-2">
            {uniqueMeta.map((meta) => (
              <article
                key={`${meta.source}-${meta.status}`}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
              >
                <Chip size="sm" variant="neutral">{dataStatusLabel[meta.status]}</Chip>
                <p className="mt-2 text-xs leading-5 text-muted">Nguồn: {meta.source}</p>
                <p className="text-xs leading-5 text-muted">Kỳ dữ liệu: {meta.period}</p>
                <p className="text-xs leading-5 text-muted">Cập nhật: {meta.updatedAt}</p>
                <p className="mt-2 text-[11px] font-semibold text-subtle">
                  Độ tin cậy: cần thay bằng nguồn chính thức trước khi dùng thật.
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function MacroOverviewDashboard({ data }: MacroOverviewDashboardProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("metrics");
  const [detail, setDetail] = useState<DetailState | null>(null);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setDetail(openHowToReadDetail())}>
                Cách đọc dashboard
              </Button>
            </div>
          }
          chip={<Chip variant="accent">Dashboard tổng quan</Chip>}
          description="Chế độ chi tiết hiển thị số liệu, kênh truyền dẫn, heatmap ngành, cảnh báo và nguồn dữ liệu."
          title="Tổng quan vĩ mô"
        />
      </Card>

      <DetailedMacroDashboard
        activeTab={activeTab}
        data={data}
        onOpenDetail={setDetail}
        onTabChange={setActiveTab}
      />

      {detail ? <DetailModal detail={detail} onClose={() => setDetail(null)} /> : null}
    </section>
  );
}
