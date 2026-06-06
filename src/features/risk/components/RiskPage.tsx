import { EmptyState, LoadingState } from "@/components/ui";
import { riskPageData } from "../data/risk.data";
import {
  RiskDetailCard,
  RiskDisclaimer,
  RiskFinalNote,
  RiskHeader,
  RiskNextActions,
  RiskOverview,
  RiskProgressSidebar,
  RiskStatusLegend,
} from "./RiskUi";

export function RiskPage() {
  const data = riskPageData;

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
      <RiskHeader data={data.header} />
      <RiskOverview data={data.overview} />

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <RiskProgressSidebar data={data.journey} />

        <div className="space-y-5">
          <RiskStatusLegend data={data.statusLegend} />
          {data.riskGroups.map((group) => (
            <RiskDetailCard
              key={group.id}
              data={group}
              detailLabels={data.detailLabels}
            />
          ))}
          <RiskFinalNote data={data.finalNote} />
          <RiskDisclaimer data={data.disclaimer} />
          <RiskNextActions data={data.nextActions} />
        </div>
      </div>
    </div>
  );
}
