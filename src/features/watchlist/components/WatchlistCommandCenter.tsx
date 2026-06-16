"use client";

import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { StockIdea } from "../types";

type WatchlistCommandCenterProps = {
  ideas: StockIdea[];
  onNavigateModule?: (moduleKey: string) => void;
  onSelectFilter?: (filter: "missing-thesis" | "review" | "event" | "simulation-ready" | "paused") => void;
};

function hasMissingThesis(idea: StockIdea) {
  return !idea.thesis || idea.thesis.toLowerCase().includes("chưa có thesis");
}

export function WatchlistCommandCenter({
  ideas,
  onNavigateModule,
  onSelectFilter,
}: WatchlistCommandCenterProps) {
  const reviewCount = ideas.filter((idea) => idea.status === "Cần xem lại").length;
  const missingThesisCount = ideas.filter(hasMissingThesis).length;
  const eventCount = ideas.filter((idea) => idea.events.length > 0 || idea.alerts.length > 0).length;
  const simulationReadyCount = ideas.filter((idea) => idea.status === "Sẵn sàng mô phỏng").length;
  const pausedCount = ideas.filter((idea) => idea.status === "Tạm loại").length;

  const metrics = [
    { label: "Tổng ý tưởng", value: ideas.length, helper: "Ý tưởng cần kiểm chứng.", action: undefined },
    { label: "Cần xem lại", value: reviewCount, helper: "Có dữ liệu hoặc cảnh báo mới.", action: "review" as const },
    { label: "Thiếu thesis", value: missingThesisCount, helper: "Chưa có lý do theo dõi rõ.", action: "missing-thesis" as const },
    { label: "Có sự kiện", value: eventCount, helper: "Cần nối với module liên quan.", action: "event" as const },
    { label: "Sẵn sàng mô phỏng", value: simulationReadyCount, helper: "Đã có nền thesis sơ bộ.", action: "simulation-ready" as const },
    { label: "Tạm loại", value: pausedCount, helper: "Giữ kỷ luật khi dữ liệu chưa đủ.", action: "paused" as const },
  ];

  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Card>
          <CardHeader
            title="Trạm điều phối ý tưởng đầu tư"
            description={`${ideas.length} ý tưởng đang theo dõi`}
            chip={<Chip variant="neutral">Mock data</Chip>}
          />
          <CardBody className="space-y-4">
            <p className="font-brand text-xl font-bold leading-7 text-ink">
              {reviewCount} mã cần xem lại, {missingThesisCount} mã thiếu thesis, {simulationReadyCount} mã sẵn sàng mô phỏng.
            </p>
            <p className="text-sm leading-6 text-muted">
              Ưu tiên hôm nay: xử lý các mã thiếu dữ liệu BCTC, định giá hoặc lý do theo dõi chưa rõ.
            </p>
            <p className="rounded-[4px] border border-border-soft bg-accent-soft px-3 py-2 text-xs leading-5 text-muted">
              Watchlist dùng để quản lý ý tưởng cần kiểm chứng, không phải danh sách kết luận hành động.
            </p>
          </CardBody>
        </Card>

        <Card className="border-[2px] border-border">
          <CardHeader
            title="Việc nên xử lý trước"
            description="Một hành động chính cho hôm nay"
            chip={<Chip variant="warning">Ưu tiên cao</Chip>}
          />
          <CardBody className="space-y-4">
            <div>
              <h2 className="font-brand text-xl font-bold leading-6 text-ink">
                Hoàn thiện thesis cho các mã chưa có lý do rõ
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Các mã này dễ bị giữ lại vì FOMO nếu chưa ghi rõ điều cần kiểm chứng.
              </p>
            </div>
            <Button className="w-full" onClick={() => onSelectFilter?.("missing-thesis")}>
              Xem mã thiếu thesis
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => onNavigateModule?.("watchlist")}>
              Mở bộ lọc
            </Button>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <button
            key={metric.label}
            className="rounded-[4px] border border-border-soft bg-surface px-3 py-3 text-left shadow-soft transition hover:border-border hover:bg-accent-soft"
            type="button"
            onClick={() => metric.action && onSelectFilter?.(metric.action)}
          >
            <p className="text-[11px] font-bold uppercase text-subtle">{metric.label}</p>
            <p className="mt-1 font-brand text-2xl font-bold text-ink">{metric.value}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{metric.helper}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
