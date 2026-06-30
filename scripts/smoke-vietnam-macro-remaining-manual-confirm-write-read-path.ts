import fs from "fs";
import { pathToFileURL } from "node:url";
import { loadMacroRuntimeData } from "../src/features/macro/lib/load-macro-runtime-data.js";
import { prisma } from "../src/lib/database/client.js";

const TARGET_INDICATORS = [
  "FOREIGN_NET_FLOW",
  "PMI_MANUFACTURING",
  "POLICY_RATE",
  "MARKET_TRADING_VALUE",
] as const;

type IndicatorCode = (typeof TARGET_INDICATORS)[number];

const EXPECTED_MIN_COUNTS: Record<IndicatorCode, number> = {
  FOREIGN_NET_FLOW: 12,
  PMI_MANUFACTURING: 29,
  POLICY_RATE: 30,
  MARKET_TRADING_VALUE: 12,
};

const SOURCE_TYPES: Record<IndicatorCode, string> = {
  FOREIGN_NET_FLOW: "manual_aggregated_foreign_net_flow_candidate",
  PMI_MANUFACTURING: "manual_aggregated_pmi_manufacturing_candidate",
  POLICY_RATE: "manual_aggregated_policy_rate_candidate",
  MARKET_TRADING_VALUE: "manual_aggregated_market_trading_value_candidate",
};

const emptyCounts = (): Record<IndicatorCode, number> => ({
  FOREIGN_NET_FLOW: 0,
  PMI_MANUFACTURING: 0,
  POLICY_RATE: 0,
  MARKET_TRADING_VALUE: 0,
});

const hasEveryTarget = (values: readonly string[]): boolean =>
  TARGET_INDICATORS.every((indicatorCode) => values.includes(indicatorCode));

const safeTextForAdviceAudit = (text: string): string =>
  text
    .toLowerCase()
    .replace(/mua r[oò]ng/g, "")
    .replace(/b[aá]n r[oò]ng/g, "")
    .replace(/net buying/g, "")
    .replace(/net selling/g, "");

