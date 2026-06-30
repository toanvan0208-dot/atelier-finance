import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry.js";
import { loadMacroRuntimeData } from "../src/features/macro/lib/load-macro-runtime-data.js";
import { prisma } from "../src/lib/database/client.js";

const FRONTEND_LOCKED_INDICATORS = [
  "FED_FUNDS_RATE",
  "DXY",
  "BRENT_OIL_PRICE",
  "GLOBAL_FLOW",
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

const AVAILABLE_INDICATORS = [
  "FED_FUNDS_RATE",
  "DXY",
  "BRENT_OIL_PRICE",
  "GDP_GROWTH",
  "CPI_YOY",
  "USD_VND",
  "EXPORT_GROWTH",
  "PUBLIC_INVESTMENT",
  "CREDIT_GROWTH",
  "FOREIGN_NET_FLOW",
  "PMI_MANUFACTURING",
  "POLICY_RATE",
  "MARKET_TRADING_VALUE",
] as const;

const DECISION_NEEDED_INDICATORS = ["GLOBAL_FLOW"] as const;

type AvailableIndicator = (typeof AVAILABLE_INDICATORS)[number];

type RuntimeObservation = {
  indicatorCode: string;
  value: number | string;
  unit?: string | null;
  productionApproved: boolean;
  needsReview: boolean;
  sourceLabel: string;
  dataMode: string;
  provenance?: {
    available?: boolean;
    providerType?: string;
    warningCodes?: string[];
    semanticCaveats?: string[];
    evidenceNotes?: string | null;
  };
};

type RuntimeIndicator = {
  indicatorCode: string;
  inCurrentFrontend?: boolean;
  latestObservation?: RuntimeObservation | null;
  latestObservations?: RuntimeObservation[];
  limitations?: string[];
  freshness?: {
    staleStatus?: string;
  };
};

const MINIMUM_COUNTS: Record<AvailableIndicator, number> = {
  FED_FUNDS_RATE: 1,
  DXY: 1,
  BRENT_OIL_PRICE: 1,
  GDP_GROWTH: 1,
  CPI_YOY: 1,
  USD_VND: 1,
  EXPORT_GROWTH: 2,
  PUBLIC_INVESTMENT: 34,
  CREDIT_GROWTH: 10,
  FOREIGN_NET_FLOW: 12,
  PMI_MANUFACTURING: 29,
  POLICY_RATE: 30,
  MARKET_TRADING_VALUE: 12,
};

const emptyAvailableCounts = (): Record<AvailableIndicator, number> =>
  AVAILABLE_INDICATORS.reduce((counts, indicatorCode) => {
    counts[indicatorCode] = 0;
    return counts;
  }, {} as Record<AvailableIndicator, number>);

const countByIndicator = (rows: Array<{ indicatorCode: string }>): Record<AvailableIndicator, number> => {
  const counts = emptyAvailableCounts();
  for (const row of rows) {
    if (AVAILABLE_INDICATORS.includes(row.indicatorCode as AvailableIndicator)) {
      counts[row.indicatorCode as AvailableIndicator] += 1;
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

const includesEvery = (values: readonly string[], expected: readonly string[]): boolean =>
  expected.every((value) => values.includes(value));

const safeUserFacingTextForAdviceAudit = (text: string): string =>
  text
    .toLowerCase()
    .replace(/mua\s+r[oòÃ²]ng/g, "")
    .replace(/b[aáÃ¡]n\s+r[oòÃ²]ng/g, "")
    .replace(/mua\s+b[aáÃ¡]n\s+r[oòÃ²]ng/g, "")
    .replace(/net buying/g, "")
    .replace(/net selling/g, "")
    .replace(/foreign investor net flow/g, "")
    .replace(/market-flow terminology/g, "");

const containsInvestmentAdviceWording = (text: string): boolean => {
  const normalized = safeUserFacingTextForAdviceAudit(text);
  const bannedPatterns = [
    /\bmua\b/i,
    /\bb[aáÃ¡]n\b/i,
    /n[aăÃ£]m gi[uữ]/i,
    /target price/i,
    /fair value/i,
    /upside/i,
    /downside/i,
    /d[aáÃ¡]ng mua/i,
    /h[aấÃ¡]p d[aẫÃ¢]n/i,
  ];
  return bannedPatterns.some((pattern) => pattern.test(normalized));
};

export async function runFullMacroCoverageFinalSmoke() {
  const observations = await prisma.macroObservation.findMany({
    where: {
      indicatorCode: { in: [...AVAILABLE_INDICATORS] },
    },
  });
  const provenance = await prisma.macroObservationProvenance.findMany({
    where: {
      indicatorCode: { in: [...AVAILABLE_INDICATORS] },
    },
  });
  const globalFlowObservationCount = await prisma.macroObservation.count({
    where: { indicatorCode: "GLOBAL_FLOW" },
  });

  const observationsReadByIndicator = countByIndicator(observations);
  const provenanceReadByIndicator = countByIndicator(provenance);
  const missingExpectedIndicators = AVAILABLE_INDICATORS.filter(
    (indicatorCode) =>
      observationsReadByIndicator[indicatorCode] < MINIMUM_COUNTS[indicatorCode] ||
      provenanceReadByIndicator[indicatorCode] < MINIMUM_COUNTS[indicatorCode],
  );

  const runtimeData = await loadMacroRuntimeData();
  const runtimeIndicators = (runtimeData.indicatorUniverse ?? []) as RuntimeIndicator[];
  const frontendRuntimeIndicators = runtimeIndicators.filter((indicator) => indicator.inCurrentFrontend);
  const frontendIndicatorCodes = frontendRuntimeIndicators.map((indicator) => indicator.indicatorCode);
  const runtimeByIndicator = Object.fromEntries(
    FRONTEND_LOCKED_INDICATORS.map((indicatorCode) => [
      indicatorCode,
      runtimeIndicators.find((indicator) => indicator.indicatorCode === indicatorCode),
    ]),
  ) as Record<(typeof FRONTEND_LOCKED_INDICATORS)[number], RuntimeIndicator | undefined>;
  const runtimeCoverage = AVAILABLE_INDICATORS.reduce<Record<AvailableIndicator, boolean>>(
    (coverage, indicatorCode) => {
      coverage[indicatorCode] = observationsFor(runtimeByIndicator[indicatorCode]).length > 0;
      return coverage;
    },
    {} as Record<AvailableIndicator, boolean>,
  );
  const runtimeMissingAvailableIndicators = AVAILABLE_INDICATORS.filter(
    (indicatorCode) => !runtimeCoverage[indicatorCode],
  );
  const globalFlowRuntime = runtimeByIndicator.GLOBAL_FLOW;
  const globalFlowDecisionNeeded =
    !globalFlowRuntime?.latestObservation &&
    (runtimeData.sourceAssessmentNeededIndicators ?? []).includes("GLOBAL_FLOW");

  const assistantResponse = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: "Summarize the macro indicators available in the system and note missing indicators.",
        moduleContext: {
          moduleKey: "macro",
          source: "phase149q-smoke",
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

  const assistantCoverage = AVAILABLE_INDICATORS.reduce<Record<AvailableIndicator, boolean>>(
    (coverage, indicatorCode) => {
      coverage[indicatorCode] = assistantPromptText.includes(indicatorCode);
      return coverage;
    },
    {} as Record<AvailableIndicator, boolean>,
  );

  const runtimeText = JSON.stringify(runtimeData);
  const provenanceEvidence = provenance.map((row) => row.evidenceNotes ?? "").join("\n");
  const provenanceWarnings = provenance.map((row) => row.warningCodes ?? "").join("\n");
  const macroUiSource = readFileSync("src/features/macro/components/MacroCompassSections.tsx", "utf-8");
  const userFacingCaveatText = [
    runtimeText,
    provenanceEvidence,
    assistantPromptText,
    macroUiSource,
  ].join("\n");
  const outputText = `${assistantPayload?.answer ?? ""}\n${assistantPayload?.message ?? ""}`;

  const phase149PIndicators = [
    "FOREIGN_NET_FLOW",
    "PMI_MANUFACTURING",
    "POLICY_RATE",
    "MARKET_TRADING_VALUE",
  ] as const;
  const phase149PRuntimeCoverage = phase149PIndicators.reduce<Record<string, boolean>>(
    (coverage, indicatorCode) => {
      coverage[indicatorCode] = observationsFor(runtimeByIndicator[indicatorCode]).length > 0;
      return coverage;
    },
    {},
  );

  const candidateRows = observations.filter(
    (row) =>
      row.dataMode.includes("candidate") ||
      row.sourceLabel.includes("candidate") ||
      row.sourceLabel.includes("manual") ||
      row.sourceLabel.includes("proxy") ||
      row.sourceLabel.includes("world_bank") ||
      row.sourceLabel.includes("fred"),
  );
  const candidateProvenanceRows = provenance.filter(
    (row) =>
      row.dataMode.includes("candidate") ||
      row.sourceLabel.includes("candidate") ||
      row.sourceLabel.includes("manual") ||
      row.sourceLabel.includes("proxy") ||
      row.providerType.includes("candidate") ||
      row.providerType.includes("manual") ||
      row.providerType.includes("provider") ||
      row.providerType.includes("proxy"),
  );

  const productionApprovedTrueCount =
    candidateRows.filter((row) => row.productionApproved).length +
    candidateProvenanceRows.filter((row) => row.productionApproved).length;
  const needsReviewRowsCount = candidateRows.filter((row) => row.needsReview).length;
  const zeroValueRowsWithoutProvenance = observations.filter(
    (observation) =>
      Number(observation.value) === 0 &&
      !provenance.some(
        (row) =>
          row.indicatorCode === observation.indicatorCode &&
          row.region === observation.region &&
          row.observationDate.getTime() === observation.observationDate.getTime() &&
          row.sourceLabel === observation.sourceLabel,
      ),
  );

  const results = {
    phase: "149Q",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    frontendLockedIndicators: [...FRONTEND_LOCKED_INDICATORS],
    availableIndicatorsExpected: [...AVAILABLE_INDICATORS],
    decisionNeededIndicators: [...DECISION_NEEDED_INDICATORS],
    observationsReadByIndicator,
    provenanceReadByIndicator,
    totalAvailableObservationRowsRead: observations.length,
    totalAvailableProvenanceRowsRead: provenance.length,
    missingExpectedIndicators,
    runtimeCoverage,
    runtimeIncludesPhase149PIndicators: phase149PRuntimeCoverage,
    runtimeMissingAvailableIndicators,
    frontendIndicatorUniverseExpanded:
      frontendRuntimeIndicators.length !== FRONTEND_LOCKED_INDICATORS.length ||
      !includesEvery(frontendIndicatorCodes, FRONTEND_LOCKED_INDICATORS),
    candidateManualWarningPathVisible:
      runtimeText.includes("productionApproved=false") &&
      runtimeText.includes("needsReview=true") &&
      macroUiSource.includes("candidate"),
    globalFlowDecisionNeeded,
    globalFlowInvented:
      globalFlowObservationCount > 0 ||
      Boolean(globalFlowRuntime?.latestObservation) ||
      (runtimeData.dbBackedIndicators ?? []).includes("GLOBAL_FLOW"),
    assistantContextCoverage: assistantCoverage,
    assistantIncludesGlobalFlowAsMissingOrDecisionNeeded:
      assistantPromptText.includes("GLOBAL_FLOW") &&
      (assistantPromptText.includes("missingObservationIndicators") ||
        assistantPromptText.includes("sourceAssessmentNeededIndicators")),
    caveats: {
      usdVndNotSbvCentralRate:
        userFacingCaveatText.includes("not SBV central rate") ||
        userFacingCaveatText.includes("khong phai ty gia trung tam SBV"),
      exportGrowthDerivedFromGsoValue:
        userFacingCaveatText.includes("Derived YoY from GSO export value CSV") ||
        userFacingCaveatText.includes("export_value_1000_usd") ||
        userFacingCaveatText.includes("khong phai chi tieu tang truong cong bo truc tiep"),
      publicInvestmentUnitDisambiguated:
        userFacingCaveatText.includes("billion_vnd") &&
        userFacingCaveatText.includes("percent_of_plan_ytd"),
      creditGrowthManualAggregated:
        userFacingCaveatText.includes("not an official machine-readable SBV CSV") ||
        userFacingCaveatText.includes("notOfficialMachineReadableSbvCsv"),
      foreignNetFlowMarketFlowTerminology:
        userFacingCaveatText.includes("market-flow terminology") ||
        userFacingCaveatText.includes("foreign investor net flow"),
      pmiUnitIndexPreserved:
        observations.some((row) => row.indicatorCode === "PMI_MANUFACTURING" && row.unit === "index") &&
        userFacingCaveatText.includes("unit is index"),
      policyRateMonthlyRefinancingSnapshot:
        userFacingCaveatText.includes("Monthly carry-forward snapshot") &&
        userFacingCaveatText.includes("refinancing rate"),
      marketTradingValueAverageDailyNotMonthlyTotal:
        userFacingCaveatText.includes("Average daily/session trading value") &&
        userFacingCaveatText.includes("not total monthly trading value"),
    },
    productionApprovedTrueCount,
    needsReviewRowsCount,
    missingDataZeroFilled: zeroValueRowsWithoutProvenance.length > 0,
    mockOrSampleAsReal: /mock-as-real|sample-as-real/i.test(userFacingCaveatText),
    fallbackAsReal: /fallback-as-real/i.test(userFacingCaveatText),
    investmentAdviceAdded:
      containsInvestmentAdviceWording(outputText) ||
      containsInvestmentAdviceWording(
        [
          runtimeIndicators
            .filter((indicator) => indicator.inCurrentFrontend)
            .flatMap((indicator) => indicator.limitations ?? [])
            .join(" "),
          Object.values((assistantPayload?.runtime?.moduleContext?.macroContext?.caveats ?? {}) as Record<string, string>).join(" "),
        ].join(" "),
      ),
    allCandidateRowsHaveReviewPolicy:
      candidateRows.length > 0 &&
      candidateRows.every((row) => row.productionApproved === false && row.needsReview === true) &&
      candidateProvenanceRows.every((row) => row.productionApproved === false && row.needsReview === true),
    allCandidateRowsHaveWarningCodes:
      provenanceWarnings.includes("CANDIDATE_ONLY") &&
      provenanceWarnings.includes("NEEDS_REVIEW") &&
      provenanceWarnings.includes("PRODUCTION_APPROVED_FALSE"),
    smokePassed: false,
  };

  results.smokePassed =
    results.dbReadAttempted &&
    results.dbWriteAttempted === false &&
    results.providerFetchAttempted === false &&
    missingExpectedIndicators.length === 0 &&
    runtimeMissingAvailableIndicators.length === 0 &&
    Object.values(assistantCoverage).every(Boolean) &&
    results.frontendIndicatorUniverseExpanded === false &&
    results.candidateManualWarningPathVisible &&
    globalFlowDecisionNeeded &&
    results.globalFlowInvented === false &&
    results.assistantIncludesGlobalFlowAsMissingOrDecisionNeeded &&
    Object.values(results.caveats).every(Boolean) &&
    productionApprovedTrueCount === 0 &&
    results.allCandidateRowsHaveReviewPolicy &&
    results.allCandidateRowsHaveWarningCodes &&
    results.missingDataZeroFilled === false &&
    results.mockOrSampleAsReal === false &&
    results.fallbackAsReal === false &&
    results.investmentAdviceAdded === false &&
    FRONTEND_LOCKED_INDICATORS.every((indicatorCode) =>
      MACRO_INDICATOR_UNIVERSE.some(
        (registryItem) =>
          registryItem.indicatorCode === indicatorCode && registryItem.inCurrentFrontend,
      ),
    );

  console.log(JSON.stringify(results, null, 2));

  if (!results.smokePassed) {
    throw new Error("Phase 149Q full macro coverage smoke failed.");
  }

  return results;
}

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isDirectRun) {
  runFullMacroCoverageFinalSmoke()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
