"use client";

import { useMemo, useState } from "react";
import { EmptyState, LoadingState } from "@/components/ui";
import { industryOptions, industryPageData } from "../data/industry.data";
import {
  IndustryConclusionBuilder,
  IndustryDisclaimer,
  IndustryJourneyBuilder,
  IndustryQuickSnapshot,
  IndustrySelector,
  IndustryStepDetailModal,
  IndustryThesisHeader,
  IndustryThesisMap,
} from "./IndustryBlocks";

export function IndustryPage() {
  const [selectedIndustryId, setSelectedIndustryId] = useState(industryOptions[0].id);
  const [activeStepId, setActiveStepId] = useState(industryPageData.blocks[0]?.id ?? "");
  const [openStepId, setOpenStepId] = useState<string | null>(null);
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
    }),
    [selectedIndustry]
  );
  const activeStep =
    data.blocks.find((block) => block.id === activeStepId) ?? data.blocks[0];
  const openStep = openStepId
    ? data.blocks.find((block) => block.id === openStepId) ?? null
    : null;

  const handleSelectStep = (stepId: string) => {
    setActiveStepId(stepId);
    setOpenStepId(stepId);
  };

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
      <IndustryThesisHeader selectedIndustry={selectedIndustry} />
      <IndustryQuickSnapshot selectedIndustry={selectedIndustry} />
      <IndustryThesisMap />

      <main className="space-y-5">
        <IndustryJourneyBuilder
          activeStepId={activeStep?.id ?? ""}
          blocks={data.blocks}
          onSelectStep={handleSelectStep}
        />

        <IndustryConclusionBuilder selectedIndustry={selectedIndustry} />

        <IndustryDisclaimer
          content={data.disclaimer.content}
          title={data.disclaimer.title}
        />
      </main>

      {openStep ? (
        <IndustryStepDetailModal
          block={openStep}
          onClose={() => setOpenStepId(null)}
        />
      ) : null}
    </div>
  );
}
