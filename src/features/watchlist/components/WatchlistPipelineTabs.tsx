"use client";

import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ActionableWatchlistStatus, StockIdea } from "../types";

export type WatchlistPipelineKey = "all" | ActionableWatchlistStatus;

type WatchlistPipelineTabsProps = {
  activeKey: WatchlistPipelineKey;
  ideas: StockIdea[];
  onChange: (key: WatchlistPipelineKey) => void;
};

const tabs: Array<{ key: WatchlistPipelineKey; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "Mới thêm", label: "Mới thêm" },
  { key: "Đang phân tích", label: "Đang phân tích" },
  { key: "Cần xem lại", label: "Cần xem lại" },
  { key: "Sẵn sàng mô phỏng", label: "Sẵn sàng mô phỏng" },
  { key: "Đang mô phỏng", label: "Đang mô phỏng" },
  { key: "Tạm loại", label: "Tạm loại" },
];

function getCount(ideas: StockIdea[], key: WatchlistPipelineKey) {
  if (key === "all") {
    return ideas.length;
  }

  return ideas.filter((idea) => idea.status === key).length;
}

export function WatchlistPipelineTabs({
  activeKey,
  ideas,
  onChange,
}: WatchlistPipelineTabsProps) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3 shadow-soft">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeKey === tab.key;

          return (
            <button
              key={tab.key}
              className={cn(
                "flex min-h-9 shrink-0 items-center gap-2 rounded-[3px] border-[1.5px] px-3 text-xs font-bold transition",
                isActive
                  ? "border-border bg-accent-soft text-ink shadow-hard-sm"
                  : "border-border-soft bg-surface-soft text-muted hover:border-border hover:bg-surface-hover hover:text-ink"
              )}
              type="button"
              onClick={() => onChange(tab.key)}
            >
              <span>{tab.label}</span>
              <Chip size="sm" variant={isActive ? "accent" : "neutral"}>
                {getCount(ideas, tab.key)}
              </Chip>
            </button>
          );
        })}
      </div>
    </section>
  );
}
