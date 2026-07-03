"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import {
  riskRedesignDataByTicker,
  riskStatementSnapshotsByTicker,
} from "../data/riskRedesign.data";
import { buildRiskDeskData } from "../lib/build-risk-desk-data";
import type { RiskStatementSnapshot } from "../lib/map-risk-to-logic-input";
import { CriticalRiskCards } from "./CriticalRiskCards";
import { RiskFinalConclusion } from "./RiskFinalConclusion";
import { RiskHeroSummary } from "./RiskHeroSummary";
import { RiskSourceMap } from "./RiskSourceMap";
import { StopConditionPanel } from "./StopConditionPanel";
import { ThesisBreakerPanel } from "./ThesisBreakerPanel";

type RiskPageProps = {
  initialFinancialsRuntimeData?: FinancialsRuntimeData;
  onNavigate: (key: string) => void;
};

const navigationChangeEvent = "app:navigation";

const normalizeTicker = (ticker: string | null | undefined): string | null => {
  const normalized = ticker?.trim().toUpperCase();
  return normalized || null;
};

const useRiskTickerFromUrl = () =>
  useSyncExternalStore(
    (callback) => {
      const timeoutId = window.setTimeout(callback, 0);
      window.addEventListener("popstate", callback);
      window.addEventListener(navigationChangeEvent, callback);
      return () => {
        window.clearTimeout(timeoutId);
        window.removeEventListener("popstate", callback);
        window.removeEventListener(navigationChangeEvent, callback);
      };
    },
    () => normalizeTicker(new URLSearchParams(window.location.search).get("ticker")),
    () => null,
  );

const runtimeSnapshotForRisk = (
  runtimeData: FinancialsRuntimeData | undefined,
  fallbackSnapshot: RiskStatementSnapshot,
): RiskStatementSnapshot | null => {
  if (!runtimeData?.statementSnapshot) return null;
  const runtimeTicker = normalizeTicker(runtimeData.source.ticker);
  const fallbackTicker = normalizeTicker(fallbackSnapshot.ticker);
  if (!runtimeTicker || runtimeTicker !== fallbackTicker) return null;

  return {
    ...fallbackSnapshot,
    ...runtimeData.statementSnapshot,
    ticker: runtimeTicker,
    companyName: fallbackSnapshot.companyName,
    industry: fallbackSnapshot.industry,
    period: runtimeData.statementSnapshot.period ?? String(runtimeData.source.fiscalYear ?? ""),
    sourceName: runtimeData.statementSnapshot.sourceName ?? runtimeData.source.sourceLabel,
    collectedAt: runtimeData.source.asOf,
  };
};

export function RiskPage({ initialFinancialsRuntimeData, onNavigate }: RiskPageProps) {
  const tickerFromUrl = useRiskTickerFromUrl();
  const ticker = tickerFromUrl ?? normalizeTicker(initialFinancialsRuntimeData?.source.ticker) ?? "FPT";
  const fallbackData = riskRedesignDataByTicker[ticker] ?? riskRedesignDataByTicker.FPT;
  const fallbackSnapshot = riskStatementSnapshotsByTicker[ticker] ?? riskStatementSnapshotsByTicker.FPT;
  const runtimeSnapshot = runtimeSnapshotForRisk(initialFinancialsRuntimeData, fallbackSnapshot);
  const data = useMemo(
    () => (runtimeSnapshot ? buildRiskDeskData(fallbackData, runtimeSnapshot) : fallbackData),
    [fallbackData, runtimeSnapshot],
  );
  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <RiskHeroSummary data={data} />
      <CriticalRiskCards risks={data.topRisks} onNavigate={onNavigate} />
      <ThesisBreakerPanel items={data.thesisBreakers} onNavigate={onNavigate} />
      <RiskSourceMap sources={data.riskSources} onNavigate={onNavigate} />
      <StopConditionPanel
        stopConditions={data.stopConditions}
        timeline={data.riskTimeline}
        reverseRiskNote={data.reverseRiskNote}
      />
      <RiskFinalConclusion
        conclusion={data.finalConclusion}
        actions={data.nextActions}
        onNavigate={onNavigate}
      />
    </div>
  );
}
