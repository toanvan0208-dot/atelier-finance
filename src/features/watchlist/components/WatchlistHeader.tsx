import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Chip } from "@/components/ui";
import type { StockIdea, WatchlistHeaderData } from "../types";

type WatchlistHeaderProps = {
  data: WatchlistHeaderData;
  ideas: StockIdea[];
};

export function WatchlistHeader({ data, ideas }: WatchlistHeaderProps) {
  const alertCount = ideas.filter((idea) => idea.alerts.length > 0).length;

  const metrics = [
    { label: "Tổng cổ phiếu", value: data.totalIdeas },
    { label: "Cần xem lại", value: data.reviewCount },
    { label: "Sẵn sàng mô phỏng", value: data.simulationReadyCount },
    { label: "Có cảnh báo", value: alertCount },
  ];

  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">{data.moduleName}</Chip>
            <AnalysisNotePopover
              contextTitle="Watchlist"
              moduleId="watchlist"
              moduleName="Watchlist"
              noteType="personal"
            />
          </div>
          <h1 className="mt-3 font-brand text-2xl font-bold leading-tight text-ink">
            Watchlist
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Theo dõi cổ phiếu cần nghiên cứu thêm trước khi ra quyết định.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[520px]">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
            >
              <p className="text-[11px] font-semibold text-subtle">{metric.label}</p>
              <p className="mt-1 font-mono text-xl font-bold text-ink">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
