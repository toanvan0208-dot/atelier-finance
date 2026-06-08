import { EmptyState, LoadingState, StepAccordion } from "@/components/ui";
import { riskPageData } from "../data/risk.data";
import {
  RiskDetailCard,
  RiskDisclaimer,
  RiskHeader,
  RiskNextActions,
  RiskOverview,
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

      <StepAccordion
        title={data.journey.title}
        description={data.journey.description}
        items={data.journey.steps.map((step, index) => {
          const group = data.riskGroups[index];

          return {
            key: group?.id ?? step.title,
            order: step.order,
            title: step.title,
            status: step.status,
            description: step.question,
            meta: step.source,
            content: (
              <div className="space-y-5">
                {index === 0 ? <RiskStatusLegend data={data.statusLegend} /> : null}
                {group ? (
                  <RiskDetailCard
                    data={group}
                    detailLabels={data.detailLabels}
                  />
                ) : null}
              </div>
            ),
          };
        })}
      />

      <div className="space-y-5">
        <RiskDisclaimer data={data.disclaimer} />
        <RiskNextActions data={data.nextActions} />
      </div>
    </div>
  );
}
