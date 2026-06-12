"use client";

import { useState } from "react";
import { LoadingState } from "@/components/ui";
import { screeningGuideData } from "../data/screeningGuide.data";
import { screeningPageData } from "../data/screening.data";
import type { ScreeningCandidate, ScreeningMode } from "../types";
import {
  ScreeningComparisonPanel,
  ScreeningConclusionPanel,
  ScreeningCurrentQuery,
  ScreeningFunnelSteps,
  ScreeningMethodSection,
  ScreeningReasonDrawer,
  ScreeningResultSection,
  useComparisonSelection,
} from "./ScreeningGuideSections";

type ScreeningPageProps = {
  onNavigate?: (moduleKey: string) => void;
};

export function ScreeningPage({ onNavigate }: ScreeningPageProps) {
  const [mode, setMode] = useState<ScreeningMode>("context");
  const [explainedCandidate, setExplainedCandidate] = useState<ScreeningCandidate | null>(null);
  const { onToggleCompare, selectedCompare } = useComparisonSelection();

  if (screeningPageData.isLoading) {
    return (
      <LoadingState
        description={screeningPageData.loading.description}
        title={screeningPageData.loading.title}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-8">
      <ScreeningCurrentQuery
        data={screeningGuideData.currentQuery}
        mode={mode}
        onModeChange={setMode}
      />
      <ScreeningMethodSection data={screeningGuideData.method} />
      <ScreeningFunnelSteps gates={screeningGuideData.method.gates} />
      <ScreeningResultSection
        candidates={screeningGuideData.candidates}
        groups={screeningGuideData.resultGroups}
        selectedCompare={selectedCompare}
        onExplain={setExplainedCandidate}
        onToggleCompare={onToggleCompare}
      />
      <ScreeningComparisonPanel
        candidates={screeningGuideData.candidates}
        selectedCompare={selectedCompare}
        termTips={screeningGuideData.termTips}
      />
      <ScreeningConclusionPanel
        data={screeningGuideData.conclusion}
        onNavigate={onNavigate}
      />
      <ScreeningReasonDrawer
        candidate={explainedCandidate}
        gates={screeningGuideData.method.gates}
        termTips={screeningGuideData.termTips}
        onClose={() => setExplainedCandidate(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
