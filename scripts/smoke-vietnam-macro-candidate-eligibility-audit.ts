import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/database/client.js";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry.js";
import { runVietnamMacroCandidateEligibilityAudit } from "./audit-vietnam-macro-candidate-eligibility.js";

const TARGET_INDICATORS = [
  "USD_VND",
  "EXPORT_GROWTH",
  "CREDIT_GROWTH",
  "PUBLIC_INVESTMENT",
] as const;

async function runSmoke() {
  const auditSummary = await runVietnamMacroCandidateEligibilityAudit();
  const targetIndicatorCodes = [...TARGET_INDICATORS];

  const observationRowsCreated = await prisma.macroObservation.count({
    where: { indicatorCode: { in: targetIndicatorCodes } },
  });
  const provenanceRowsCreated = await prisma.macroObservationProvenance.count({
    where: { indicatorCode: { in: targetIndicatorCodes } },
  });
  const productionApprovedTrueCount =
    (await prisma.macroObservation.count({ where: { productionApproved: true } })) +
    (await prisma.macroObservationProvenance.count({ where: { productionApproved: true } }));

  const assistantRouteContent = readFileSync("src/app/api/assistant/route.ts", "utf-8");
  const assistantDoesNotInventVietnamMacro =
    assistantRouteContent.includes("USD_VND, EXPORT_GROWTH, CREDIT_GROWTH, and PUBLIC_INVESTMENT") &&
    assistantRouteContent.includes("Do not fabricate data for indicators outside dbBackedIndicators") &&
    assistantRouteContent.includes("exchange rate, export, credit, or public investment gaps");
  const guardrailNoInvestmentAdvicePresent =
    assistantRouteContent.includes("Do not make definitive macro-to-industry conclusions or give investment advice") &&
    assistantRouteContent.includes("Avoid investment-action wording and valuation-outcome claims") &&
    !assistantRouteContent.includes("target price/fair value/upside/downside");

  const frontendIndicatorUniverseExpanded =
    MACRO_INDICATOR_UNIVERSE.filter((item) => item.inCurrentFrontend).length !== 14;

  const eligiblePlusBlockedMatchesCandidateRows =
    auditSummary.eligibleRowsTotal + auditSummary.blockedRowsTotal ===
    auditSummary.candidateRowsTotal;

  const results = {
    phase: "149E",
    targetIndicators: targetIndicatorCodes,
    targetIndicatorsComplete: targetIndicatorCodes.every((indicator) =>
      auditSummary.targetIndicators.includes(indicator),
    ),
    candidateRowsTotal: auditSummary.candidateRowsTotal,
    candidateRowsTotalMatchesExpected: auditSummary.candidateRowsTotal === 47,
    dbWriteAttempted: auditSummary.dbWriteAttempted,
    candidateRowsPersisted: auditSummary.candidateRowsPersisted,
    observationRowsCreated,
    provenanceRowsCreated,
    productionApprovedTrueCount,
    needsReviewTrueCountMatchesCandidateRows:
      auditSummary.needsReviewTrueCountMatchesCandidateRows,
    eligiblePlusBlockedMatchesCandidateRows,
    duplicateAuditExecuted: auditSummary.duplicateAuditExecuted,
    duplicateCandidateKeys: auditSummary.duplicateCandidateKeys,
    sourceProvenanceAuditExecuted: auditSummary.sourceProvenanceAuditExecuted,
    semanticAuditExecuted: auditSummary.semanticAuditExecuted,
    unitAuditExecuted: auditSummary.unitAuditExecuted,
    periodAuditExecuted: auditSummary.periodAuditExecuted,
    usdVndNotSbvCentralRate: auditSummary.usdVndNotSbvCentralRate,
    exportGrowthDerivedFromExportValue: auditSummary.exportGrowthDerivedFromExportValue,
    exportGrowthNotDirectPublishedGrowth:
      auditSummary.exportGrowthNotDirectPublishedGrowth,
    creditGrowthManualAggregatedCandidate:
      auditSummary.creditGrowthManualAggregatedCandidate,
    publicInvestmentUnitDisambiguated: auditSummary.publicInvestmentUnitDisambiguated,
    frontendIndicatorUniverseExpanded,
    missingDataZeroFilled: auditSummary.missingDataZeroFilled,
    mockOrSampleAsReal: auditSummary.mockOrSampleAsReal,
    investmentAdviceAdded: auditSummary.investmentAdviceAdded,
    assistantDoesNotInventVietnamMacro,
    guardrailNoInvestmentAdvicePresent,
    smokePassed: false,
  };

  results.smokePassed =
    results.targetIndicatorsComplete &&
    results.candidateRowsTotalMatchesExpected &&
    results.dbWriteAttempted === false &&
    results.candidateRowsPersisted === false &&
    results.observationRowsCreated === 0 &&
    results.provenanceRowsCreated === 0 &&
    results.productionApprovedTrueCount === 0 &&
    results.needsReviewTrueCountMatchesCandidateRows &&
    results.eligiblePlusBlockedMatchesCandidateRows &&
    results.duplicateAuditExecuted &&
    results.sourceProvenanceAuditExecuted &&
    results.semanticAuditExecuted &&
    results.unitAuditExecuted &&
    results.periodAuditExecuted &&
    results.usdVndNotSbvCentralRate &&
    results.exportGrowthDerivedFromExportValue &&
    results.exportGrowthNotDirectPublishedGrowth &&
    results.creditGrowthManualAggregatedCandidate &&
    results.publicInvestmentUnitDisambiguated &&
    results.frontendIndicatorUniverseExpanded === false &&
    results.missingDataZeroFilled === false &&
    results.mockOrSampleAsReal === false &&
    results.investmentAdviceAdded === false &&
    results.assistantDoesNotInventVietnamMacro &&
    results.guardrailNoInvestmentAdvicePresent;

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
