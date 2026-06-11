"use client";

import { EmptyState, SectionHeader } from "@/components/ui";
import type { StockIdea } from "../types";
import { StockIdeaCard } from "./StockIdeaCard";

type StockIdeaGridProps = {
  data: StockIdea[];
  filteredCount: number;
  onOpenDetails: (ticker: string) => void;
  totalCount: number;
};

export function StockIdeaGrid({
  data,
  filteredCount,
  onOpenDetails,
  totalCount,
}: StockIdeaGridProps) {
  return (
    <section className="space-y-3">
      <SectionHeader
        description={`Đang hiển thị ${filteredCount}/${totalCount} ý tưởng. Card ưu tiên thesis, dữ liệu thiếu và bước tiếp theo.`}
        title="Stock Idea Workspace"
      />
      {data.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.map((idea) => (
            <StockIdeaCard
              key={idea.ticker}
              data={idea}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Không có ý tưởng nào khớp bộ lọc hiện tại. Hãy xóa bộ lọc hoặc chọn trạng thái khác."
          icon="WL"
          title="Không có ý tưởng phù hợp"
        />
      )}
    </section>
  );
}
