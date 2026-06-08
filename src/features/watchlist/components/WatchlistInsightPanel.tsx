import { Button, Card, CardBody, CardHeader, Tabs } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SimulationTrackingData, StockIdea } from "../types";
import { StockEventBadge } from "./StockEventBadge";
import {
  FieldGrid,
  ModuleStatusBadge,
  StatusBadge,
  TagList,
  TextStack,
} from "./WatchlistPrimitives";
import { WatchlistSoftAlert } from "./WatchlistSoftAlert";

type WatchlistInsightPanelProps = {
  data: StockIdea;
  isOpen: boolean;
  onClose: () => void;
  simulationTracking: SimulationTrackingData;
  tutorNotes: string[];
};

function getSimulationItem(data: SimulationTrackingData, ticker: string) {
  return data.items.find((item) => item.ticker === ticker);
}

export function WatchlistInsightPanel({
  data,
  isOpen,
  onClose,
  simulationTracking,
  tutorNotes,
}: WatchlistInsightPanelProps) {
  const simulationItem = getSimulationItem(simulationTracking, data.ticker);

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-40 w-full max-w-[520px] border-l-[1.5px] border-border bg-page p-4 shadow-hard transition-transform duration-200",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
      aria-hidden={!isOpen}
    >
      <Card className="flex h-full flex-col overflow-hidden">
        <CardHeader
          action={
            <Button size="sm" variant="secondary" onClick={onClose}>
              Đóng
            </Button>
          }
          chip={<StatusBadge status={data.status} />}
          description={`${data.companyName} · ${data.industry}`}
          icon={data.ticker.slice(0, 2)}
          title={`Chi tiết cổ phiếu ${data.ticker}`}
        />
        <CardBody className="min-h-0 flex-1 overflow-y-auto">
          <Tabs
            ariaLabel="Chi tiết cổ phiếu"
            items={[
              {
                value: "overview",
                label: "Tổng quan",
                content: (
                  <div className="space-y-4">
                    <FieldGrid
                      items={[
                        { label: "Mã cổ phiếu", value: data.ticker, tone: "accent" },
                        { label: "Tên doanh nghiệp", value: data.companyName },
                        { label: "Ngành", value: data.industry },
                        { label: "Sàn", value: data.exchange },
                        { label: "Giá hiện tại", value: data.currentPrice },
                        { label: "Biến động 30 ngày", value: data.recentMove },
                        { label: "Thanh khoản", value: data.liquidity },
                        { label: "Mức ưu tiên", value: data.priority },
                      ]}
                    />
                    <div>
                      <p className="mb-2 text-xs font-bold text-ink">Tags</p>
                      <TagList tags={data.tags} />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold text-ink">Bước tiếp theo</p>
                      <TextStack items={[data.nextStep]} />
                    </div>
                  </div>
                ),
              },
              {
                value: "thesis",
                label: "Thesis",
                content: (
                  <div className="space-y-4">
                    <FieldGrid
                      items={[
                        { label: "Lý do theo dõi", value: data.reason },
                        { label: "Điều muốn kiểm chứng", value: data.validationQuestion },
                        { label: "Thesis hiện tại", value: data.thesis },
                        { label: "Catalyst", value: data.catalyst ?? "Chưa có" },
                      ]}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-bold text-ink">
                          Dữ liệu xác nhận thesis
                        </p>
                        <TextStack items={data.confirmingData} />
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold text-ink">
                          Dữ liệu phủ định thesis
                        </p>
                        <TextStack items={data.invalidatingData} />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold text-ink">Rủi ro chính</p>
                      <TextStack items={data.risks} />
                    </div>
                  </div>
                ),
              },
              {
                value: "checklist",
                label: "Checklist phân tích",
                content: (
                  <div className="space-y-2">
                    {data.progress.map((item) => (
                      <div
                        key={item.moduleName}
                        className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-ink">{item.moduleName}</p>
                            <p className="mt-1 text-xs leading-5 text-muted">
                              {item.question}
                            </p>
                          </div>
                          <ModuleStatusBadge status={item.status} />
                        </div>
                        <p className="mt-2 text-xs font-bold text-accent">
                          {item.actionLabel}
                        </p>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                value: "simulation",
                label: "Mô phỏng",
                content: simulationItem ? (
                  <div className="space-y-4">
                    <FieldGrid
                      items={[
                        { label: "Trạng thái thesis", value: simulationItem.thesisStatus },
                        { label: "Ngày bắt đầu mô phỏng", value: simulationItem.startedAt },
                        { label: "Giá bắt đầu mô phỏng", value: simulationItem.startPrice },
                        { label: "Giá hiện tại", value: simulationItem.currentPrice },
                        { label: "Vốn giả lập", value: simulationItem.simulatedCapital },
                        { label: "Tỷ trọng giả lập", value: simulationItem.simulatedWeight },
                        { label: "Số lượng hệ thống tính", value: simulationItem.simulatedQuantity },
                        { label: "Mốc xem lại thesis", value: simulationItem.nextReviewMilestone },
                      ]}
                    />
                    <TextStack
                      items={[
                        simulationItem.requiredUpdate,
                        simulationItem.softWarning,
                      ]}
                    />
                    <div>
                      <p className="mb-2 text-xs font-bold text-ink">Module liên kết</p>
                      <TagList tags={simulationItem.linkedModules} />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-sm leading-6 text-muted">
                    Cổ phiếu này chưa có vị thế theo dõi giả lập trong Watchlist.
                  </div>
                ),
              },
              {
                value: "journal",
                label: "Nhật ký",
                content: (
                  <div className="space-y-3">
                    <FieldGrid
                      items={[
                        { label: "Ghi chú gần nhất", value: data.latestNote },
                        { label: "Trạng thái cảm xúc", value: data.emotionalState },
                        { label: "Bài học", value: data.lesson ?? "Chưa có" },
                        { label: "Tạm loại vì", value: data.pauseReason ?? "Không áp dụng" },
                      ]}
                    />
                    {simulationItem ? (
                      <TextStack items={[`Nhật ký mô phỏng: ${simulationItem.journalStatus}`]} />
                    ) : null}
                  </div>
                ),
              },
              {
                value: "events",
                label: "Sự kiện",
                content: (
                  <div className="space-y-3">
                    {data.events.length ? (
                      data.events.map((event) => (
                        <StockEventBadge key={`${event.label}-${event.date}`} event={event} />
                      ))
                    ) : (
                      <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-sm leading-6 text-muted">
                        Chưa có sự kiện gần cần ưu tiên.
                      </div>
                    )}
                    {data.alerts.map((alert) => (
                      <WatchlistSoftAlert key={alert.title} data={alert} />
                    ))}
                  </div>
                ),
              },
              {
                value: "tutor",
                label: "AI Tutor",
                content: (
                  <div className="space-y-3">
                    {tutorNotes.map((note) => (
                      <p
                        key={note}
                        className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted"
                      >
                        {note}
                      </p>
                    ))}
                    <div className="rounded-[4px] border border-border bg-accent-soft px-3 py-3 text-xs leading-5 text-muted">
                      Watchlist chỉ điều phối ý tưởng. Không dùng danh sách này
                      như danh sách khuyến nghị hành động.
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}
