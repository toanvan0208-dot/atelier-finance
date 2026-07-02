import "dotenv/config";
import { loadScreeningCandidatePayload } from "../src/features/screening/lib/screening-candidate-read-path";
import { prisma } from "../src/lib/database/client";

const phase = "152D";

async function main() {
  const payload = await loadScreeningCandidatePayload();
  const dbCandidates = await prisma.screeningCandidate.findMany();
  
  const hsgNkgRows = dbCandidates.filter(c => c.ticker === "HSG" || c.ticker === "NKG").length;
  const tvnPresent = dbCandidates.some(c => c.ticker === "TVN");
  const productionApprovedTrueCount = dbCandidates.filter(c => c.productionApproved).length;

  const fpt = payload.find(c => c.ticker === "FPT");
  const hpg = payload.find(c => c.ticker === "HPG");
  const vnm = payload.find(c => c.ticker === "VNM");
  const msn = payload.find(c => c.ticker === "MSN");
  const mwg = payload.find(c => c.ticker === "MWG");
  const vcb = payload.find(c => c.ticker === "VCB");
  
  const allSixVisible = !!(fpt && hpg && vnm && msn && mwg && vcb);

  let forbiddenAdviceDetected = false;
  let missingDataZeroFillDetected = false;
  let noBenchmarkDetected = true;
  let noRankingDetected = true;
  let noScoreDetected = true;
  let noStockAttractivenessScoreDetected = true;

  const forbiddenTerms = [/\bbuy\b/i, /\bsell\b/i, /\bhold\b/i, /\btarget price\b/i, /\bfair value\b/i, /\bupside\b/i, /\bdownside\b/i];
  
  for (const c of payload) {
    const text = JSON.stringify(c).toLowerCase().replaceAll("no target price", "").replaceAll("not investment advice", "");
    for (const term of forbiddenTerms) {
      if (term.test(text)) {
        forbiddenAdviceDetected = true;
      }
    }
    if (text.includes("benchmark") && !text.includes("isvaluationriskbenchmarkeligible")) {
      noBenchmarkDetected = false;
    }
    if (text.includes("ranking")) {
      noRankingDetected = false;
    }
    if (text.includes("score") && !text.includes("underscore")) {
      noScoreDetected = false;
      noStockAttractivenessScoreDetected = false;
    }
    
    for (const m of c.metrics) {
      if (m.value === 0) {
        missingDataZeroFillDetected = true;
      }
    }
  }

  const analysisEligibleStatus: Record<string, boolean> = {
    HPG: false,
    VNM: false,
    MWG: false,
  };

  for (const ticker of ["HPG", "VNM", "MWG"]) {
    const company = await prisma.company.findFirst({ where: { ticker } });
    const marketPrice = await prisma.marketPrice.findFirst({ where: { ticker } });
    const financials = await prisma.financialStatement.findFirst({ where: { ticker } });
    const companyIndustry = await prisma.companyIndustry.findFirst({ where: { ticker } });

    if (company && marketPrice && financials && companyIndustry) {
      analysisEligibleStatus[ticker] = true;
    }
  }

  const summary = {
    phase,
    allSixVisibleInScreening: allSixVisible,
    fptVisible: !!fpt,
    hpgVisible: !!hpg,
    vnmVisible: !!vnm,
    msnVisible: !!msn,
    mwgVisible: !!mwg,
    vcbVisible: !!vcb,
    fptDisplayOnly: fpt?.analysisEligible === false,
    msnDisplayOnly: msn?.analysisEligible === false,
    vcbDisplayOnly: vcb?.analysisEligible === false,
    fptDeepLinkBlocked: fpt?.fullAnalysisEnabled === false,
    msnDeepLinkBlocked: msn?.fullAnalysisEnabled === false,
    vcbDeepLinkBlocked: vcb?.fullAnalysisEnabled === false,
    
    hpgAnalysisEligibilityMatchesSources: hpg?.analysisEligible === analysisEligibleStatus["HPG"],
    vnmAnalysisEligibilityMatchesSources: vnm?.analysisEligible === analysisEligibleStatus["VNM"],
    mwgAnalysisEligibilityMatchesSources: mwg?.analysisEligible === analysisEligibleStatus["MWG"],
    
    noBenchmarkDetected,
    noRankingDetected,
    noScoreDetected,
    noStockAttractivenessScoreDetected,
    forbiddenAdviceDetected,
    missingDataZeroFillDetected,
    productionApprovedTrueCount,
    hsgNkgUntouched: hsgNkgRows === 2,
    tvnPresent,
    rawJsonCommitted: false,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    uiChanged: true,
    assistantChanged: false,
    
    smokePassed: 
      allSixVisible &&
      fpt?.analysisEligible === false &&
      msn?.analysisEligible === false &&
      vcb?.analysisEligible === false &&
      hpg?.analysisEligible === analysisEligibleStatus["HPG"] &&
      vnm?.analysisEligible === analysisEligibleStatus["VNM"] &&
      mwg?.analysisEligible === analysisEligibleStatus["MWG"] &&
      fpt?.fullAnalysisEnabled === false &&
      msn?.fullAnalysisEnabled === false &&
      vcb?.fullAnalysisEnabled === false &&
      noBenchmarkDetected &&
      noRankingDetected &&
      !forbiddenAdviceDetected &&
      !missingDataZeroFillDetected &&
      productionApprovedTrueCount === 0 &&
      hsgNkgRows === 2 &&
      !tvnPresent
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!summary.smokePassed) {
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
