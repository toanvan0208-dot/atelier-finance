import { EmptyState, LoadingState } from "@/components/ui";
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
import { TechnicalProgressSidebar } from "./TechnicalProgressSidebar";
import { TechnicalQuickSummary } from "./TechnicalQuickSummary";
import { PVTReadingPath } from "./PVTReadingPath";

export function TechnicalPage() {
  const data = technicalPageData;

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
      <TechnicalQuickSummary data={data.quickSummary} />
      <PVTReadingPath data={data.readingPath} />

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <TechnicalProgressSidebar data={data.progress} />

        <div className="space-y-5">
          <TimeframeSelectorBlock
            data={data.timeframe}
            detailLabels={data.detailLabels}
          />
          <TrendMapBlock
            data={data.trendMap}
            detailLabels={data.detailLabels}
          />
          <PriceVolumeStoryBlock
            data={data.priceVolume}
            detailLabels={data.detailLabels}
          />
          <RelativeStrengthBlock
            data={data.relativeStrength}
            detailLabels={data.detailLabels}
          />
          <VolatilityBlock
            data={data.volatility}
            detailLabels={data.detailLabels}
          />
          <PricePositionBlock
            data={data.pricePosition}
            detailLabels={data.detailLabels}
          />
          <NewsEventBlock
            data={data.newsEvents}
            detailLabels={data.detailLabels}
          />
          <MovementExplanationBlock
            data={data.movementExplanation}
            detailLabels={data.detailLabels}
          />
          <MarketPsychologyBlock
            data={data.marketPsychology}
            detailLabels={data.detailLabels}
          />
          <FomoBehaviorCheck
            data={data.fomoCheck}
            detailLabels={data.detailLabels}
          />
          <CrossModuleAlignmentBlock
            data={data.crossModuleAlignment}
            detailLabels={data.detailLabels}
          />
          <PersonalMarketObservation data={data.personalObservation} />
          <TechnicalOutputSummary
            data={data.outputSummary}
            detailLabels={data.detailLabels}
          />
          <TechnicalDisclaimer data={data.disclaimer} />
          <TechnicalNextActions data={data.nextActions} />
        </div>
      </div>
    </div>
  );
}
