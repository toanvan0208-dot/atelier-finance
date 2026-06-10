import { EmptyState, LoadingState } from "@/components/ui";
import { valuationPageData } from "../data/valuation.data";
import { ValuationDisclaimer } from "./ValuationDisclaimer";
import { ValuationGroups } from "./ValuationGroups";
import { ValuationHeader } from "./ValuationHeader";
import { ValuationNextActions } from "./ValuationNextActions";
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
    <div className="mx-auto w-full max-w-[1040px] space-y-7">
      <ValuationHeader data={data.header} />
      <ValuationQuickSummary data={data.quickSummary} />
      <ValuationGroups groups={data.groups} />
      <ValuationDisclaimer data={data.disclaimer} />
      <ValuationNextActions data={data.nextActions} />
    </div>
  );
}
