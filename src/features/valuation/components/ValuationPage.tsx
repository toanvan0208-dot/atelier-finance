import { EmptyState, LoadingState, StepAccordion } from "@/components/ui";
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
import { ValuationQuickSummary } from "./ValuationQuickSummary";

export function ValuationPage() {
  const data = valuationPageData;
  const steps = data.progress.steps;

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

      <StepAccordion
        title={data.progress.title}
        description={data.progress.description}
        items={[
          {
            key: "precheck",
            order: steps[0].order,
            title: steps[0].title,
            status: steps[0].status,
            content: <ValuationPrecheckBlock data={data.precheck} detailLabels={data.detailLabels} />,
          },
          {
            key: "normalized-input",
            order: steps[1].order,
            title: steps[1].title,
            status: steps[1].status,
            content: (
              <NormalizedInputBlock
                data={data.normalizedInput}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "business-type",
            order: steps[2].order,
            title: steps[2].title,
            status: steps[2].status,
            content: (
              <BusinessTypeValuationBlock
                data={data.businessType}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "market-pricing",
            order: steps[3].order,
            title: steps[3].title,
            status: steps[3].status,
            content: (
              <MarketPricingBlock
                data={data.marketPricing}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "method-selection",
            order: steps[4].order,
            title: steps[4].title,
            status: steps[4].status,
            content: (
              <MethodSelectionBlock
                data={data.methodSelection}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "valuation-methods",
            order: steps[5].order,
            title: steps[5].title,
            status: steps[5].status,
            content: (
              <ValuationMethodsBlock
                data={data.valuationMethods}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "historical-comparison",
            order: steps[6].order,
            title: steps[6].title,
            status: steps[6].status,
            content: (
              <HistoricalComparisonBlock
                data={data.historicalComparison}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "market-expectation",
            order: steps[7].order,
            title: steps[7].title,
            status: steps[7].status,
            content: (
              <MarketExpectationBlock
                data={data.marketExpectation}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "scenarios",
            order: steps[8].order,
            title: steps[8].title,
            status: steps[8].status,
            content: (
              <ScenarioValuationBlock
                data={data.scenarios}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "catalyst-risk",
            order: steps[9].order,
            title: steps[9].title,
            status: steps[9].status,
            content: (
              <CatalystRiskValuationBlock
                data={data.catalystRisk}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "margin-of-safety",
            order: steps[10].order,
            title: steps[10].title,
            status: steps[10].status,
            content: (
              <MarginOfSafetyBlock
                data={data.marginOfSafety}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "confidence",
            order: steps[11].order,
            title: steps[11].title,
            status: steps[11].status,
            content: (
              <ValuationConfidenceBlock
                data={data.confidence}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "range-summary",
            order: steps[12].order,
            title: steps[12].title,
            status: steps[12].status,
            content: (
              <ValuationRangeSummaryBlock
                data={data.rangeSummary}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "tutor",
            order: steps[13].order,
            title: steps[13].title,
            status: steps[13].status,
            content: <ValuationTutorBlock data={data.tutor} detailLabels={data.detailLabels} />,
          },
          {
            key: "personal-thesis",
            order: steps[14].order,
            title: steps[14].title,
            status: steps[14].status,
            content: <PersonalValuationThesis data={data.personalThesis} />,
          },
        ]}
      />

      <div className="space-y-5">
        <ValuationDisclaimer data={data.disclaimer} />
        <ValuationNextActions data={data.nextActions} />
      </div>
    </div>
  );
}
