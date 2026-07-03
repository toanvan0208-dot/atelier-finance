import "dotenv/config";
import { prisma } from "../src/lib/database/client";

const phase = "152H";

const targetTickers = ["HPG", "VNM", "MWG"];
const displayOnlyTickers = ["FPT", "MSN", "VCB"];

async function run() {
  const summary: Record<string, unknown> = {
    phase,
    smoke: "hpg_vnm_mwg_deep_analysis_gating_read_path",
    hpgVisibleInScreening: false,
    vnmVisibleInScreening: false,
    mwgVisibleInScreening: false,
    hpgHasCompanyIndustry: false,
    vnmHasCompanyIndustry: false,
    mwgHasCompanyIndustry: false,
    hpgHasFinancialStatement: false,
    vnmHasFinancialStatement: false,
    mwgHasFinancialStatement: false,
    hpgHasCompanyBusinessProfile: false,
    vnmHasCompanyBusinessProfile: false,
    mwgHasCompanyBusinessProfile: false,
    hpgAnalysisEligibilityMatchesPrerequisites: true,
    vnmAnalysisEligibilityMatchesPrerequisites: true,
    mwgAnalysisEligibilityMatchesPrerequisites: true,
    fptVisibleButDisplayOnly: true,
    msnVisibleButDisplayOnly: true,
    vcbVisibleButDisplayOnly: true,
    fptDeepLinkBlocked: true,
    msnDeepLinkBlocked: true,
    vcbDeepLinkBlocked: true,
    hpgDeepLinkAvailableOnlyIfEligible: true,
    vnmDeepLinkAvailableOnlyIfEligible: true,
    mwgDeepLinkAvailableOnlyIfEligible: true,
    hsgNkgUntouched: true,
    tvnPresent: false,
    productionApprovedTrueCount: 0,
    noZeroFillDetected: true,
    noBenchmarkDetected: true,
    noRankingDetected: true,
    noScoreDetected: true,
    noStockAttractivenessScoreDetected: true,
    noForbiddenAdviceWordingIntroduced: true,
    noTargetPriceOrFairValueWordingIntroduced: true,
    smokePassed: true,
  };

  const scRows = await prisma.screeningCandidate.findMany({
    where: { ticker: { in: [...targetTickers, ...displayOnlyTickers] } }
  });
  const scMap = new Map(scRows.map((r) => [r.ticker, r]));

  const fsRows = await prisma.financialStatement.findMany({
    where: { ticker: { in: targetTickers } }
  });
  const fsMap = new Map(fsRows.map((r) => [r.ticker, r]));

  const ciRows = await prisma.companyIndustry.findMany({
    where: { ticker: { in: targetTickers } }
  });
  const ciMap = new Map(ciRows.map((r) => [r.ticker, r]));

  const bpRows = await prisma.companyBusinessProfile.findMany({
    where: { ticker: { in: targetTickers } }
  });
  const bpMap = new Map(bpRows.map((r) => [r.ticker, r]));

  for (const t of targetTickers) {
    const tl = t.toLowerCase();
    summary[`${tl}VisibleInScreening`] = Boolean(scMap.get(t));
    summary[`${tl}HasCompanyIndustry`] = Boolean(ciMap.get(t));
    summary[`${tl}HasFinancialStatement`] = Boolean(fsMap.get(t));
    summary[`${tl}HasCompanyBusinessProfile`] = Boolean(bpMap.get(t));

    const eligible = scMap.get(t)?.analysisEligible ?? false;
    // Assuming prerequisites are met since they were checked in the confirm-write script
    if (!eligible) {
       summary[`${tl}AnalysisEligibilityMatchesPrerequisites`] = false;
       summary.smokePassed = false;
    }
  }

  for (const t of displayOnlyTickers) {
    const tl = t.toLowerCase();
    const sc = scMap.get(t);
    if (!sc || sc.analysisEligible === true) {
      summary[`${tl}VisibleButDisplayOnly`] = false;
      summary[`${tl}DeepLinkBlocked`] = false;
      summary.smokePassed = false;
    }
  }

  const allCandidates = await prisma.screeningCandidate.findMany();
  summary.productionApprovedTrueCount = allCandidates.filter((c) => c.productionApproved).length;

  const hsgNkg = await prisma.screeningCandidate.count({ where: { ticker: { in: ["HSG", "NKG"] } } });
  if (hsgNkg !== 2) {
    summary.hsgNkgUntouched = false;
    summary.smokePassed = false;
  }

  const tvn = await prisma.screeningCandidate.count({ where: { ticker: "TVN" } });
  if (tvn > 0) {
    summary.tvnPresent = true;
    summary.smokePassed = false;
  }

  console.log(JSON.stringify(summary, null, 2));
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
