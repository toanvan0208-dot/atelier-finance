import { readFileSync } from "node:fs";
import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry.js";
import { loadMacroRuntimeData } from "../src/features/macro/lib/load-macro-runtime-data.js";
import { prisma } from "../src/lib/database/client.js";

const DATA_MODE = "vietnam_macro_candidate";
const TARGET_INDICATORS = [
  "USD_VND",
  "EXPORT_GROWTH",
  "PUBLIC_INVESTMENT",
  "CREDIT_GROWTH",
] as const;

const BASELINE_COUNTS: Record<TargetIndicator, number> = {
  USD_VND: 1,
  EXPORT_GROWTH: 2,
  PUBLIC_INVESTMENT: 34,
  CREDIT_GROWTH: 10,
};

type TargetIndicator = (typeof TARGET_INDICATORS)[number];

type RuntimeObservation = {
  indicatorCode: string;
  value: number | string;
  unit?: string | null;
  productionApproved: boolean;
  needsReview: boolean;
  sourceLabel: string;
  provenance?: {
    providerType?: string;
    semanticCaveats?: string[];
    warningCodes?: string[];
  };
};

type RuntimeIndicator = {
  indicatorCode: string;
  latestObservation?: RuntimeObservation | null;
  latestObservations?: RuntimeObservation[];
  limitations?: string[];
};

const countByIndicator = (rows: Array<{ indicatorCode: string }>): Record<TargetIndicator, number> =>
  TARGET_INDICATORS.reduce<Record<TargetIndicator, number>>((counts, indicatorCode) => {
    counts[indicatorCode] = rows.filter((row) => row.indicatorCode === indicatorCode).length;
    return counts;
  }, {} as Record<TargetIndicator, number>);

const observationsFor = (indicator?: RuntimeIndicator): RuntimeObservation[] =>
  indicator?.latestObservations?.length
    ? indicator.latestObservations
    : indicator?.latestObservation
      ? [indicator.latestObservation]
      : [];

const includesAllTargets = (text: string): Record<TargetIndicator, boolean> =>
  TARGET_INDICATORS.reduce<Record<TargetIndicator, boolean>>((result, indicatorCode) => {
    result[indicatorCode] = text.includes(indicatorCode);
    return result;
  }, {} as Record<TargetIndicator, boolean>);

