import { readFileSync } from "node:fs";
import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry.js";
import { loadMacroRuntimeData } from "../src/features/macro/lib/load-macro-runtime-data.js";
import { prisma } from "../src/lib/database/client.js";

const DATA_MODE = "vietnam_macro_candidate";
const TARGET_INDICATORS = ["USD_VND", "EXPORT_GROWTH", "PUBLIC_INVESTMENT"] as const;
const ALL_PHASE_INDICATORS = [
  "USD_VND",
  "EXPORT_GROWTH",
  "CREDIT_GROWTH",
  "PUBLIC_INVESTMENT",
] as const;

type TargetIndicator = (typeof TARGET_INDICATORS)[number];

type RuntimeObservation = {
  indicatorCode: string;
  value: number | string;
  unit?: string | null;
  productionApproved: boolean;
  needsReview: boolean;
  dataMode?: string;
  provenance?: {
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

const countByIndicator = (rows: Array<{ indicatorCode: string }>): Record<string, number> =>
  rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.indicatorCode] = (counts[row.indicatorCode] ?? 0) + 1;
    return counts;
  }, {});

const findIndicator = (
  indicators: RuntimeIndicator[],
  indicatorCode: string,
): RuntimeIndicator | undefined => indicators.find((indicator) => indicator.indicatorCode === indicatorCode);

const observationsFor = (indicator?: RuntimeIndicator): RuntimeObservation[] =>
  indicator?.latestObservations?.length
    ? indicator.latestObservations
    : indicator?.latestObservation
      ? [indicator.latestObservation]
      : [];

const containsAny = (haystack: string, needles: string[]): boolean =>
  needles.some((needle) => haystack.includes(needle));

