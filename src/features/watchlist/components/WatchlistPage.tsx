"use client";

import { useMemo } from "react";
import { EmptyState, LoadingState } from "@/components/ui";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import { watchlistPageData } from "../data/watchlist.data";
import type { StockIdea, WatchlistFilterState } from "../types";
import { StockIdeaGrid } from "./StockIdeaGrid";
import { WatchlistDisclaimer } from "./WatchlistDisclaimer";
import { WatchlistFilters } from "./WatchlistFilters";
import { WatchlistHeader } from "./WatchlistHeader";

function ideaHasMissingThesis(idea: StockIdea) {
  return !idea.thesis || idea.thesis.toLowerCase().includes("chưa có thesis");
}

function ideaHasFomo(idea: StockIdea) {
  return idea.tags.some((tag) => tag.toLowerCase().includes("fomo")) ||
    idea.risks.some((risk) => risk.toLowerCase().includes("fomo")) ||
    idea.emotionalState.toLowerCase().includes("fomo");
}

function priorityRank(priority: string) {
  if (priority.toLowerCase().includes("cao")) return 0;
  if (priority.toLowerCase().includes("vừa")) return 1;
  if (priority.toLowerCase().includes("nhẹ")) return 2;
  return 3;
}

function progressScore(idea: StockIdea) {
  return idea.progress.filter((item) => item.status === "Đã xong" || item.status === "Có thể chuyển tiếp").length;
}

function eventDateValue(idea: StockIdea) {
  return idea.events[0]?.date ? new Date(idea.events[0].date).getTime() : 0;
}

function applyFilters(ideas: StockIdea[], filters: WatchlistFilterState) {
  const search = filters.search?.trim().toLowerCase();

  const filtered = ideas.filter((idea) => {
    if (filters.pipelineStatus && filters.pipelineStatus !== "all" && idea.status !== filters.pipelineStatus) return false;
    if (filters.industry && idea.industry !== filters.industry) return false;
    if (filters.priority && idea.priority !== filters.priority) return false;
    if (filters.missingModule && !idea.missingModules.includes(filters.missingModule)) return false;
    if (filters.mainRisk && !idea.risks.includes(filters.mainRisk)) return false;
    if (filters.hasEvent && idea.events.length === 0 && idea.alerts.length === 0) return false;
    if (filters.thesisStatus === "missing" && !ideaHasMissingThesis(idea)) return false;
    if (filters.readyForSimulation && idea.status !== "Sẵn sàng mô phỏng") return false;
    if (filters.pausedOnly && idea.status !== "Tạm loại") return false;
    if (filters.fomoWarning && !ideaHasFomo(idea)) return false;
    if (search) {
      const haystack = [
        idea.ticker,
        idea.companyName,
        idea.industry,
        idea.reason,
        idea.thesis,
        idea.nextStep,
        ...idea.tags,
        ...idea.risks,
        ...idea.missingModules,
      ].join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case "priority":
        return priorityRank(a.priority) - priorityRank(b.priority);
      case "reviewDate":
        return eventDateValue(b) - eventDateValue(a);
      case "missingThesis":
        return Number(ideaHasMissingThesis(b)) - Number(ideaHasMissingThesis(a));
      case "eventDate":
        return eventDateValue(b) - eventDateValue(a);
      case "progress":
        return progressScore(b) - progressScore(a);
      case "recentlyAdded":
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      default:
        return 0;
    }
  });
}

type WatchlistPageProps = {
  onNavigate: (key: string) => void;
};

type WatchlistPersistentState = {
  filters: WatchlistFilterState;
  openTickers: string[];
};

const watchlistStorageKey = "atelier-finance.watchlist.v1";
const defaultWatchlistFilters: WatchlistFilterState = {
  sortBy: "priority",
  pipelineStatus: "all",
};

export function WatchlistPage({ onNavigate }: WatchlistPageProps) {
  const data = watchlistPageData;
  const [persistedState, setPersistedState] = useLocalStorageState<WatchlistPersistentState>(
    watchlistStorageKey,
    {
      filters: defaultWatchlistFilters,
      openTickers: [data.selectedTicker],
    }
  );
  const { filters, openTickers } = persistedState;

  const filteredIdeas = useMemo(() => applyFilters(data.ideas, filters), [data.ideas, filters]);

  function handleToggleIdea(ticker: string) {
    setPersistedState((current) => ({
      ...current,
      openTickers: current.openTickers.includes(ticker)
        ? current.openTickers.filter((item) => item !== ticker)
        : [...current.openTickers, ticker],
    }));
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

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
          <WatchlistFilters
            filteredCount={filteredIdeas.length}
            filters={filters}
            ideas={data.ideas}
            onChange={(nextFilters) =>
              setPersistedState((current) => ({ ...current, filters: nextFilters }))
            }
            totalCount={data.ideas.length}
          />
        </aside>

        <main className="space-y-4">
          <StockIdeaGrid
            data={filteredIdeas}
            filteredCount={filteredIdeas.length}
            onNavigateModule={onNavigate}
            onToggleIdea={handleToggleIdea}
            openTickers={openTickers}
            totalCount={data.ideas.length}
          />
          <WatchlistDisclaimer data={data.disclaimer} />
        </main>
      </div>

    </div>
  );
}
