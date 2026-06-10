import { EmptyState, LoadingState } from "@/components/ui";
import { technicalPageData } from "../data/technical.data";
import { TechnicalDisclaimer, TechnicalNextActions } from "./TechnicalFooterBlocks";
import { TechnicalHeader } from "./TechnicalHeader";
import { TechnicalProgressCards } from "./TechnicalProgressCards";
import { TechnicalScanDashboard } from "./TechnicalScanDashboard";

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
      <TechnicalScanDashboard
        newsEvents={data.newsEvents}
        pricePosition={data.pricePosition}
        priceVolume={data.priceVolume}
        quickSummary={data.quickSummary}
        timeframe={data.timeframe}
        trendMap={data.trendMap}
        volatility={data.volatility}
      />
      <TechnicalProgressCards data={data.progress} />

      <div className="space-y-5">
        <TechnicalDisclaimer data={data.disclaimer} />
        <TechnicalNextActions data={data.nextActions} />
      </div>
    </div>
  );
}
