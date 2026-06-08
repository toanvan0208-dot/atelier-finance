import { EmptyState, LoadingState, StepAccordion } from "@/components/ui";
import { technicalPageData } from "../data/technical.data";
import {
  CrossModuleAlignmentBlock,
  FomoBehaviorCheck,
  MarketPsychologyBlock,
  MovementExplanationBlock,
  NewsEventBlock,
  PersonalMarketObservation,
  PricePositionBlock,
  PriceVolumeStoryBlock,
  RelativeStrengthBlock,
  TechnicalOutputSummary,
  TimeframeSelectorBlock,
  TrendMapBlock,
  VolatilityBlock,
} from "./TechnicalCoreBlocks";
import { TechnicalDisclaimer, TechnicalNextActions } from "./TechnicalFooterBlocks";
import { TechnicalHeader } from "./TechnicalHeader";
import { PVTReadingPath } from "./PVTReadingPath";
import { TechnicalScanDashboard } from "./TechnicalScanDashboard";

export function TechnicalPage() {
  const data = technicalPageData;
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
      <TechnicalHeader data={data.header} />
      <TechnicalScanDashboard
        newsEvents={data.newsEvents}
        pricePosition={data.pricePosition}
        priceVolume={data.priceVolume}
        quickSummary={data.quickSummary}
        timeframe={data.timeframe}
        trendMap={data.trendMap}
        volatility={data.volatility}
      />
      <PVTReadingPath data={data.readingPath} />

      <StepAccordion
        title={data.progress.title}
        description={data.progress.description}
        items={[
          {
            key: "timeframe",
            order: steps[0].order,
            title: steps[0].title,
            status: steps[0].status,
            content: (
              <TimeframeSelectorBlock
                data={data.timeframe}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "trend-map",
            order: steps[1].order,
            title: steps[1].title,
            status: steps[1].status,
            content: <TrendMapBlock data={data.trendMap} detailLabels={data.detailLabels} />,
          },
          {
            key: "price-volume",
            order: steps[2].order,
            title: steps[2].title,
            status: steps[2].status,
            content: (
              <PriceVolumeStoryBlock
                data={data.priceVolume}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "relative-strength",
            order: steps[3].order,
            title: steps[3].title,
            status: steps[3].status,
            content: (
              <RelativeStrengthBlock
                data={data.relativeStrength}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "volatility",
            order: steps[4].order,
            title: steps[4].title,
            status: steps[4].status,
            content: <VolatilityBlock data={data.volatility} detailLabels={data.detailLabels} />,
          },
          {
            key: "price-position",
            order: steps[5].order,
            title: steps[5].title,
            status: steps[5].status,
            content: (
              <PricePositionBlock
                data={data.pricePosition}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "news-events",
            order: steps[6].order,
            title: steps[6].title,
            status: steps[6].status,
            content: <NewsEventBlock data={data.newsEvents} detailLabels={data.detailLabels} />,
          },
          {
            key: "movement-explanation",
            order: steps[7].order,
            title: steps[7].title,
            status: steps[7].status,
            content: (
              <MovementExplanationBlock
                data={data.movementExplanation}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "market-psychology",
            order: steps[8].order,
            title: steps[8].title,
            status: steps[8].status,
            content: (
              <MarketPsychologyBlock
                data={data.marketPsychology}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "fomo-check",
            order: steps[9].order,
            title: steps[9].title,
            status: steps[9].status,
            content: <FomoBehaviorCheck data={data.fomoCheck} detailLabels={data.detailLabels} />,
          },
          {
            key: "cross-module",
            order: steps[10].order,
            title: steps[10].title,
            status: steps[10].status,
            content: (
              <CrossModuleAlignmentBlock
                data={data.crossModuleAlignment}
                detailLabels={data.detailLabels}
              />
            ),
          },
          {
            key: "personal-observation",
            order: steps[11].order,
            title: steps[11].title,
            status: steps[11].status,
            content: (
              <div className="space-y-5">
                <PersonalMarketObservation data={data.personalObservation} />
                <TechnicalOutputSummary
                  data={data.outputSummary}
                  detailLabels={data.detailLabels}
                />
              </div>
            ),
          },
        ]}
      />

      <div className="space-y-5">
        <TechnicalDisclaimer data={data.disclaimer} />
        <TechnicalNextActions data={data.nextActions} />
      </div>
    </div>
  );
}
