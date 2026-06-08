"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Chip, EmptyState, SectionHeader } from "@/components/ui";
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

  return (
    <section>
      <SectionHeader
        description="Kết quả được chia thành 3 nhóm để bạn biết mã nào nên mở hồ sơ, mã nào chỉ theo dõi và mã nào chưa phù hợp ở giai đoạn học hiện tại."
        icon="R"
        title="Kết quả ứng viên"
      />

      <div className="space-y-4">
        {groups.map((group) => (
          <Card key={group.key}>
            <CardHeader
              chip={
                <Chip variant={group.tone}>
                  {group.stocks.length} {labels.stockCountUnit}
                </Chip>
              }
              description={group.description}
              icon={group.icon}
              title={group.title}
            />
            <CardBody className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {group.criteria.slice(0, 3).map((criterion) => (
                  <Chip key={criterion} size="sm" variant="neutral">
                    {criterion}
                  </Chip>
                ))}
              </div>

              {group.stocks.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-2">
                  {group.stocks.map((stock) => (
                    <ScreeningStockCard
                      key={stock.ticker}
                      labels={stockCardLabels}
                      stock={stock}
                      tone={group.tone}
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
            </CardBody>
          </Card>
        ))}
      </div>

      <StockScreeningExplanationDrawer
        stock={explainedStock}
        onClose={() => setExplainedStock(null)}
      />
    </section>
  );
}
