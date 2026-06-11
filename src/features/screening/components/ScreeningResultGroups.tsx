"use client";

import { useState } from "react";
import { Button, Card, CardBody, Chip, EmptyState, SectionHeader } from "@/components/ui";
import type {
  ScreeningEmptyStateData,
  ScreeningResultGroupLabels,
  ScreeningStock,
  ScreeningStockCardLabels,
  ScreeningStockGroup,
} from "../types";
import { ScreeningStockCard } from "./ScreeningStockCard";
import { StockScreeningExplanationDrawer } from "./StockScreeningExplanationDrawer";

type ScreeningResultGroupsProps = {
  emptyState: ScreeningEmptyStateData;
  groups: ScreeningStockGroup[];
  labels: ScreeningResultGroupLabels;
  stockCardLabels: ScreeningStockCardLabels;
};

export function ScreeningResultGroups({
  emptyState,
  groups,
  labels,
  stockCardLabels,
}: ScreeningResultGroupsProps) {
  const [explainedStock, setExplainedStock] = useState<ScreeningStock | null>(null);
  const [activeGroupKey, setActiveGroupKey] = useState(groups[0]?.key ?? "priority");
  const activeGroup = groups.find((group) => group.key === activeGroupKey) ?? groups[0];
  const priorityCount = groups.find((group) => group.key === "priority")?.stocks.length ?? 0;
  const reviewCount = groups.find((group) => group.key === "review")?.stocks.length ?? 0;
  const excludedCount = groups.find((group) => group.key === "excluded")?.stocks.length ?? 0;

  return (
    <section>
      <SectionHeader
        description={`${priorityCount} mã đáng phân tích tiếp · ${reviewCount} mã cần theo dõi thêm · ${excludedCount} mã chưa phù hợp.`}
        icon="R"
        title="Kết quả lọc"
      />

      <Card>
        <CardBody className="space-y-4">
          <div className="flex gap-2 overflow-x-auto border-b border-border-soft pb-3">
            {groups.map((group) => {
              const isActive = activeGroup?.key === group.key;

              return (
                <button
                  key={group.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveGroupKey(group.key)}
                  className={[
                    "min-h-11 shrink-0 rounded-[4px] border px-3 py-2 text-left text-xs font-bold transition",
                    isActive
                      ? "border-border bg-ink text-white shadow-hard-sm"
                      : "border-border-soft bg-surface-soft text-ink hover:bg-surface",
                  ].join(" ")}
                >
                  {group.title}
                  <span className={[
                    "ml-2 rounded-[3px] border px-1.5 py-0.5 text-[10px]",
                    isActive ? "border-white/30 bg-white/10 text-white" : "border-border-soft bg-surface text-muted",
                  ].join(" ")}
                  >
                    {group.stocks.length} {labels.stockCountUnit}
                  </span>
                </button>
              );
            })}
          </div>

          {activeGroup ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Chip variant={activeGroup.tone}>{activeGroup.title}</Chip>
                    <Chip variant="neutral">{activeGroup.stocks.length} {labels.stockCountUnit}</Chip>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{activeGroup.description}</p>
                </div>
                <Button size="sm" variant="secondary">Chọn 2-3 mã để so sánh</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeGroup.criteria.slice(0, 3).map((criterion) => (
                  <Chip key={criterion} size="sm" variant="neutral">
                    {criterion}
                  </Chip>
                ))}
              </div>

              {activeGroup.stocks.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-2">
                  {activeGroup.stocks.map((stock) => (
                    <ScreeningStockCard
                      key={stock.ticker}
                      labels={stockCardLabels}
                      stock={stock}
                      tone={activeGroup.tone}
                      onExplain={setExplainedStock}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  description={emptyState.description}
                  icon={emptyState.icon}
                  title={emptyState.title}
                />
              )}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <StockScreeningExplanationDrawer
        stock={explainedStock}
        onClose={() => setExplainedStock(null)}
      />
    </section>
  );
}
