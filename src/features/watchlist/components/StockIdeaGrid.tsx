"use client";

import type { StockIdea } from "../types";
import { StockIdeaCard } from "./StockIdeaCard";

type StockIdeaGridProps = {
  data: StockIdea[];
  expandedTicker: string | null;
  onOpenDetails: (ticker: string) => void;
  onToggle: (ticker: string) => void;
};

export function StockIdeaGrid({
  data,
  expandedTicker,
  onOpenDetails,
  onToggle,
}: StockIdeaGridProps) {
  return (
    <div className="grid gap-3">
      {data.map((idea) => (
        <StockIdeaCard
          key={idea.ticker}
          data={idea}
          isExpanded={idea.ticker === expandedTicker}
          onOpenDetails={onOpenDetails}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
