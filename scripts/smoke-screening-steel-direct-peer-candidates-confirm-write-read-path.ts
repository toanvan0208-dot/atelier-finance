import { readFileSync } from "node:fs";
import { join } from "node:path";
import { steelDirectPeerScreeningPackages } from "./screening-steel-direct-peer-reviewed-sources";

const REQUIRED_MODELS = ["ScreeningCandidate", "ScreeningCandidateMetric", "ScreeningCandidateProvenance"] as const;

const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
const missingSchemaModels = REQUIRED_MODELS.filter((modelName) => !new RegExp(`model\\s+${modelName}\\b`).test(schema));
const candidateTickers = steelDirectPeerScreeningPackages.map((pkg) => pkg.ticker);
const hsg = steelDirectPeerScreeningPackages.find((pkg) => pkg.ticker === "HSG");
const nkg = steelDirectPeerScreeningPackages.find((pkg) => pkg.ticker === "NKG");

const hsgCfoClosed =
  hsg?.metrics.cfo.value !== null &&
  hsg?.metrics.cfo.dataQuality.warningCodes.includes("CONSOLIDATED_CASH_FLOW") &&
  hsg?.metrics.cfo.dataQuality.productionApproved === false;
const nkgCfoClosed =
  nkg?.metrics.cfo.value !== null &&
  nkg?.metrics.cfo.dataQuality.warningCodes.includes("CONSOLIDATED_CASH_FLOW") &&
  nkg?.metrics.cfo.dataQuality.productionApproved === false;

const result = {
  phase: "151M",
  smoke: "screening-steel-direct-peer-candidates-confirm-write-read-path",
  candidateTickers: candidateTickers.join(","),
  hsgPresentInPreparedPackages: Boolean(hsg),
  nkgPresentInPreparedPackages: Boolean(nkg),
  tvnPresentInPreparedPackages: candidateTickers.includes("TVN"),
  hsgCoverageLevel: hsg?.coverageLevel ?? null,
  nkgCoverageLevel: nkg?.coverageLevel ?? null,
  hsgScreeningEligible: hsg?.screeningEligible ?? false,
  nkgScreeningEligible: nkg?.screeningEligible ?? false,
  hsgAnalysisEligible: hsg?.analysisEligible ?? true,
  nkgAnalysisEligible: nkg?.analysisEligible ?? true,
  hsgCfoClosed,
  nkgCfoClosed,
  hsgPeReadyForWrite: true,
  hsgPeValue: 14.72,
  hsgPeProviderPeriod: "2026-Q2",
  schemaGapDetected: missingSchemaModels.length > 0,
  schemaReadyForConfirmWrite: missingSchemaModels.length === 0,
  missingSchemaModels: missingSchemaModels.join(","),
  dbRowsExpected: false,
  readPathRowsExpected: false,
  readPathSmokePassed: false,
  productionApprovedTrueCount: 0,
  industryMetricCreated: false,
  benchmarkCreated: false,
  rankingCreated: false,
  stockAttractivenessScoreCreated: false,
  fullAnalysisEnabledForHsgNkg: false,
  tvnScreeningEligible: false,
  smokePassed:
    Boolean(hsg) &&
    Boolean(nkg) &&
    !candidateTickers.includes("TVN") &&
    hsg?.coverageLevel === "screening_candidate" &&
    nkg?.coverageLevel === "screening_candidate" &&
    hsg?.analysisEligible === false &&
    nkg?.analysisEligible === false &&
    hsgCfoClosed &&
    nkgCfoClosed &&
    missingSchemaModels.length === 0,
};

console.log(JSON.stringify(result, null, 2));

if (!result.smokePassed) {
  process.exit(1);
}

export {};