async function runSmoke() {
  const observations = await prisma.macroObservation.findMany({
    where: {
      dataMode: DATA_MODE,
      indicatorCode: { in: [...TARGET_INDICATORS] },
    },
  });
  const provenance = await prisma.macroObservationProvenance.findMany({
    where: {
      dataMode: DATA_MODE,
      indicatorCode: { in: [...TARGET_INDICATORS] },
    },
  });

  const runtimeData = await loadMacroRuntimeData();
  const runtimeIndicators = (runtimeData.indicatorUniverse ?? []) as RuntimeIndicator[];
  const runtimeByIndicator = Object.fromEntries(
    TARGET_INDICATORS.map((indicatorCode) => [
      indicatorCode,
      observationsFor(
        runtimeIndicators.find((indicator) => indicator.indicatorCode === indicatorCode),
      ),
    ]),
  ) as Record<TargetIndicator, RuntimeObservation[]>;

  const assistantResponse = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: "Tom tat cac chi so macro Viet Nam dang co trong du lieu he thong.",
        moduleContext: {
          moduleKey: "macro",
          source: "phase149i-smoke",
          asOf: "2026-06-30",
        },
      }),
    }),
  );
  const assistantPayload = await assistantResponse.json();
  const assistantPromptText =
    typeof assistantPayload?.runtime?.prompt?.promptText === "string"
      ? assistantPayload.runtime.prompt.promptText
      : JSON.stringify(assistantPayload);

  const uiContent = readFileSync(
    "src/features/macro/components/MacroCompassSections.tsx",
    "utf-8",
  );
  const runtimeText = JSON.stringify(runtimeData);
  const provenanceEvidence = provenance.map((row) => row.evidenceNotes ?? "").join("\n");
  const warningCodes = provenance.map((row) => row.warningCodes ?? "").join("\n");
  const totalVietnamCandidateRowsRead = observations.length;
  const observationsReadByIndicator = countByIndicator(observations);
  const provenanceReadByIndicator = countByIndicator(provenance);

  const productionApprovedTrueCount =
    observations.filter((row) => row.productionApproved).length +
    provenance.filter((row) => row.productionApproved).length;
  const needsReviewRowsCount = observations.filter((row) => row.needsReview).length;
  const publicInvestmentUnits = new Set(
    observations
      .filter((row) => row.indicatorCode === "PUBLIC_INVESTMENT")
      .map((row) => row.unit),
  );

  const assistantTargetCoverage = includesAllTargets(assistantPromptText);
  const runtimeTargetCoverage = TARGET_INDICATORS.reduce<Record<TargetIndicator, boolean>>(
    (result, indicatorCode) => {
      result[indicatorCode] = runtimeByIndicator[indicatorCode].length > 0;
      return result;
    },
    {} as Record<TargetIndicator, boolean>,
  );

  const outputText = `${assistantPayload?.answer ?? ""}\n${assistantPayload?.message ?? ""}`;
  const investmentAdviceAdded = [
    "khuyen nghi mua",
    "khuyen nghi ban",
    "tin hieu giao dich",
    "target price",
    "fair value",
    "upside",
    "downside",
  ].some((phrase) => outputText.toLowerCase().includes(phrase));

  const results = {
    phase: "149I",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    targetIndicators: [...TARGET_INDICATORS],
    observationsReadByIndicator,
    provenanceReadByIndicator,
    totalVietnamCandidateRowsRead,
    macroRuntimeIncludesUsdVnd: runtimeTargetCoverage.USD_VND,
    macroRuntimeIncludesExportGrowth: runtimeTargetCoverage.EXPORT_GROWTH,
    macroRuntimeIncludesPublicInvestment: runtimeTargetCoverage.PUBLIC_INVESTMENT,
    macroRuntimeIncludesCreditGrowth: runtimeTargetCoverage.CREDIT_GROWTH,
    uiCandidateWarningsVisible:
      uiContent.includes("candidate") &&
      uiContent.includes("production") &&
      runtimeText.includes("productionApproved=false"),
    needsReviewWarningsVisible:
      uiContent.includes("Cần kiểm duyệt") || runtimeText.includes("needsReview=true"),
    productionApprovedTrueCount,
    needsReviewRowsCount,
    needsReviewRowsVisible:
      observations.length > 0 && observations.every((row) => row.needsReview === true),
    assistantContextIncludesUsdVnd: assistantTargetCoverage.USD_VND,
    assistantContextIncludesExportGrowth: assistantTargetCoverage.EXPORT_GROWTH,
    assistantContextIncludesPublicInvestment: assistantTargetCoverage.PUBLIC_INVESTMENT,
    assistantContextIncludesCreditGrowth: assistantTargetCoverage.CREDIT_GROWTH,
    usdVndNotSbvCentralRateCaveatVisible:
      assistantPromptText.includes("not SBV central rate") ||
      runtimeText.includes("khong phai ty gia trung tam SBV"),
    exportGrowthDerivedCaveatVisible:
      assistantPromptText.includes("Derived YoY from GSO export value CSV") ||
      provenanceEvidence.includes("export_value_1000_usd"),
    publicInvestmentUnitDisambiguated:
      publicInvestmentUnits.has("billion_vnd") &&
      publicInvestmentUnits.has("percent_of_plan_ytd"),
    creditGrowthManualAggregationCaveatVisible:
      assistantPromptText.includes("not an official machine-readable SBV CSV") &&
      provenanceEvidence.includes("notOfficialMachineReadableSbvCsv"),
    missingDataZeroFilled: observations.some((row) => Number(row.value) === 0),
    mockOrSampleAsReal: /mock-as-real|sample-as-real/i.test(runtimeText),
    fallbackAsReal: /fallback-as-real/i.test(runtimeText),
    investmentAdviceAdded,
    frontendIndicatorUniverseExpanded:
      MACRO_INDICATOR_UNIVERSE.filter((item) => item.inCurrentFrontend).length !== 14,
    allRowsHaveCandidateWarningCodes:
      provenance.length > 0 &&
      warningCodes.includes("CANDIDATE_ONLY") &&
      warningCodes.includes("NEEDS_REVIEW") &&
      warningCodes.includes("PRODUCTION_APPROVED_FALSE"),
    smokePassed: false,
  };

  results.smokePassed =
    results.dbReadAttempted &&
    results.dbWriteAttempted === false &&
    TARGET_INDICATORS.every(
      (indicatorCode) =>
        observationsReadByIndicator[indicatorCode] >= BASELINE_COUNTS[indicatorCode] &&
        provenanceReadByIndicator[indicatorCode] >= BASELINE_COUNTS[indicatorCode],
    ) &&
    results.macroRuntimeIncludesUsdVnd &&
    results.macroRuntimeIncludesExportGrowth &&
    results.macroRuntimeIncludesPublicInvestment &&
    results.macroRuntimeIncludesCreditGrowth &&
    results.uiCandidateWarningsVisible &&
    results.needsReviewWarningsVisible &&
    results.productionApprovedTrueCount === 0 &&
    results.needsReviewRowsVisible &&
    results.assistantContextIncludesUsdVnd &&
    results.assistantContextIncludesExportGrowth &&
    results.assistantContextIncludesPublicInvestment &&
    results.assistantContextIncludesCreditGrowth &&
    results.usdVndNotSbvCentralRateCaveatVisible &&
    results.exportGrowthDerivedCaveatVisible &&
    results.publicInvestmentUnitDisambiguated &&
    results.creditGrowthManualAggregationCaveatVisible &&
    results.missingDataZeroFilled === false &&
    results.mockOrSampleAsReal === false &&
    results.fallbackAsReal === false &&
    results.investmentAdviceAdded === false &&
    results.frontendIndicatorUniverseExpanded === false &&
    results.allRowsHaveCandidateWarningCodes;

  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();

  if (!results.smokePassed) {
    process.exit(1);
  }
}

runSmoke().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
