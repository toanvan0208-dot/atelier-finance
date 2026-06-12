import { useState } from "react";
import { EmptyState, LoadingState } from "@/components/ui";
import { financialReadingDeskData } from "../data/financialReadingDesk.data";
import { financialsPageData } from "../data/financials.data";
import { FinancialConclusionPanel } from "./FinancialConclusionPanel";
import { FinancialReadingJourney } from "./FinancialReadingJourney";
import { FinancialsDisclaimer } from "./FinancialsDisclaimer";
import { FinancialsHeader } from "./FinancialsHeader";
import { FinancialsOverviewPanel } from "./FinancialsOverviewPanel";

export function FinancialsPage() {
  const data = financialsPageData;
  const deskData = financialReadingDeskData;
  const [activeStepId, setActiveStepId] = useState(deskData.nextReadingStep.stepId);

  if (data.isLoading) {
    return <LoadingState description={data.loading.content} title={data.loading.title} />;
  }

  if (!data.header.ticker) {
    return (
      <EmptyState
        description={data.emptyState.description}
        icon={data.emptyState.icon}
        title={data.emptyState.title}
      />
    );
  }

  const focusStep = (stepId: string) => {
    setActiveStepId(stepId);
    window.setTimeout(() => {
      document.getElementById("financial-reading-journey")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-6">
      <FinancialsHeader
        canContinueToValuation={false}
        data={data.header}
        valuationDisabledReason={deskData.valuationReadiness.reason}
      />
      <FinancialsOverviewPanel data={deskData} onFocusStep={focusStep} />
      <FinancialReadingJourney
        activeStepId={activeStepId}
        data={deskData}
        onActiveStepChange={setActiveStepId}
      />
      <FinancialConclusionPanel data={deskData.conclusion} />
      <FinancialsDisclaimer data={data.disclaimer} />
    </div>
  );
}
