import { Button, Chip } from "@/components/ui";
import type { SimulationTrackingData } from "../types";
import { FieldGrid, TagList, TextStack, WatchlistSectionCard } from "./WatchlistPrimitives";

type SimulationTrackingListProps = {
  data: SimulationTrackingData;
};

export function SimulationTrackingList({ data }: SimulationTrackingListProps) {
  return (
    <WatchlistSectionCard
      description={data.description}
      icon="MP"
      title={data.title}
    >
      {data.items.length === 0 ? (
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-sm leading-6 text-muted">
          {data.emptyState}
        </div>
      ) : (
        <div className="grid gap-4">
          {data.items.map((item) => (
            <article
              key={item.ticker}
              className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-ink">{item.ticker}</h3>
                    <Chip variant="accent">{item.thesisStatus}</Chip>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-subtle">
                    {item.companyName}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.actions.map((action) => (
                    <Button
                      key={action.label}
                      size="sm"
                      variant={action.variant}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-3">
                  <FieldGrid
                    items={[
                      { label: "Ngày bắt đầu mô phỏng", value: item.startedAt },
                      { label: "Giá bắt đầu mô phỏng", value: item.startPrice },
                      { label: "Giá hiện tại", value: item.currentPrice },
                      { label: "Vốn giả lập", value: item.simulatedCapital },
                      { label: "Tỷ trọng giả lập", value: item.simulatedWeight },
                      { label: "Số lượng hệ thống tính", value: item.simulatedQuantity },
                    ]}
                  />
                  <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
                      Mốc xem lại thesis
                    </p>
                    <p className="mt-1 text-sm font-bold leading-5 text-ink">
                      {item.nextReviewMilestone}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      {item.requiredUpdate}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
                      Nhật ký mô phỏng
                    </p>
                    <p className="mt-1 text-sm font-bold leading-5 text-ink">
                      {item.journalStatus}
                    </p>
                  </div>
                  <TextStack items={[item.softWarning]} />
                  <div>
                    <p className="mb-2 text-xs font-bold text-ink">Module liên kết</p>
                    <TagList tags={item.linkedModules} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </WatchlistSectionCard>
  );
}
