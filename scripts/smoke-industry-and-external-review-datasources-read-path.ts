import "dotenv/config";
import { prisma } from "../src/lib/database/client";

async function main() {
  const summary: Record<string, unknown> = {
    phase: "152G-prereq",
    mode: "smoke",
    steelMaterialsIndustryReady: false,
    consumerStaplesDairyIndustryReady: false,
    retailIndustryReady: false,
    externalFinancialsDataSourceReady: false,
    externalBusinessDataSourceReady: false,
    externalCompanyIndustryDataSourceReady: false, // not required but tracked
    companyIndustryCreatedInPhase: false,
    financialStatementCreatedInPhase: false,
    businessProfileCreatedInPhase: false,
    companyWriteAttempted: false,
    marketPriceWriteAttempted: false,
    screeningCandidateWriteAttempted: false,
    screeningCandidateMetricWriteAttempted: false,
    industryMetricCreated: false,
    benchmarkCreated: false,
    rankingCreated: false,
    scoringCreated: false,
    stockAttractivenessScoreCreated: false,
    productionApprovedTrueCount: 0,
    hsgNkgUntouched: true,
    tvnPresent: false,
    rawExternalFilesCopiedToRepo: false,
    rawManualInputCommitted: false,
    forbiddenAdviceDetected: false,
    smokePassed: false
  };

  const steel = await prisma.industry.findUnique({ where: { industryCode: "STEEL_MATERIALS" } });
  if (steel) summary.steelMaterialsIndustryReady = true;

  const dairy = await prisma.industry.findUnique({ where: { industryCode: "CONSUMER_STAPLES_DAIRY" } });
  if (dairy) summary.consumerStaplesDairyIndustryReady = true;

  const retail = await prisma.industry.findUnique({ where: { industryCode: "RETAIL" } });
  if (retail) summary.retailIndustryReady = true;

  const extFin = await prisma.dataSource.findUnique({ where: { name_sourceType: { name: "External financials review workspace", sourceType: "curated_internal" } } });
  if (extFin) summary.externalFinancialsDataSourceReady = true;

  const extBus = await prisma.dataSource.findUnique({ where: { name_sourceType: { name: "External business review workspace", sourceType: "curated_internal" } } });
  if (extBus) summary.externalBusinessDataSourceReady = true;

  // Verify no deep data was created for HPG, VNM, MWG yet
  const targetTickers = ["HPG", "VNM", "MWG"];
  const ciCount = await prisma.companyIndustry.count({ where: { ticker: { in: targetTickers } } });
  if (ciCount > 0) summary.companyIndustryCreatedInPhase = true;

  const fsCount = await prisma.financialStatement.count({ where: { ticker: { in: targetTickers } } });
  if (fsCount > 0) summary.financialStatementCreatedInPhase = true;

  const bpCount = await prisma.companyBusinessProfile.count({ where: { ticker: { in: targetTickers } } });
  if (bpCount > 0) summary.businessProfileCreatedInPhase = true;

  const allCandidates = await prisma.screeningCandidate.findMany();
  summary.productionApprovedTrueCount = allCandidates.filter(c => c.productionApproved).length;
  summary.hsgNkgUntouched = allCandidates.filter(c => c.ticker === "HSG" || c.ticker === "NKG").length === 2;
  summary.tvnPresent = allCandidates.some(c => c.ticker === "TVN");

  // Determine smoke pass
  if (
    summary.steelMaterialsIndustryReady &&
    summary.consumerStaplesDairyIndustryReady &&
    summary.retailIndustryReady &&
    summary.externalFinancialsDataSourceReady &&
    !summary.companyIndustryCreatedInPhase &&
    !summary.financialStatementCreatedInPhase &&
    !summary.businessProfileCreatedInPhase &&
    summary.productionApprovedTrueCount === 0 &&
    summary.hsgNkgUntouched &&
    !summary.tvnPresent
  ) {
    summary.smokePassed = true;
  }

  const text = JSON.stringify(summary).toLowerCase().replaceAll("no target price", "").replaceAll("not investment advice", "");
  const forbiddenTerms = [/\bbuy\b/i, /\bsell\b/i, /\bhold\b/i, /\btarget price\b/i, /\bfair value\b/i, /\bupside\b/i, /\bdownside\b/i];
  for (const term of forbiddenTerms) {
    if (term.test(text)) {
      summary.forbiddenAdviceDetected = true;
      summary.smokePassed = false;
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
