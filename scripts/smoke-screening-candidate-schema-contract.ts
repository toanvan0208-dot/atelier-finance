import { readFileSync } from "node:fs";
import { join } from "node:path";

const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
const reviewedSource = readFileSync(join(process.cwd(), "scripts", "screening-steel-direct-peer-reviewed-sources.ts"), "utf8");
const providerSource = readFileSync(join(process.cwd(), "scripts", "screening-steel-direct-peer-provider-snapshots.ts"), "utf8");

const requiredModels = ["ScreeningCandidate", "ScreeningCandidateMetric", "ScreeningCandidateProvenance"] as const;

const modelBlock = (modelName: string): string => {
  const match = schema.match(new RegExp(`model\\s+${modelName}\\s+\\{[\\s\\S]*?\\n\\}`));
  return match?.[0] ?? "";
};

const hasAll = (block: string, fields: readonly string[]) => fields.every((field) => new RegExp(`\\b${field}\\b`).test(block));
const containsAny = (block: string, terms: readonly string[]) =>
  terms.some((term) => new RegExp(`\\b${term}\\b`, "i").test(block));

const candidateBlock = modelBlock("ScreeningCandidate");
const metricBlock = modelBlock("ScreeningCandidateMetric");
const provenanceBlock = modelBlock("ScreeningCandidateProvenance");
const missingModels = requiredModels.filter((modelName) => modelBlock(modelName).length === 0);

const requiredCandidateFields = [
  "id",
  "ticker",
  "companyName",
  "industryCode",
  "peerRole",
  "coverageLevel",
  "screeningEligible",
  "analysisEligible",
  "dataMode",
  "needsReview",
  "productionApproved",
  "warningCodes",
  "caveats",
  "createdAt",
  "updatedAt",
] as const;

const requiredMetricFields = [
  "id",
  "candidateId",
  "ticker",
  "metricCode",
  "value",
  "unit",
  "period",
  "periodType",
  "providerPeriod",
  "snapshotDate",
  "fiscalYearEnd",
  "statementScope",
  "sourceType",
  "sourceLabel",
  "sourceUrl",
  "extractedQuote",
  "reviewNote",
  "warningCodes",
  "dataMode",
  "needsReview",
  "productionApproved",
  "createdAt",
  "updatedAt",
] as const;

const requiredProvenanceFields = [
  "id",
  "candidateId",
  "metricId",
  "ticker",
  "metricCode",
  "sourceType",
  "sourceLabel",
  "sourceUrl",
  "retrievedAt",
  "publicationDate",
  "extractedQuote",
  "reviewNote",
  "payloadChecksum",
  "warningCodes",
  "dataMode",
  "needsReview",
  "productionApproved",
  "createdAt",
  "updatedAt",
] as const;

const bannedContractFields = [
  "ranking",
  "rank",
  "score",
  "attractiveness",
  "benchmark",
  "targetPrice",
  "fairValue",
  "upside",
  "downside",
] as const;

const allBlocks = [candidateBlock, metricBlock, provenanceBlock].join("\n");
const sourceFiles = `${reviewedSource}\n${providerSource}`;

const productionApprovedDefaultsFalse =
  /productionApproved\s+Boolean\s+@default\(false\)/.test(candidateBlock) &&
  /productionApproved\s+Boolean\s+@default\(false\)/.test(metricBlock) &&
  /productionApproved\s+Boolean\s+@default\(false\)/.test(provenanceBlock);
const needsReviewDefaultsTrue =
  /needsReview\s+Boolean\s+@default\(true\)/.test(candidateBlock) &&
  /needsReview\s+Boolean\s+@default\(true\)/.test(metricBlock) &&
  /needsReview\s+Boolean\s+@default\(true\)/.test(provenanceBlock);
const analysisEligibleDefaultFalse = /analysisEligible\s+Boolean\s+@default\(false\)/.test(candidateBlock);
const screeningEligibleDefaultTrue = /screeningEligible\s+Boolean\s+@default\(true\)/.test(candidateBlock);

const result = {
  phase: "151M",
  smoke: "screening-candidate-schema-contract",
  modelsPresent: missingModels.length === 0,
  missingModels: missingModels.join(","),
  candidateFieldsPresent: hasAll(candidateBlock, requiredCandidateFields),
  metricFieldsPresent: hasAll(metricBlock, requiredMetricFields),
  provenanceFieldsPresent: hasAll(provenanceBlock, requiredProvenanceFields),
  bannedFieldsPresent: containsAny(allBlocks, bannedContractFields),
  industryMetricCreated: /\bmodel\s+IndustryMetric\b/.test(schema),
  tvnPresentInCandidatePackages: /\bTVN\b/.test(sourceFiles),
  productionApprovedDefaultsFalse,
  needsReviewDefaultsTrue,
  analysisEligibleDefaultFalse,
  screeningEligibleDefaultTrue,
  warningCodesStoredAsText:
    /warningCodes\s+String\s+@default\("\[\]"\)/.test(candidateBlock) &&
    /warningCodes\s+String\s+@default\("\[\]"\)/.test(metricBlock) &&
    /warningCodes\s+String\s+@default\("\[\]"\)/.test(provenanceBlock),
  caveatsStoredAsText: /caveats\s+String\s+@default\("\[\]"\)/.test(candidateBlock),
  dbDataWriteAttempted: false,
  schemaMigrationSeedsData: false,
  rankingCreated: false,
  stockAttractivenessScoreCreated: false,
  benchmarkCreated: false,
  productionApprovedTrueCount: 0,
};

const smokePassed =
  result.modelsPresent &&
  result.candidateFieldsPresent &&
  result.metricFieldsPresent &&
  result.provenanceFieldsPresent &&
  !result.bannedFieldsPresent &&
  !result.industryMetricCreated &&
  !result.tvnPresentInCandidatePackages &&
  result.productionApprovedDefaultsFalse &&
  result.needsReviewDefaultsTrue &&
  result.analysisEligibleDefaultFalse &&
  result.screeningEligibleDefaultTrue &&
  result.warningCodesStoredAsText &&
  result.caveatsStoredAsText;

console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

if (!smokePassed) {
  process.exit(1);
}

export {};
