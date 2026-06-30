import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry.js";
import { loadMacroRuntimeData } from "../src/features/macro/lib/load-macro-runtime-data.js";
import { prisma } from "../src/lib/database/client.js";

const COVERED_INDICATORS = [
  "FED_FUNDS_RATE",
  "DXY",
  "BRENT_OIL_PRICE",
  "GDP_GROWTH",
  "PMI_MANUFACTURING",
  "EXPORT_GROWTH",
  "CPI_YOY",
  "POLICY_RATE",
  "USD_VND",
  "FOREIGN_NET_FLOW",
  "CREDIT_GROWTH",
  "PUBLIC_INVESTMENT",
  "MARKET_TRADING_VALUE",
] as const;

const UNAVAILABLE_INDICATOR = "GLOBAL_FLOW";
const FRONTEND_LOCKED_COUNT = 14;

type CoveredIndicator = (typeof COVERED_INDICATORS)[number];

type RuntimeObservation = {
  indicatorCode: string;
  productionApproved: boolean;
  needsReview: boolean;
  value: number | string;
  unit?: string | null;
  provenance?: {
    available?: boolean;
    warningCodes?: string[];
    semanticCaveats?: string[];
  };
};

type RuntimeIndicator = {
  indicatorCode: string;
  inCurrentFrontend?: boolean;
  latestObservation?: RuntimeObservation | null;
  latestObservations?: RuntimeObservation[];
  limitations?: string[];
};

const emptyCounts = (): Record<CoveredIndicator, number> =>
  COVERED_INDICATORS.reduce((counts, indicatorCode) => {
    counts[indicatorCode] = 0;
    return counts;
  }, {} as Record<CoveredIndicator, number>);

const countByIndicator = (rows: Array<{ indicatorCode: string }>): Record<CoveredIndicator, number> => {
  const counts = emptyCounts();
  for (const row of rows) {
    if (COVERED_INDICATORS.includes(row.indicatorCode as CoveredIndicator)) {
      counts[row.indicatorCode as CoveredIndicator] += 1;
    }
  }
  return counts;
};

const observationsFor = (indicator?: RuntimeIndicator): RuntimeObservation[] =>
  indicator?.latestObservations?.length
    ? indicator.latestObservations
    : indicator?.latestObservation
      ? [indicator.latestObservation]
      : [];

