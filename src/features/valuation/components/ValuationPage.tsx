import { EmptyState, LoadingState } from "@/components/ui";
import { valuationPageData } from "../data/valuation.data";
import {
  BusinessTypeValuationBlock,
  MarketPricingBlock,
  MethodSelectionBlock,
  NormalizedInputBlock,
  ValuationPrecheckBlock,
} from "./ValuationBasicBlocks";
import {
  CatalystRiskValuationBlock,
  HistoricalComparisonBlock,
  MarketExpectationBlock,
  ScenarioValuationBlock,
  ValuationMethodsBlock,
} from "./ValuationAnalysisBlocks";
import {
  MarginOfSafetyBlock,
  PersonalValuationThesis,
  ValuationConfidenceBlock,
  ValuationRangeSummaryBlock,
  ValuationTutorBlock,
} from "./ValuationSynthesisBlocks";
import { ValuationDisclaimer } from "./ValuationDisclaimer";
import { ValuationHeader } from "./ValuationHeader";
import { ValuationNextActions } from "./ValuationNextActions";
import { ValuationProgressSidebar } from "./ValuationProgressSidebar";
import { ValuationQuickSummary } from "./ValuationQuickSummary";

export function ValuationPage() {
  const data = valuationPageData;

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

  return (
    <div className="mx-auto w-full max-w-[980px] space-y-6">
      <ValuationHeader data={data.header} />
      <ValuationQuickSummary data={data.quickSummary} />

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <ValuationProgressSidebar data={data.progress} />

        <div className="space-y-5">
          <ValuationPrecheckBlock
            data={data.precheck}
            detailLabels={data.detailLabels}
          />
          <NormalizedInputBlock
            data={data.normalizedInput}
            detailLabels={data.detailLabels}
          />
          <BusinessTypeValuationBlock
            data={data.businessType}
            detailLabels={data.detailLabels}
          />
          <MarketPricingBlock
            data={data.marketPricing}
            detailLabels={data.detailLabels}
          />
          <MethodSelectionBlock
            data={data.methodSelection}
            detailLabels={data.detailLabels}
          />
          <ValuationMethodsBlock
            data={data.valuationMethods}
            detailLabels={data.detailLabels}
          />
          <HistoricalComparisonBlock
            data={data.historicalComparison}
            detailLabels={data.detailLabels}
          />
          <MarketExpectationBlock
            data={data.marketExpectation}
            detailLabels={data.detailLabels}
          />
          <ScenarioValuationBlock
            data={data.scenarios}
            detailLabels={data.detailLabels}
          />
          <CatalystRiskValuationBlock
            data={data.catalystRisk}
            detailLabels={data.detailLabels}
          />
          <MarginOfSafetyBlock
            data={data.marginOfSafety}
            detailLabels={data.detailLabels}
          />
          <ValuationConfidenceBlock
            data={data.confidence}
            detailLabels={data.detailLabels}
          />
          <ValuationRangeSummaryBlock
            data={data.rangeSummary}
            detailLabels={data.detailLabels}
          />
          <ValuationTutorBlock
            data={data.tutor}
            detailLabels={data.detailLabels}
          />
          <PersonalValuationThesis data={data.personalThesis} />
          <ValuationDisclaimer data={data.disclaimer} />
          <ValuationNextActions data={data.nextActions} />
        </div>
      </div>
    </div>
  );
}
