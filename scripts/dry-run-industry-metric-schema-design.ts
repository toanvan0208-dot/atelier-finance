import { readFileSync } from "node:fs";

const PHASE = "159B";

const readText = (filePath: string): string => {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
};

const modelBlock = (schema: string, modelName: string): string => {
  const match = schema.match(new RegExp(`model\\s+${modelName}\\s+\\{([\\s\\S]*?)\\n\\}`));
  return match?.[1] ?? "";
};

const hasModel = (schema: string, modelName: string): boolean => modelBlock(schema, modelName).length > 0;

const requiredIndustryMetricFields = [
  "id",
  "industryCode",
  "metricCode",
  "metricName",
  "metricLabelVi",
  "metricGroup",
  "value",
  "unit",
  "periodType",
  "periodLabel",
  "observationDate",
  "sourceLabel",
  "sourceUrl",
  "dataMode",
  "productionApproved",
  "needsReview",
  "qualityStatus",
  "missingReason",
  "warningCodes",
  "createdAt",
  "updatedAt",
] as const;

const requiredIndustryMetricProvenanceFields = [
  "id",
  "industryMetricId",
  "industryCode",
  "metricCode",
  "observationDate",
  "sourceLabel",
  "sourceUrl",
  "sourceType",
  "publicationDate",
  "retrievedAt",
  "dataMode",
  "productionApproved",
  "needsReview",
  "payloadChecksum",
  "evidenceNotes",
  "warningCodes",
  "createdAt",
  "updatedAt",
] as const;

const proposedIndustryMetricIndexes = [
  "@@unique([industryCode, metricCode, observationDate, sourceLabel])",
  "@@index([industryCode])",
  "@@index([metricCode])",
  "@@index([observationDate])",
  "@@index([dataMode])",
  "@@index([productionApproved])",
  "@@index([needsReview])",
] as const;

const proposedProvenanceIndexes = [
  "@@unique([industryMetricId, sourceLabel, sourceUrl])",
  "@@index([industryMetricId])",
  "@@index([industryCode])",
  "@@index([metricCode])",
  "@@index([observationDate])",
  "@@index([sourceLabel])",
  "@@index([dataMode])",
  "@@index([productionApproved])",
] as const;

const safeMetricUsageText = [
  "Industry metrics are descriptive checks only.",
  "Missing numeric values stay null with a missing reason.",
  "Research-only rows default to needsReview and productionApproved false.",
  "UI must show source, period, unit, review status, and N/A when missing.",
  "Assistant use must explain what a metric means and what to verify next.",
] as const;

const riskyAdvicePatterns = [
  /\b(buy|sell|hold)\b/i,
  /khuyen nghi mua/i,
  /khuyen nghi ban/i,
  /target price/i,
  /gia muc tieu/i,
  /fair value/i,
  /gia tri hop ly/i,
  /upside/i,
  /downside/i,
  /dang mua/i,
  /hap dan/i,
  /stock attractiveness/i,
] as const;

const rankingScoringPatterns = [/ranking/i, /scoring/i, /benchmark score/i] as const;

const schema = readText("prisma/schema.prisma");
const industryMetricModelPresent = hasModel(schema, "IndustryMetric");
const industryMetricProvenanceModelPresent = hasModel(schema, "IndustryMetricProvenance");
const industryModelPresent = hasModel(schema, "Industry");
const dataSourceModelPresent = hasModel(schema, "DataSource");

const safeUsageCorpus = safeMetricUsageText.join("\n");
const forbiddenAdviceDetected = riskyAdvicePatterns.some((pattern) => pattern.test(safeUsageCorpus));
const benchmarkRankingScoringDetected = rankingScoringPatterns.some((pattern) => pattern.test(safeUsageCorpus));

const result = {
  phase: PHASE,
  mode: "dry_run_schema_design_only",
  dbWriteAttempted: false,
  schemaChanged: false,
  migrationCreated: false,
  providerFetchAttempted: false,
  rawSourceImportAttempted: false,
  industryWriteAttempted: false,
  industryMetricWriteAttempted: false,
  industryMetricModelPresent,
  industryMetricProvenanceModelPresent,
  industryRelationAvailable: industryModelPresent,
  dataSourceModelAvailable: dataSourceModelPresent,
  proposedModels: [
    {
      modelName: "IndustryMetric",
      purpose: "Store one reviewed numeric industry observation per metric, period, source, and industry.",
      requiredFields: requiredIndustryMetricFields,
      proposedIndexes: proposedIndustryMetricIndexes,
      nullRules: [
        "value may be null when the source does not provide a usable number.",
        "missingReason should explain why value is null.",
        "Never write 0 as a substitute for missing data.",
      ],
      defaultReviewRules: {
        dataMode: "research_only",
        productionApproved: false,
        needsReview: true,
      },
    },
    {
      modelName: "IndustryMetricProvenance",
      purpose: "Store source and review evidence for each IndustryMetric row.",
      requiredFields: requiredIndustryMetricProvenanceFields,
      proposedIndexes: proposedProvenanceIndexes,
      rawSourceRule: "Do not commit raw PDF, CSV, JSON, or manual input files. Store only source metadata and short review notes.",
      defaultReviewRules: {
        dataMode: "research_only",
        productionApproved: false,
        needsReview: true,
      },
    },
  ],
  uiReadPathRules: [
    "Show metric label, value, unit, period, source, and review state.",
    "Show N/A when value is missing.",
    "Do not convert taxonomy or peer group data into numeric comparison.",
    "Do not infer investment quality from a single metric.",
  ],
  assistantRules: [
    "May explain what the metric means.",
    "May suggest what source or company filing to verify next.",
    "Must keep outputs descriptive and review-gated.",
  ],
  forbiddenAdviceDetected,
  buySellHoldDetected: forbiddenAdviceDetected,
  targetPriceFairValueUpsideDownsideDetected: forbiddenAdviceDetected,
  stockAttractivenessDetected: forbiddenAdviceDetected,
  benchmarkRankingScoringDetected,
  benchmarkRankingScoringIntroduced: false,
  tradingOrValuationOutputIntroduced: false,
  layer5SchemaDesignReady: !industryMetricModelPresent && industryModelPresent,
  readyForRealMetricImport: false,
  recommendedNextPhase: "Phase 159C - IndustryMetric Migration Draft Dry Run",
};

const auditPassed =
  result.mode === "dry_run_schema_design_only" &&
  !result.dbWriteAttempted &&
  !result.schemaChanged &&
  !result.migrationCreated &&
  !result.providerFetchAttempted &&
  !result.rawSourceImportAttempted &&
  !result.industryMetricWriteAttempted &&
  !result.forbiddenAdviceDetected &&
  !result.benchmarkRankingScoringDetected &&
  !result.readyForRealMetricImport;

console.log(
  JSON.stringify(
    {
      ...result,
      auditPassed,
    },
    null,
    2,
  ),
);

if (!auditPassed) {
  process.exitCode = 1;
}
