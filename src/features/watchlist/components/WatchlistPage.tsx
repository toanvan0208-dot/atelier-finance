"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState, LoadingState } from "@/components/ui";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import { watchlistPageData } from "../data/watchlist.data";
import type { PortfolioReadinessResult } from "../lib/load-portfolio-readiness";
import type { StockIdea, WatchlistFilterState } from "../types";
import { PortfolioReadinessPanel } from "./PortfolioReadinessPanel";
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
  onNavigate: (key: string, params?: { ticker?: string }) => void;
  portfolioReadiness?: PortfolioReadinessResult | null;
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

type WatchlistApiItem = {
  company?: {
    companyName?: string | null;
    exchange?: string | null;
    industryName?: string | null;
  } | null;
  createdAt?: string;
  notes?: string | null;
  priority?: string | null;
  status?: string | null;
  thesisSummary?: string | null;
  ticker: string;
};

type WatchlistApiBody = {
  ok?: boolean;
  data?: WatchlistApiItem[];
};

function mapWatchlistItemToIdea(item: WatchlistApiItem, fallbackIdeas: StockIdea[]): StockIdea {
  const ticker = item.ticker.toUpperCase();
  const existing = fallbackIdeas.find((idea) => idea.ticker === ticker);
  const fallback = existing ?? fallbackIdeas[0];

  return {
    ...fallback,
    addedDate: item.createdAt ? item.createdAt.slice(0, 10) : fallback.addedDate,
    companyName: item.company?.companyName ?? fallback.companyName,
    exchange: item.company?.exchange ?? fallback.exchange,
    industry: item.company?.industryName ?? fallback.industry,
    latestNote: item.notes ?? fallback.latestNote,
    priority: item.priority ?? fallback.priority,
    reason: item.notes ?? fallback.reason,
    status: fallback.status,
    thesis: item.thesisSummary ?? fallback.thesis,
    ticker,
  };
}

export function WatchlistPage({ onNavigate, portfolioReadiness }: WatchlistPageProps) {
  const data = watchlistPageData;
  const [userIdeas, setUserIdeas] = useState<StockIdea[] | null>(null);
  const [persistedState, setPersistedState] = useLocalStorageState<WatchlistPersistentState>(
    watchlistStorageKey,
    {
      filters: defaultWatchlistFilters,
      openTickers: [data.selectedTicker],
    }
  );
  const { filters, openTickers } = persistedState;
  const ideas = userIdeas ?? data.ideas;

  useEffect(() => {
    let cancelled = false;

    async function loadUserWatchlist() {
      const response = await fetch("/api/watchlist");
      if (!response.ok) return;

      const body = await response.json().catch(() => null) as WatchlistApiBody | null;
      if (cancelled || !body?.ok || !Array.isArray(body.data)) return;

      setUserIdeas(body.data.map((item) => mapWatchlistItemToIdea(item, data.ideas)));
    }

    void loadUserWatchlist();

    return () => {
      cancelled = true;
    };
  }, [data.ideas]);

  const filteredIdeas = useMemo(() => applyFilters(ideas, filters), [ideas, filters]);
  const headerData = useMemo(() => ({
    ...data.header,
    reviewCount: ideas.filter((idea) => String(idea.status) === "Cáº§n xem láº¡i").length,
    simulationReadyCount: ideas.filter((idea) => String(idea.status) === "Sáºµn sÃ ng mÃ´ phá»ng").length,
    totalIdeas: ideas.length,
  }), [data.header, ideas]);

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

  if (ideas.length === 0) {
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
      <WatchlistHeader data={headerData} ideas={ideas} />

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
          <WatchlistFilters
            filteredCount={filteredIdeas.length}
            filters={filters}
            ideas={ideas}
            onChange={(nextFilters) =>
              setPersistedState((current) => ({ ...current, filters: nextFilters }))
            }
            totalCount={ideas.length}
          />
        </aside>

        <main className="space-y-4">
          <PortfolioReadinessPanel data={portfolioReadiness} />
          <StockIdeaGrid
            data={filteredIdeas}
            filteredCount={filteredIdeas.length}
            onNavigateModule={onNavigate}
            onToggleIdea={handleToggleIdea}
            openTickers={openTickers}
            totalCount={ideas.length}
          />
          <WatchlistDisclaimer data={data.disclaimer} />
        </main>
      </div>

    </div>
  );
}