async function runSmoke() {
  const observations = await prisma.macroObservation.findMany({
    where: {
      dataMode: DATA_MODE,
      indicatorCode: { in: [...ALL_PHASE_INDICATORS] },
    },
  });
  const provenance = await prisma.macroObservationProvenance.findMany({
    where: {
      dataMode: DATA_MODE,
      indicatorCode: { in: [...ALL_PHASE_INDICATORS] },
    },
  });

  const runtimeData = await loadMacroRuntimeData();
  const runtimeIndicators = (runtimeData.indicatorUniverse ?? []) as RuntimeIndicator[];
  const indicatorByCode = Object.fromEntries(
    ALL_PHASE_INDICATORS.map((indicatorCode) => [
      indicatorCode,
      findIndicator(runtimeIndicators, indicatorCode),
    ]),
  ) as Record<(typeof ALL_PHASE_INDICATORS)[number], RuntimeIndicator | undefined>;

  const targetRuntimeObservations = Object.fromEntries(
    TARGET_INDICATORS.map((indicatorCode) => [
      indicatorCode,
      observationsFor(indicatorByCode[indicatorCode]),
    ]),
  ) as Record<TargetIndicator, RuntimeObservation[]>;

  const creditGrowthRuntimeObservations = observationsFor(indicatorByCode.CREDIT_GROWTH);
  const runtimeText = JSON.stringify(runtimeData);
  const routeContent = readFileSync("src/app/api/assistant/route.ts", "utf-8");
  const uiContent = readFileSync(
    "src/features/macro/components/MacroCompassSections.tsx",
    "utf-8",
  );

  const assistantResponse = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: "Tom tat du lieu macro Viet Nam dang co trong he thong.",
        moduleContext: {
          moduleKey: "macro",
          source: "phase149g-smoke",
          asOf: "2026-06-30",
        },
      }),
    }),
  );
  const assistantPayload = await assistantResponse.json();
  const assistantText = JSON.stringify(assistantPayload);
  const assistantPromptText =
    typeof assistantPayload?.runtime?.prompt?.promptText === "string"
      ? assistantPayload.runtime.prompt.promptText
      : assistantText;

  const productionApprovedTrueCount =
    observations.filter((row) => row.productionApproved).length +
    provenance.filter((row) => row.productionApproved).length;
  const publicInvestmentUnits = new Set(
    targetRuntimeObservations.PUBLIC_INVESTMENT.map((row) => row.unit),
  );

  const candidateWarningsVisible =
    runtimeText.includes("productionApproved=false") &&
    runtimeText.includes("needsReview=true") &&
    uiContent.includes("production") &&
    uiContent.includes("candidate");

  const results = {
    phase: "149G",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    targetIndicators: [...TARGET_INDICATORS],
    observationsReadByIndicator: countByIndicator(observations),
    provenanceReadByIndicator: countByIndicator(provenance),
    usdVndReadFromDb: targetRuntimeObservations.USD_VND.length > 0,
    exportGrowthReadFromDb: targetRuntimeObservations.EXPORT_GROWTH.length > 0,
    publicInvestmentReadFromDb: targetRuntimeObservations.PUBLIC_INVESTMENT.length > 0,
    creditGrowthWrittenRows: observations.filter((row) => row.indicatorCode === "CREDIT_GROWTH").length,
    creditGrowthReadFromDb: creditGrowthRuntimeObservations.length > 0,
    productionApprovedTrueCount,
    needsReviewRowsVisible: TARGET_INDICATORS.every((indicatorCode) =>
      targetRuntimeObservations[indicatorCode].every((row) => row.needsReview === true),
    ),
    candidateWarningsVisible,
    usdVndNotSbvCentralRateCaveatVisible:
      runtimeText.includes("khong phai ty gia trung tam SBV") ||
      assistantPromptText.includes("not SBV central rate"),
    exportGrowthDerivedCaveatVisible:
      runtimeText.includes("export value CSV") ||
      runtimeText.includes("tri gia xuat khau GSO") ||
      assistantPromptText.includes("Derived YoY from GSO export value CSV"),
    publicInvestmentUnitDisambiguated:
      publicInvestmentUnits.has("billion_vnd") &&
      publicInvestmentUnits.has("percent_of_plan_ytd"),
    assistantContextIncludesUsdVnd:
      assistantPromptText.includes("USD_VND") &&
      assistantPromptText.includes("Vietcombank commercial-bank transfer quote"),
    assistantContextIncludesExportGrowth:
      assistantPromptText.includes("EXPORT_GROWTH") &&
      assistantPromptText.includes("Derived YoY from GSO export value CSV"),
    assistantContextIncludesPublicInvestment:
      assistantPromptText.includes("PUBLIC_INVESTMENT") &&
      assistantPromptText.includes("Unit disambiguates"),
    assistantContextExcludesCreditGrowthOrMarksMissing:
      !assistantPromptText.includes("\"indicatorCode\":\"CREDIT_GROWTH\"") &&
      assistantPromptText.includes("No eligible/written DB rows from Phase 149F"),
    assistantDoesNotInventCreditGrowth:
      routeContent.includes("No eligible/written DB rows from Phase 149F") &&
      routeContent.includes("do not infer from local files"),
    missingDataZeroFilled:
      targetRuntimeObservations.USD_VND
        .concat(targetRuntimeObservations.EXPORT_GROWTH, targetRuntimeObservations.PUBLIC_INVESTMENT)
        .some((row) => Number(row.value) === 0),
    mockOrSampleAsReal: containsAny(runtimeText, ["sample-as-real", "mock-as-real", "fallback-as-real"]),
    investmentAdviceAdded: containsAny(routeContent, [
      "target price",
      "fair value",
      "upside",
      "downside",
      "dang mua",
      "hap dan",
    ]),
    frontendIndicatorUniverseExpanded:
      MACRO_INDICATOR_UNIVERSE.filter((item) => item.inCurrentFrontend).length !== 14,
    smokePassed: false,
  };

  results.smokePassed =
    results.dbReadAttempted &&
    results.dbWriteAttempted === false &&
    results.usdVndReadFromDb &&
    results.exportGrowthReadFromDb &&
    results.publicInvestmentReadFromDb &&
    results.creditGrowthWrittenRows === 0 &&
    results.creditGrowthReadFromDb === false &&
    results.productionApprovedTrueCount === 0 &&
    results.needsReviewRowsVisible &&
    results.candidateWarningsVisible &&
    results.usdVndNotSbvCentralRateCaveatVisible &&
    results.exportGrowthDerivedCaveatVisible &&
    results.publicInvestmentUnitDisambiguated &&
    results.assistantContextIncludesUsdVnd &&
    results.assistantContextIncludesExportGrowth &&
    results.assistantContextIncludesPublicInvestment &&
    results.assistantContextExcludesCreditGrowthOrMarksMissing &&
    results.assistantDoesNotInventCreditGrowth &&
    results.missingDataZeroFilled === false &&
    results.mockOrSampleAsReal === false &&
    results.investmentAdviceAdded === false &&
    results.frontendIndicatorUniverseExpanded === false;

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
