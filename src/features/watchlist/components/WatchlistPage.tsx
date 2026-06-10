"use client";

import { useMemo, useState } from "react";
import { EmptyState, LoadingState, SectionHeader } from "@/components/ui";
import { watchlistPageData } from "../data/watchlist.data";
import type { WatchlistPipelineKey } from "./WatchlistPipelineTabs";
import { StockIdeaGrid } from "./StockIdeaGrid";
import { WatchlistDisclaimer } from "./WatchlistDisclaimer";
import { WatchlistFilters } from "./WatchlistFilters";
import { WatchlistHeader } from "./WatchlistHeader";
import { WatchlistInsightPanel } from "./WatchlistInsightPanel";
import { WatchlistPipelineTabs } from "./WatchlistPipelineTabs";

export function WatchlistPage() {
  const data = watchlistPageData;
  const [activePipeline, setActivePipeline] = useState<WatchlistPipelineKey>("all");
  const [selectedTicker, setSelectedTicker] = useState(data.selectedTicker);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(data.selectedTicker);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredIdeas = useMemo(() => {
    if (activePipeline === "all") {
      return data.ideas;
    }

    return data.ideas.filter((idea) => idea.status === activePipeline);
  }, [activePipeline, data.ideas]);

  const selectedIdea = useMemo(
    () =>
      data.ideas.find((idea) => idea.ticker === selectedTicker) ??
      filteredIdeas[0] ??
      data.ideas[0],
    [data.ideas, filteredIdeas, selectedTicker]
  );

  function handleSelectTicker(ticker: string) {
    setSelectedTicker(ticker);
    setIsDetailOpen(true);
  }

  function handleToggleTicker(ticker: string) {
    setExpandedTicker((currentTicker) => (currentTicker === ticker ? null : ticker));
    setSelectedTicker(ticker);
  }

  if (data.isLoading) {
    return <LoadingState description={data.loading.content} title={data.loading.title} />;
  }

  if (data.ideas.length === 0) {
    return (
      <EmptyState
        description={data.emptyState.description}
        icon={data.emptyState.icon}
        title={data.emptyState.title}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <WatchlistHeader data={data.header} ideas={data.ideas} />
      <WatchlistPipelineTabs
        activeKey={activePipeline}
        ideas={data.ideas}
        onChange={setActivePipeline}
      />

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
          <WatchlistFilters data={data.filters} />
        </aside>

        <main className="space-y-4">
          <SectionHeader
            description="Bấm vào một cổ phiếu để xổ thông tin cần đọc. Hồ sơ sâu nằm trong panel chi tiết."
            title="Danh sách cổ phiếu"
          />
          <StockIdeaGrid
            data={filteredIdeas}
            expandedTicker={expandedTicker}
            onOpenDetails={handleSelectTicker}
            onToggle={handleToggleTicker}
          />
          <WatchlistDisclaimer data={data.disclaimer} />
        </main>
      </div>

      {selectedIdea ? (
        <WatchlistInsightPanel
          data={selectedIdea}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          simulationTracking={data.simulationTracking}
        />
      ) : null}
    </div>
  );
}
