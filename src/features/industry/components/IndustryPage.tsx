"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, Chip, EmptyState, LoadingState, SectionHeader } from "@/components/ui";
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

const industryCodeByCompassKey: Record<string, string> = {
  consumer_staples_dairy: "CONSUMER_STAPLES_DAIRY",
  retail: "RETAIL",
  steel_materials: "STEEL_MATERIALS",
};

const runtimeDataModeLabel = (value: string | null | undefined): string => {
  if (value === "research_only") return "Du lieu nghien cuu";
  if (!value) return "Chua co";
  return value;
};

function IndustryRuntimeReadPathPanel({
  runtimeContexts,
  selectedIndustry,
}: {
  runtimeContexts: IndustryContextRuntimePayload[];
  selectedIndustry: (typeof industryCompassData.industries)[number];
}) {
  const expectedIndustryCode = industryCodeByCompassKey[selectedIndustry.industryKey] ?? null;
  const matchingContexts = runtimeContexts.filter((payload) =>
    payload.taxonomy.mappings.some((mapping) => mapping.industryCode === expectedIndustryCode),
  );
  const hasMappings = matchingContexts.length > 0;

  return (
    <section>
      <SectionHeader
        eyebrow="Read-path"
        title="Du lieu nganh dang doc tu he thong"
        description="Phan nay chi hien mapping nganh da co trong DB. Neu qualitative context chua co nguon, UI giu trang thai thieu du lieu."
      />
      <Card className="parent-surface-card">
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant={hasMappings ? "success" : "warning"}>
              {hasMappings ? "Da doc mapping DB" : "Chua co mapping DB cho nganh dang chon"}
            </Chip>
            <Chip variant="warning">research_only</Chip>
            <Chip variant="warning">needsReview</Chip>
            <Chip variant="neutral">productionApproved=false</Chip>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {hasMappings ? (
              matchingContexts.map((payload) => {
                const primaryMapping =
                  payload.taxonomy.mappings.find((mapping) => mapping.industryCode === expectedIndustryCode) ??
                  payload.taxonomy.mappings[0];
                const qualitativeStatus =
                  payload.context?.reviewedQualitativeContextAvailable === true
                    ? "Co context co provenance"
                    : "Chua co qualitative context co nguon";

                return (
                  <article
                    key={`${payload.ticker}-${primaryMapping.industryCode}`}
                    className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{payload.ticker}</p>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {primaryMapping.industryCode} - {primaryMapping.displayNameVi}
                        </p>
                      </div>
                      <Chip size="sm" variant="accent">
                        {primaryMapping.roleType}
                      </Chip>
                    </div>
                    <dl className="mt-3 grid gap-2 text-xs leading-5">
                      <div>
                        <dt className="font-semibold text-subtle">Nguon mapping</dt>
                        <dd className="font-bold text-ink">{primaryMapping.sourceLabel}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-subtle">Data mode</dt>
                        <dd className="font-bold text-ink">{runtimeDataModeLabel(primaryMapping.dataMode)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-subtle">IndustryContext</dt>
                        <dd className="font-bold text-ink">{qualitativeStatus}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 rounded-[4px] border border-warning bg-warning/10 px-3 py-2 text-xs leading-5 text-muted">
                      Mapping nay chi dung de dieu huong doc nganh. Chua co metric nganh, chua co context Layer 4 day du, va khong thay the buoc doc BCTC/rui ro/dinh gia.
                    </p>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[4px] border border-warning bg-warning/10 px-4 py-4 lg:col-span-3">
                <p className="text-sm font-bold text-ink">Chua co mapping DB phu hop cho nganh nay.</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Trang khong tu suy luan ticker hay nganh thay the. Du lieu thieu giu nguyen trang thai N/A.
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

export function IndustryPage({ initialIndustryContexts, onNavigate }: IndustryPageProps) {
  const [selectedIndustryId, setSelectedIndustryId] = useState(
    industryCompassData.industries[0]?.id ?? ""
  );
  const selectedIndustry = useMemo(
    () =>
      industryCompassData.industries.find((industry) => industry.id === selectedIndustryId) ??
      industryCompassData.industries[0],
    [selectedIndustryId]
  );
  const runtimeContexts = useMemo(
    () => Object.values(initialIndustryContexts ?? {}),
    [initialIndustryContexts],
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
      <IndustryRuntimeReadPathPanel
        runtimeContexts={runtimeContexts}
        selectedIndustry={selectedIndustry}
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
