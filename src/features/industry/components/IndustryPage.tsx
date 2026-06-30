"use client";

import { useMemo, useState } from "react";
import { EmptyState, LoadingState } from "@/components/ui";
import { MacroIndustryReadinessSkeleton } from "@/features/macro/components/MacroIndustryReadinessSkeleton";
import { industryPageData } from "../data/industry.data";
import { industryCompassData } from "../data/industryCompass.data";
import type { IndustryContextRuntimePayload } from "../lib/load-industry-context";
import {
  IndustryCompanyMapSection,
  IndustryConditionalConclusion,
  IndustryCurrentHeader,
  IndustryDataConfirmationSection,
  IndustryMacroPressureSection,
  IndustryMoneyMap,
  IndustryQuickPicture,
} from "./IndustryCompassSections";

type IndustryPageProps = {
  initialIndustryContexts?: Record<string, IndustryContextRuntimePayload>;
  onNavigate?: (moduleKey: string) => void;
};

export function IndustryPage({ initialIndustryContexts = {}, onNavigate }: IndustryPageProps) {
  const [selectedIndustryId, setSelectedIndustryId] = useState(
    industryCompassData.industries[0]?.id ?? ""
  );
  const selectedIndustry = useMemo(
    () =>
      industryCompassData.industries.find((industry) => industry.id === selectedIndustryId) ??
      industryCompassData.industries[0],
    [selectedIndustryId]
  );
  const selectedIndustryContexts = useMemo(
    () =>
      selectedIndustry?.relatedTickers.map((ticker) => initialIndustryContexts[ticker]).filter(Boolean) ?? [],
    [initialIndustryContexts, selectedIndustry]
  );

  if (industryPageData.isLoading) {
    return (
      <LoadingState
        description={industryPageData.loading.description}
        title={industryPageData.loading.title}
      />
    );
  }

  if (!selectedIndustry) {
    return (
      <EmptyState
        description={industryPageData.emptyState.description}
        icon={industryPageData.emptyState.icon}
        title={industryPageData.emptyState.title}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-8">
      <MacroIndustryReadinessSkeleton domain="industry" />
      <IndustryCurrentHeader
        industries={industryCompassData.industries}
        industryContexts={selectedIndustryContexts}
        selectedIndustry={selectedIndustry}
        onSelectIndustry={setSelectedIndustryId}
      />
      <IndustryQuickPicture selectedIndustry={selectedIndustry} />
      <IndustryMoneyMap
        selectedIndustry={selectedIndustry}
        termTips={industryCompassData.termTips}
      />
      <IndustryMacroPressureSection selectedIndustry={selectedIndustry} />
      <IndustryDataConfirmationSection
        selectedIndustry={selectedIndustry}
        termTips={industryCompassData.termTips}
      />
      <IndustryConditionalConclusion
        selectedIndustry={selectedIndustry}
        onNavigate={onNavigate}
      />
      <IndustryCompanyMapSection
        selectedIndustry={selectedIndustry}
        onNavigate={onNavigate}
      />
    </div>
  );
}
