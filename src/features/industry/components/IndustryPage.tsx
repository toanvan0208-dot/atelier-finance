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
  dairy_consumer_staples: "CONSUMER_STAPLES_DAIRY",
  retail: "RETAIL",
  steel_materials: "STEEL_MATERIALS",
};

const runtimeDataModeLabel = (value: string | null | undefined): string => {
  if (value === "research_only") return "Du lieu nghien cuu";
  if (!value) return "Chua co";
  return value;
};

const parseRuntimeList = (value: string | null | undefined): string[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
  } catch {
    return value
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const contextSourceStatusLabel = (payload: IndustryContextRuntimePayload): string => {
  if (payload.context?.reviewedQualitativeContextAvailable) return "Co context co provenance";
  if (payload.context) return "Co context nhung chua du provenance";
  return "Chua co qualitative context co nguon";
};

const runtimeContextsForIndustry = (
  runtimeContexts: IndustryContextRuntimePayload[],
  industryCode: string | null,
) =>
  runtimeContexts.filter((payload) =>
    payload.taxonomy.mappings.some((mapping) => mapping.industryCode === industryCode),
  );

function IndustryRuntimeReadPathPanel({
  runtimeContexts,
  selectedIndustry,
}: {
  runtimeContexts: IndustryContextRuntimePayload[];
  selectedIndustry: (typeof industryCompassData.industries)[number];
}) {
  const expectedIndustryCode = industryCodeByCompassKey[selectedIndustry.industryKey] ?? null;
  const matchingContexts = runtimeContextsForIndustry(runtimeContexts, expectedIndustryCode);
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
                const qualitativeStatus = contextSourceStatusLabel(payload);

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

function IndustryLayer4ContextPanel({
  runtimeContexts,
  selectedIndustry,
}: {
  runtimeContexts: IndustryContextRuntimePayload[];
  selectedIndustry: (typeof industryCompassData.industries)[number];
}) {
  const expectedIndustryCode = industryCodeByCompassKey[selectedIndustry.industryKey] ?? null;
  const contexts = runtimeContextsForIndustry(runtimeContexts, expectedIndustryCode).filter(
    (payload) => payload.context?.reviewedQualitativeContextAvailable,
  );

  if (contexts.length === 0) {
    return (
      <section>
        <SectionHeader
          eyebrow="Layer 4"
          title="Ho so nganh co nguon"
          description="Chua co context co provenance cho nganh dang chon. UI khong tu lay noi dung tinh thay the."
        />
        <Card>
          <CardBody>
            <p className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3 text-sm leading-6 text-muted">
              Layer 4 dang thieu cho nganh nay. Du lieu thieu giu nguyen la N/A, khong lay static guidance lam reviewed context.
            </p>
          </CardBody>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader
        eyebrow="Layer 4"
        title="Ho so nganh co nguon"
        description="Noi dung ben duoi doc tu IndustryContext trong DB, kem provenance. Day la du lieu nghien cuu, chua production-approved."
      />
      <div className="space-y-4">
        {contexts.map((payload) => {
          const context = payload.context;
          if (!context) return null;

          const keyDrivers = parseRuntimeList(context.keyDrivers);
          const industryRisks = parseRuntimeList(context.industryRisks);
          const macroSensitivity = parseRuntimeList(context.macroSensitivity);
          const nextChecks = parseRuntimeList(context.nextChecks);
          const sourceUrl = context.provenanceSummary.sourceUrls[0] ?? null;

          return (
            <Card key={`${payload.ticker}-${context.industryCode ?? context.industryName}`}>
              <CardBody className="space-y-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-[820px]">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Chip variant="success">Co provenance</Chip>
                      <Chip variant="warning">{runtimeDataModeLabel(context.dataMode)}</Chip>
                      <Chip variant="warning">needsReview</Chip>
                      <Chip variant="neutral">productionApproved=false</Chip>
                    </div>
                    <h2 className="text-xl font-bold leading-tight text-ink">{context.industryName}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">{context.industryOverview ?? "N/A"}</p>
                  </div>
                  <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 text-xs leading-5 text-muted lg:w-[320px]">
                    <p className="font-bold text-ink">Nguon</p>
                    <p className="mt-1">{context.sourceLabel}</p>
                    {sourceUrl ? (
                      <a
                        className="mt-2 block break-words font-semibold text-ink underline-offset-2 hover:underline"
                        href={sourceUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Mo source URL
                      </a>
                    ) : (
                      <p className="mt-2 font-semibold text-ink">Source URL: N/A</p>
                    )}
                    <p className="mt-2">Rows provenance: {context.provenanceSummary.rowsFound}</p>
                    <p>As of: {context.asOfDate.slice(0, 10)}</p>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                    <p className="text-sm font-bold text-ink">Nganh kiem tien nhu the nao?</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{context.howIndustryMakesMoney ?? "N/A"}</p>
                  </div>
                  <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                    <p className="text-sm font-bold text-ink">Khong duoc ket luan qua da</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{context.commonMisread ?? "N/A"}</p>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-4">
                  {[
                    ["Drivers can xem", keyDrivers],
                    ["Rui ro nganh", industryRisks],
                    ["Nhay voi vi mo", macroSensitivity],
                    ["Can kiem tra tiep", nextChecks],
                  ].map(([title, items]) => (
                    <div key={title as string} className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
                      <p className="text-sm font-bold text-ink">{title as string}</p>
                      {(items as string[]).length > 0 ? (
                        <ul className="mt-3 space-y-2">
                          {(items as string[]).map((item) => (
                            <li key={item} className="border-l-2 border-warning pl-3 text-xs leading-5 text-muted">
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs leading-5 text-muted">N/A</p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="rounded-[4px] border border-warning bg-warning/10 px-4 py-3 text-xs leading-5 text-muted">
                  Layer 4 chi la qualitative context co nguon. Chua co metric nganh, chua co so sanh dinh luong, chua xep hang/cham diem, va khong thay the viec doc BCTC/rui ro/dinh gia.
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>
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
      <IndustryLayer4ContextPanel
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
