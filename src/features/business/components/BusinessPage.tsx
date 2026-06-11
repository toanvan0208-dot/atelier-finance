import { EmptyState, LoadingState } from "@/components/ui";
import { businessPageData } from "../data/business.data";
import { BusinessAnalysisGroups } from "./BusinessAnalysisGroups";
import { BusinessBctcBridge } from "./BusinessBctcBridge";
import { BusinessConclusion } from "./BusinessConclusion";
import { BusinessDisclaimer } from "./BusinessDisclaimer";
import { BusinessHeader } from "./BusinessHeader";
import { BusinessNextActions } from "./BusinessNextActions";
import { BusinessUnderstandingDashboard } from "./BusinessUnderstandingDashboard";

export function BusinessPage() {
  const data = businessPageData;
  const canGoToFinancials = true;

  if (data.isLoading) {
    return (
      <LoadingState
        description={data.loading.description}
        title={data.loading.title}
      />
    );
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
      <BusinessHeader
        canGoToFinancials={canGoToFinancials}
        data={data.header}
      />
      <BusinessUnderstandingDashboard
        canGoToFinancials={canGoToFinancials}
        data={data.dashboard}
      />
      <BusinessAnalysisGroups groups={data.groups} />
      <BusinessConclusion canGoToFinancials={canGoToFinancials} data={data.conclusion} />
      <BusinessBctcBridge
        canGoToFinancials={canGoToFinancials}
        data={data.bctcBridge}
      />
      <BusinessNextActions
        canGoToFinancials={canGoToFinancials}
        data={data.nextActions}
      />
      <BusinessDisclaimer data={data.disclaimer} />
    </div>
  );
}
