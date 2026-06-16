"use client";

import { useMemo, useState } from "react";
import { EmptyState, LoadingState } from "@/components/ui";
import { industryPageData } from "../data/industry.data";
import { industryCompassData } from "../data/industryCompass.data";
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
  onNavigate?: (moduleKey: string) => void;
};

export function IndustryPage({ onNavigate }: IndustryPageProps) {
  const [selectedIndustryId, setSelectedIndustryId] = useState(
    industryCompassData.industries[0]?.id ?? ""
  );
  const selectedIndustry = useMemo(
    () =>
      industryCompassData.industries.find((industry) => industry.id === selectedIndustryId) ??
      industryCompassData.industries[0],
    [selectedIndustryId]
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
      <IndustryCurrentHeader
        industries={industryCompassData.industries}
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
