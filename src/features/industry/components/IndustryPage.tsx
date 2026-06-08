"use client";

import { useMemo, useState } from "react";
import { EmptyState, LoadingState, StepAccordion } from "@/components/ui";
import { industryOptions, industryPageData } from "../data/industry.data";
import {
  IndustryBlock,
  IndustryDisclaimer,
  IndustryHeader,
  IndustryInsightPanel,
  IndustryNextActions,
  IndustryQuickOverview,
  IndustrySelector,
} from "./IndustryBlocks";

export function IndustryPage() {
  const [selectedIndustryId, setSelectedIndustryId] = useState(industryOptions[0].id);
  const selectedIndustry = useMemo(
    () =>
      industryOptions.find((industry) => industry.id === selectedIndustryId) ??
      industryOptions[0],
    [selectedIndustryId]
  );
  const data = useMemo(
    () => ({
      ...industryPageData,
      header: {
        ...industryPageData.header,
        industryName: selectedIndustry.name,
        industryType: selectedIndustry.industryType,
        status: selectedIndustry.status,
      },
      quickOverview: {
        ...industryPageData.quickOverview,
        metrics: industryPageData.quickOverview.metrics.map((metric, index) =>
          index === 0
            ? {
                ...metric,
                value: selectedIndustry.shortName,
                description: selectedIndustry.description,
              }
            : metric
        ),
        answers: selectedIndustry.quickAnswers,
      },
      tutor: {
        ...industryPageData.tutor,
        notes: selectedIndustry.tutorNotes,
      },
    }),
    [selectedIndustry]
  );

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
      <IndustrySelector
        options={industryOptions}
        selectedId={selectedIndustryId}
        onSelect={setSelectedIndustryId}
      />
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
