import { EmptyState, LoadingState, StepAccordion } from "@/components/ui";
import { industryPageData } from "../data/industry.data";
import {
  IndustryBlock,
  IndustryDisclaimer,
  IndustryHeader,
  IndustryInsightPanel,
  IndustryNextActions,
  IndustryQuickOverview,
  IndustryTutorNote,
} from "./IndustryBlocks";

export function IndustryPage() {
  const data = industryPageData;

  if (data.isLoading) {
    return (
      <LoadingState
        description={data.loading.description}
        title={data.loading.title}
      />
    );
  }

  if (!data.header.industryName) {
    return (
      <EmptyState
        description={data.emptyState.description}
        icon={data.emptyState.icon}
        title={data.emptyState.title}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6">
      <IndustryHeader data={data.header} />
      <IndustryQuickOverview data={data.quickOverview} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-5">
          <StepAccordion
            title={data.journey.title}
            description={data.journey.description}
            items={data.journey.steps.map((step, index) => {
              const block = data.blocks[index];

              return {
                key: block?.id ?? step.title,
                order: block?.stepNumber ?? index + 1,
                title: step.title,
                status: step.status,
                description: step.question,
                meta: `${step.group} - ${step.linkedModule}`,
                content: block ? <IndustryBlock data={block} /> : null,
              };
            })}
          />

          <IndustryTutorNote data={data.tutor} />
          <IndustryDisclaimer
            content={data.disclaimer.content}
            title={data.disclaimer.title}
          />
          <IndustryNextActions
            actions={data.nextActions.actions}
            description={data.nextActions.description}
            title={data.nextActions.title}
          />
        </main>

        <IndustryInsightPanel data={data.insightPanel} />
      </div>
    </div>
  );
}
