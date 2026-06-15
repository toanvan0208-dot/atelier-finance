"use client";

import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
import { EmptyState, LoadingState } from "@/components/ui";
import { valuationDataQuality, valuationRefactoredData } from "../data/valuationRefactored.data";
import { ValuationAssumptionPanel } from "./ValuationAssumptionPanel";
import { ValuationFinalConclusion } from "./ValuationFinalConclusion";
import { ValuationMethodSelector } from "./ValuationMethodSelector";
import { ValuationNextStepActions } from "./ValuationNextStepActions";
import { ValuationRangeTable } from "./ValuationRangeTable";
import { ValuationScenarioSafety } from "./ValuationScenarioSafety";
import { ValuationSummaryHero } from "./ValuationSummaryHero";
import { ValuationTrapList } from "./ValuationTrapList";
import { ValuationUncertaintyPanel } from "./ValuationUncertaintyPanel";

type ValuationPageProps = {
  onNavigate?: (moduleKey: string) => void;
};

export function ValuationPage({ onNavigate }: ValuationPageProps) {
  const data = valuationRefactoredData;

  if (data.isLoading) {
    return <LoadingState description={data.loading.content} title={data.loading.title} />;
  }

  if (!data.summary.ticker) {
    return (
      <EmptyState
        description={data.emptyState.description}
        icon={data.emptyState.icon}
        title={data.emptyState.title}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-5">
      <DataQualityBanner {...valuationDataQuality} />
      <ValuationSummaryHero data={data.summary} />
      <ValuationAssumptionPanel data={data.assumptions} />
      <ValuationUncertaintyPanel data={data.uncertainties} onNavigate={onNavigate} />
      <ValuationMethodSelector data={data.methods} />
      <ValuationRangeTable data={data.ranges} />
      <ValuationScenarioSafety data={data.scenarios} />
      <ValuationTrapList data={data.traps} />
      <ValuationFinalConclusion data={data.finalConclusion} />
      <ValuationNextStepActions data={data.nextActions} onNavigate={onNavigate} />
    </div>
  );
}