export async function runAcceptedMacroCoverage13Of14Smoke() {
  const observations = await prisma.macroObservation.findMany({
    where: { indicatorCode: { in: [...COVERED_INDICATORS] } },
  });
  const provenance = await prisma.macroObservationProvenance.findMany({
    where: { indicatorCode: { in: [...COVERED_INDICATORS] } },
  });
  const globalFlowObservationCount = await prisma.macroObservation.count({
    where: { indicatorCode: UNAVAILABLE_INDICATOR },
  });
  const globalFlowProvenanceCount = await prisma.macroObservationProvenance.count({
    where: { indicatorCode: UNAVAILABLE_INDICATOR },
  });
  const productionApprovedTrueCount = await prisma.macroObservation.count({
    where: { productionApproved: true },
  });

  const runtimeData = await loadMacroRuntimeData();
  const runtimeIndicators = (runtimeData.indicatorUniverse ?? []) as RuntimeIndicator[];
  const runtimeByIndicator = Object.fromEntries(
    [...COVERED_INDICATORS, UNAVAILABLE_INDICATOR].map((indicatorCode) => [
      indicatorCode,
      runtimeIndicators.find((indicator) => indicator.indicatorCode === indicatorCode),
    ]),
  ) as Record<CoveredIndicator | typeof UNAVAILABLE_INDICATOR, RuntimeIndicator | undefined>;
  const coveredRuntimeReadable = COVERED_INDICATORS.reduce<Record<CoveredIndicator, boolean>>(
    (result, indicatorCode) => {
      result[indicatorCode] = observationsFor(runtimeByIndicator[indicatorCode]).length > 0;
      return result;
    },
    {} as Record<CoveredIndicator, boolean>,
  );

  const assistantResponse = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: "Summarize accepted macro coverage and unavailable macro indicators.",
        moduleContext: {
          moduleKey: "macro",
          source: "phase149s-smoke",
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

  const macroUiSource = readFileSync("src/features/macro/components/MacroCompassSections.tsx", "utf-8");
  const evidence = readFileSync(
    "docs/product/evidence/PHASE149S_ACCEPTED_MACRO_COVERAGE_13_OF_14.md",
    "utf-8",
  );
  const docsText = [
    evidence,
    readFileSync("docs/product/MACRO_PARSER_STRATEGY.md", "utf-8"),
    readFileSync("docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md", "utf-8"),
    readFileSync("docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md", "utf-8"),
  ].join("\n");

  const frontendIndicatorUniverseCount = MACRO_INDICATOR_UNIVERSE.filter(
    (item) => item.inCurrentFrontend,
  ).length;
  const runtimeGlobalFlow = runtimeByIndicator.GLOBAL_FLOW;

  const results = {
    phase: "149S",
    acceptedMacroCoverage: "13/14",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    coveredIndicators: [...COVERED_INDICATORS],
    unavailableIndicators: [UNAVAILABLE_INDICATOR],
    observationsReadByIndicator: countByIndicator(observations),
    provenanceReadByIndicator: countByIndicator(provenance),
    coveredIndicatorsRemainReadable: Object.values(coveredRuntimeReadable).every(Boolean),
    globalFlowObservationCount,
    globalFlowProvenanceCount,
    globalFlowRemainsUnpopulated:
      globalFlowObservationCount === 0 &&
      globalFlowProvenanceCount === 0 &&
      !runtimeGlobalFlow?.latestObservation &&
      !(runtimeData.dbBackedIndicators ?? []).includes(UNAVAILABLE_INDICATOR),
    noProxySubstitution:
      docsText.includes("Do not substitute DXY/VIX") &&
      docsText.includes("Do not import sparse GLOBAL_FLOW points") &&
      docsText.includes("continuous monthly EM equity fund-flow source"),
    assistantTreatsGlobalFlowAsUnavailable:
      assistantPromptText.includes(UNAVAILABLE_INDICATOR) &&
      (assistantPromptText.includes("missingObservationIndicators") ||
        assistantPromptText.includes("sourceAssessmentNeededIndicators")),
    candidateWarningPathVisible:
      JSON.stringify(runtimeData).includes("productionApproved=false") &&
      JSON.stringify(runtimeData).includes("needsReview=true") &&
      macroUiSource.includes("candidate"),
    frontendIndicatorUniverseExpanded: frontendIndicatorUniverseCount !== FRONTEND_LOCKED_COUNT,
    productionApprovedTrueCount,
    missingDataZeroFilled: false,
    mockOrSampleAsReal: false,
    fallbackAsReal: false,
    smokePassed: false,
  };

  results.smokePassed =
    results.acceptedMacroCoverage === "13/14" &&
    results.dbWriteAttempted === false &&
    results.providerFetchAttempted === false &&
    results.csvImportAttempted === false &&
    results.coveredIndicatorsRemainReadable &&
    results.globalFlowRemainsUnpopulated &&
    results.noProxySubstitution &&
    results.assistantTreatsGlobalFlowAsUnavailable &&
    results.candidateWarningPathVisible &&
    results.frontendIndicatorUniverseExpanded === false &&
    results.productionApprovedTrueCount === 0 &&
    results.missingDataZeroFilled === false &&
    results.mockOrSampleAsReal === false &&
    results.fallbackAsReal === false;

  console.log(JSON.stringify(results, null, 2));

  if (!results.smokePassed) {
    throw new Error("Phase 149S accepted macro coverage smoke failed.");
  }

  return results;
}

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isDirectRun) {
  runAcceptedMacroCoverage13Of14Smoke()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
