"use client";

import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { StockIdea, WatchlistStatus } from "../types";

type PipelineKey = WatchlistStatus | "all";

type WatchlistPipelineBoardProps = {
  activeStatus: PipelineKey;
  ideas: StockIdea[];
  onChange: (status: PipelineKey) => void;
};

const pipelineStages: Array<{
  key: PipelineKey;
  label: string;
  description: string;
}> = [
  { key: "all", label: "Tất cả", description: "Toàn bộ ý tưởng đang quản lý." },
  { key: "Mới thêm", label: "Mới thêm", description: "Cần viết lý do theo dõi và thesis ban đầu." },
  { key: "Đang phân tích", label: "Đang phân tích", description: "Đang đi qua các module kiểm chứng." },
  { key: "Cần xem lại", label: "Cần xem lại", description: "Có dữ liệu, sự kiện hoặc thesis cần cập nhật." },
  { key: "Sẵn sàng mô phỏng", label: "Sẵn sàng mô phỏng", description: "Đã có đủ nền để tạo kịch bản giả lập." },
  { key: "Đang mô phỏng", label: "Đang mô phỏng", description: "Đang theo dõi kịch bản giả định." },
  { key: "Tạm loại", label: "Tạm loại", description: "Chưa đủ cơ sở hoặc dễ FOMO." },
  { key: "Lưu trữ", label: "Lưu trữ", description: "Ý tưởng cũ, giữ lại lịch sử." },
];

function getStageIdeas(ideas: StockIdea[], key: PipelineKey) {
  if (key === "all") {
    return ideas;
  }

  return ideas.filter((idea) => idea.status === key);
}

export function WatchlistPipelineBoard({
  activeStatus,
  ideas,
  onChange,
}: WatchlistPipelineBoardProps) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-brand text-lg font-bold text-ink">Luồng xử lý ý tưởng</h2>
          <p className="text-sm leading-6 text-muted">
            Click trạng thái để lọc workspace bên dưới.
          </p>
        </div>
        <Chip variant="neutral">Pipeline</Chip>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {pipelineStages.map((stage) => {
          const stageIdeas = getStageIdeas(ideas, stage.key);
          const isActive = activeStatus === stage.key;

          return (
            <button
              key={stage.key}
              className={cn(
                "min-w-[190px] rounded-[4px] border px-3 py-3 text-left transition",
                isActive
                  ? "border-border bg-accent-soft shadow-hard-sm"
                  : "border-border-soft bg-surface-soft hover:border-border hover:bg-accent-soft"
              )}
              type="button"
              onClick={() => onChange(stage.key)}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">{stage.label}</p>
                <Chip size="sm" variant={isActive ? "accent" : "neutral"}>{stageIdeas.length}</Chip>
              </div>
              <p className="mt-2 min-h-10 text-xs leading-5 text-muted">{stage.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {stageIdeas.slice(0, 3).map((idea) => (
                  <Chip key={idea.ticker} size="sm" variant="neutral">{idea.ticker}</Chip>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export type { PipelineKey as WatchlistPipelineBoardKey };
