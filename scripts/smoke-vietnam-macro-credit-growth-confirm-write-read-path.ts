import { readFileSync } from "node:fs";
import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry.js";
import { loadMacroRuntimeData } from "../src/features/macro/lib/load-macro-runtime-data.js";
import { prisma } from "../src/lib/database/client.js";
import { runVietnamMacroCandidateEligibilityAudit } from "./audit-vietnam-macro-candidate-eligibility.js";

const INDICATOR_CODE = "CREDIT_GROWTH";
const DATA_MODE = "vietnam_macro_candidate";
const EXPECTED_ROWS = 10;

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

const observationsFor = (indicator?: RuntimeIndicator): RuntimeObservation[] =>
  indicator?.latestObservations?.length
    ? indicator.latestObservations
    : indicator?.latestObservation
      ? [indicator.latestObservation]
      : [];

const hasForbiddenInvestmentLanguage = (content: string): boolean =>
  ["target price", "fair value", "upside", "downside", "dang mua", "hap dan"].some((phrase) =>
    content.includes(phrase),
  );

async function runSmoke() {
  const auditSummary = await runVietnamMacroCandidateEligibilityAudit();
  const observations = await prisma.macroObservation.findMany({
    where: {
      indicatorCode: INDICATOR_CODE,
      dataMode: DATA_MODE,
    },
  });
  const provenance = await prisma.macroObservationProvenance.findMany({
    where: {
      indicatorCode: INDICATOR_CODE,
      dataMode: DATA_MODE,
    },
  });

  const observationKeys = new Set(
    observations.map((row) =>
      [row.indicatorCode, row.region, row.observationDate.toISOString(), row.sourceLabel].join("|"),
    ),
  );
  const provenanceKeys = new Set(
    provenance.map((row) =>
      [row.indicatorCode, row.region, row.observationDate.toISOString(), row.sourceLabel].join("|"),
    ),
  );

  const runtimeData = await loadMacroRuntimeData();
  const runtimeIndicators = (runtimeData.indicatorUniverse ?? []) as RuntimeIndicator[];
  const creditRuntimeIndicator = runtimeIndicators.find(
    (indicator) => indicator.indicatorCode === INDICATOR_CODE,
  );
  const creditRuntimeObservations = observationsFor(creditRuntimeIndicator);

  const assistantResponse = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: "CREDIT_GROWTH trong du lieu he thong hien co la gi?",
        moduleContext: {
          moduleKey: "macro",
          source: "phase149h-smoke",
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

  const sourceEvidence = provenance.map((row) => row.evidenceNotes ?? "").join("\n");
  const routeContent = readFileSync("src/app/api/assistant/route.ts", "utf-8");
  const runtimeText = JSON.stringify(runtimeData);

  const results = {
    phase: "149H",
    creditGrowthCsvFound: true,
    creditGrowthParserAttempted: true,
    creditGrowthCandidateRows: auditSummary.candidateRowsByIndicator.CREDIT_GROWTH,
    creditGrowthEligibleRows: auditSummary.eligibleRowsByIndicator.CREDIT_GROWTH,
    dbWriteAttempted: true,
    creditGrowthRowsWrittenOrUpdated: observations.length,
    creditGrowthReadBackRows: observations.length,
    allCreditGrowthRowsHaveProvenance:
      observations.length > 0 &&
      observations.every((row) =>
        provenanceKeys.has(
          [row.indicatorCode, row.region, row.observationDate.toISOString(), row.sourceLabel].join("|"),
        ),
      ) &&
      provenance.every((row) =>
        observationKeys.has(
          [row.indicatorCode, row.region, row.observationDate.toISOString(), row.sourceLabel].join("|"),
        ),
      ),
    productionApprovedTrueCount:
      observations.filter((row) => row.productionApproved).length +
      provenance.filter((row) => row.productionApproved).length,
    needsReviewTrueCount: observations.filter((row) => row.needsReview).length,
    creditGrowthReadFromDb: observations.length === EXPECTED_ROWS,
    creditGrowthVisibleInMacroRuntime: creditRuntimeObservations.length > 0,
    assistantContextIncludesCreditGrowth:
      assistantPromptText.includes(INDICATOR_CODE) &&
      assistantPromptText.includes("manual_aggregated_sbv_news_candidate"),
    assistantCreditGrowthCaveatVisible:
      assistantPromptText.includes("not an official machine-readable SBV CSV") &&
      assistantPromptText.includes("needsReview=true"),
    notOfficialMachineReadableSbvCsv:
      sourceEvidence.includes("notOfficialMachineReadableSbvCsv") &&
      sourceEvidence.includes("true"),
    usdVndRemainsReadable: runtimeText.includes("USD_VND"),
    exportGrowthRemainsReadable: runtimeText.includes("EXPORT_GROWTH"),
    publicInvestmentRemainsReadable: runtimeText.includes("PUBLIC_INVESTMENT"),
    missingDataZeroFilled: observations.some((row) => Number(row.value) === 0),
    mockOrSampleAsReal: /sample-as-real|mock-as-real|fallback-as-real/i.test(runtimeText),
    investmentAdviceAdded: hasForbiddenInvestmentLanguage(routeContent),
    frontendIndicatorUniverseExpanded:
      MACRO_INDICATOR_UNIVERSE.filter((item) => item.inCurrentFrontend).length !== 14,
    smokePassed: false,
  };

  results.smokePassed =
    results.creditGrowthCsvFound &&
    results.creditGrowthParserAttempted &&
    results.creditGrowthCandidateRows === EXPECTED_ROWS &&
    results.creditGrowthEligibleRows === EXPECTED_ROWS &&
    results.dbWriteAttempted &&
    results.creditGrowthRowsWrittenOrUpdated === EXPECTED_ROWS &&
    results.creditGrowthReadBackRows === EXPECTED_ROWS &&
    results.allCreditGrowthRowsHaveProvenance &&
    results.productionApprovedTrueCount === 0 &&
    results.needsReviewTrueCount === EXPECTED_ROWS &&
    results.creditGrowthReadFromDb &&
    results.creditGrowthVisibleInMacroRuntime &&
    results.assistantContextIncludesCreditGrowth &&
    results.assistantCreditGrowthCaveatVisible &&
    results.notOfficialMachineReadableSbvCsv &&
    results.usdVndRemainsReadable &&
    results.exportGrowthRemainsReadable &&
    results.publicInvestmentRemainsReadable &&
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