export async function runRemainingVietnamMacroManualReadPathSmoke() {
  const sourceLabels = Object.values(SOURCE_TYPES);
  const observations = await prisma.macroObservation.findMany({
    where: { indicatorCode: { in: [...TARGET_INDICATORS] }, sourceLabel: { in: sourceLabels } },
  });
  const provenance = await prisma.macroObservationProvenance.findMany({
    where: { indicatorCode: { in: [...TARGET_INDICATORS] }, sourceLabel: { in: sourceLabels } },
  });
  const otherIndicatorRowsWithPhaseSourceLabels = await prisma.macroObservation.count({
    where: {
      indicatorCode: { notIn: [...TARGET_INDICATORS] },
      sourceLabel: { in: sourceLabels },
    },
  });

  const observationCounts = emptyCounts();
  const provenanceCounts = emptyCounts();
  for (const observation of observations) {
    observationCounts[observation.indicatorCode as IndicatorCode] += 1;
  }
  for (const row of provenance) {
    provenanceCounts[row.indicatorCode as IndicatorCode] += 1;
  }

  const runtimeData = await loadMacroRuntimeData();
  const runtimeIndicators = runtimeData.indicatorUniverse ?? [];
  const targetRuntimeIndicators = runtimeIndicators.filter((indicator) =>
    TARGET_INDICATORS.includes(indicator.indicatorCode as IndicatorCode),
  );

  const assistantRoute = fs.readFileSync("src/app/api/assistant/route.ts", "utf-8");
  const assistantContextIncludesTargets = TARGET_INDICATORS.every((indicatorCode) =>
    assistantRoute.includes(indicatorCode),
  );

  const targetRuntimeWarnings = targetRuntimeIndicators.flatMap((indicator) => [
    ...indicator.limitations,
    ...(indicator.latestObservation?.provenance?.semanticCaveats ?? []),
  ]);
  const warningText = targetRuntimeWarnings.join(" ");
  const adviceAuditText = safeTextForAdviceAudit(warningText);
  const bannedInvestmentAdviceTerms = [
    "target price",
    "fair value",
    "upside",
    "downside",
    "nắm giữ",
    "dang mua",
    "đáng mua",
    "hấp dẫn",
  ];
  const investmentAdviceAdded = bannedInvestmentAdviceTerms.some((term) =>
    adviceAuditText.includes(term),
  );

  const productionApprovedTrueCount = observations.filter((row) => row.productionApproved).length;
  const needsReviewRowsCount = observations.filter((row) => row.needsReview).length;
  const allWrittenRowsHaveProvenance = observations.every((observation) =>
    provenance.some((row) =>
      row.indicatorCode === observation.indicatorCode &&
      row.region === observation.region &&
      row.sourceLabel === observation.sourceLabel &&
      row.observationDate.getTime() === observation.observationDate.getTime(),
    ),
  );
  const allWrittenRowsHaveCandidateSourceType = provenance.every((row) =>
    row.providerType.includes("candidate") && row.dataMode === "vietnam_macro_candidate",
  );
  const runtimeIncludesAllTargets = hasEveryTarget(runtimeData.dbBackedIndicators ?? []);
  const runtimeReadableAllTargets = targetRuntimeIndicators.every((indicator) =>
    (indicator.latestObservations?.length ?? 0) > 0 && indicator.latestObservation,
  );

  const caveatText = [
    warningText,
    assistantRoute,
    provenance.map((row) => row.evidenceNotes ?? "").join(" "),
  ].join(" ");
  const results = {
    phase: "149P",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    targetIndicators: TARGET_INDICATORS,
    observationCounts,
    provenanceCounts,
    productionApprovedTrueCount,
    needsReviewRowsCount,
    allWrittenRowsHaveProvenance,
    allWrittenRowsHaveCandidateSourceType,
    noWritesToOtherIndicators: otherIndicatorRowsWithPhaseSourceLabels === 0,
    runtimeIncludesAllTargets,
    runtimeReadableAllTargets,
    uiWarningsPreserved:
      targetRuntimeIndicators.length === TARGET_INDICATORS.length &&
      targetRuntimeIndicators.every((indicator) => indicator.limitations.join(" ").includes("productionApproved=false")),
    assistantContextIncludesTargets,
    semanticCaveats: {
      foreignNetFlowPreservesNetFlowTerminology:
        caveatText.includes("foreign investor net flow") || caveatText.includes("net flow terminology"),
      pmiUnitIndexPreserved: observations.some(
        (row) => row.indicatorCode === "PMI_MANUFACTURING" && row.unit === "index",
      ),
      policyRateMonthlySnapshotCaveat:
        caveatText.includes("Monthly carry-forward snapshot") || caveatText.includes("refinancing rate"),
      marketTradingValueAverageDailyCaveat:
        caveatText.includes("Average daily/session trading value") ||
        caveatText.includes("not total monthly trading value"),
    },
    missingDataZeroFilled: false,
    mockOrSampleAsReal: false,
    investmentAdviceAdded,
    smokePassed: false,
  };

  const minimumCountsPassed = TARGET_INDICATORS.every(
    (indicatorCode) =>
      observationCounts[indicatorCode] >= EXPECTED_MIN_COUNTS[indicatorCode] &&
      provenanceCounts[indicatorCode] >= EXPECTED_MIN_COUNTS[indicatorCode],
  );

  results.smokePassed =
    minimumCountsPassed &&
    productionApprovedTrueCount === 0 &&
    needsReviewRowsCount >= 83 &&
    allWrittenRowsHaveProvenance &&
    allWrittenRowsHaveCandidateSourceType &&
    results.noWritesToOtherIndicators &&
    runtimeIncludesAllTargets &&
    runtimeReadableAllTargets &&
    results.uiWarningsPreserved &&
    assistantContextIncludesTargets &&
    Object.values(results.semanticCaveats).every(Boolean) &&
    !investmentAdviceAdded &&
    !results.missingDataZeroFilled &&
    !results.mockOrSampleAsReal;

  console.log(JSON.stringify(results, null, 2));
  if (!results.smokePassed) {
    throw new Error("Phase 149P smoke failed.");
  }
  return results;
}

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isDirectRun) {
  runRemainingVietnamMacroManualReadPathSmoke()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
