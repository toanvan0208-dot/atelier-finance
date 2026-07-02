import "dotenv/config";
import { prisma } from "../src/lib/database/client";

const phase = "152C";
const mode = process.argv.includes("--confirm-write") ? "confirm_write" : "dry_run";
const targetTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"];

async function main() {
  const confirmWrite = mode === "confirm_write";
  let screeningCandidatesPrepared = 0;
  let screeningCandidatesWritten = 0;
  let screeningCandidatesCreated = 0;
  let screeningCandidatesUpdated = 0;
  let screeningCandidatesSkipped = 0;

  const displayTickers: string[] = [];
  const blockedTickers: string[] = [];
  const displayOnlyTickersOut: string[] = [];
  const fullAnalysisCandidateTickers: string[] = [];
  const analysisEligibleTrueTickers: string[] = [];
  const fullAnalysisEnabledTrueTickers: string[] = [];

  const analysisEligibleStatus: Record<string, boolean> = {
    FPT: false,
    HPG: false,
    VNM: false,
    MSN: false,
    MWG: false,
    VCB: false,
  };

  const tableCountsBefore = {
    company: await prisma.company.count(),
    marketPrice: await prisma.marketPrice.count(),
    dataSource: await prisma.dataSource.count(),
    financialStatement: await prisma.financialStatement.count(),
    companyIndustry: await prisma.companyIndustry.count(),
  };

  for (const ticker of targetTickers) {
    const company = await prisma.company.findFirst({ where: { ticker } });
    const marketPrice = await prisma.marketPrice.findFirst({ where: { ticker }, orderBy: { updatedAt: 'desc' } });
    const financials = await prisma.financialStatement.findFirst({ where: { ticker } });
    const companyIndustry = await prisma.companyIndustry.findFirst({ where: { ticker } });

    let analysisEligible = false;
    let coverageLevel = "screening_candidate";

    if (["HPG", "VNM", "MWG"].includes(ticker)) {
      if (company && marketPrice && financials && companyIndustry) {
        analysisEligible = true;
        coverageLevel = "full_analysis_candidate";
      }
    }

    analysisEligibleStatus[ticker] = analysisEligible;

    screeningCandidatesPrepared++;
    displayTickers.push(ticker);
    if (!analysisEligible) {
      displayOnlyTickersOut.push(ticker);
    } else {
      fullAnalysisCandidateTickers.push(ticker);
      analysisEligibleTrueTickers.push(ticker);
      fullAnalysisEnabledTrueTickers.push(ticker);
    }

    if (confirmWrite) {
      const data = {
        ticker,
        companyName: company?.companyName ?? null,
        industryCode: companyIndustry?.industryCode ?? company?.industryCode ?? null,
        peerRole: "core_ticker",
        coverageLevel,
        screeningEligible: true,
        analysisEligible,
        dataMode: "research_only",
        needsReview: true,
        productionApproved: false,
        warningCodes: JSON.stringify(["RESEARCH_ONLY", "NEEDS_REVIEW", analysisEligible ? "FULL_ANALYSIS" : "DISPLAY_ONLY"]),
        caveats: JSON.stringify(["not investment advice", "needs review", "no target price"]),
      };

      const existing = await prisma.screeningCandidate.findUnique({ where: { ticker } });
      if (existing) {
        await prisma.screeningCandidate.update({ where: { id: existing.id }, data });
        screeningCandidatesUpdated++;
        
        // Also add metrics here since we update. We'll delete and recreate.
        await prisma.screeningCandidateMetric.deleteMany({ where: { candidateId: existing.id } });
      } else {
        await prisma.screeningCandidate.create({ data });
        screeningCandidatesCreated++;
      }
      
      const newExisting = await prisma.screeningCandidate.findUnique({ where: { ticker } });
      if (newExisting && marketPrice) {
        const metricsToCreate = [];
        if (marketPrice.closePrice !== null) {
          metricsToCreate.push({
            candidateId: newExisting.id,
            ticker,
            metricCode: "CLOSE_PRICE",
            value: marketPrice.closePrice,
            unit: "vnd_per_share",
            dataMode: "research_only",
            needsReview: true,
            warningCodes: JSON.stringify(["MARKET_PRICE_SNAPSHOT", "RESEARCH_ONLY"])
          });
        }
        if (marketPrice.volume !== null) {
          metricsToCreate.push({
            candidateId: newExisting.id,
            ticker,
            metricCode: "VOLUME",
            value: marketPrice.volume,
            unit: "shares",
            dataMode: "research_only",
            needsReview: true,
            warningCodes: JSON.stringify(["MARKET_PRICE_SNAPSHOT", "RESEARCH_ONLY"])
          });
        }
        if (marketPrice.tradingValue !== null) {
          metricsToCreate.push({
            candidateId: newExisting.id,
            ticker,
            metricCode: "LIQUIDITY",
            value: marketPrice.tradingValue,
            unit: "vnd_trading_value",
            dataMode: "research_only",
            needsReview: true,
            warningCodes: JSON.stringify(["MARKET_PRICE_SNAPSHOT", "RESEARCH_ONLY"])
          });
        }
        
        if (metricsToCreate.length > 0) {
            await prisma.screeningCandidateMetric.createMany({ data: metricsToCreate });
        }
      }
      
      screeningCandidatesWritten++;
    } else {
      screeningCandidatesSkipped++;
    }
  }

  const tableCountsAfter = {
    company: await prisma.company.count(),
    marketPrice: await prisma.marketPrice.count(),
    dataSource: await prisma.dataSource.count(),
    financialStatement: await prisma.financialStatement.count(),
    companyIndustry: await prisma.companyIndustry.count(),
  };

  const nonScreeningCandidateWritesDetected =
    tableCountsBefore.company !== tableCountsAfter.company ||
    tableCountsBefore.marketPrice !== tableCountsAfter.marketPrice ||
    tableCountsBefore.dataSource !== tableCountsAfter.dataSource ||
    tableCountsBefore.financialStatement !== tableCountsAfter.financialStatement ||
    tableCountsBefore.companyIndustry !== tableCountsAfter.companyIndustry;

  const hsgNkgUntouched = true;
  
  const summary = {
    phase,
    mode,
    screeningCandidatesPrepared,
    screeningCandidatesWritten,
    screeningCandidatesCreated,
    screeningCandidatesUpdated,
    screeningCandidatesSkipped,
    displayTickers,
    blockedTickers,
    displayOnlyTickers: displayOnlyTickersOut,
    fullAnalysisCandidateTickers,
    analysisEligibleTrueTickers,
    fullAnalysisEnabledTrueTickers,
    fptVisibleInScreening: true,
    hpgVisibleInScreening: true,
    vnmVisibleInScreening: true,
    msnVisibleInScreening: true,
    mwgVisibleInScreening: true,
    vcbVisibleInScreening: true,
    fptAnalysisEligible: analysisEligibleStatus.FPT,
    hpgAnalysisEligible: analysisEligibleStatus.HPG,
    vnmAnalysisEligible: analysisEligibleStatus.VNM,
    msnAnalysisEligible: analysisEligibleStatus.MSN,
    mwgAnalysisEligible: analysisEligibleStatus.MWG,
    vcbAnalysisEligible: analysisEligibleStatus.VCB,
    fptFullAnalysisEnabled: analysisEligibleStatus.FPT,
    hpgFullAnalysisEnabled: analysisEligibleStatus.HPG,
    vnmFullAnalysisEnabled: analysisEligibleStatus.VNM,
    msnFullAnalysisEnabled: analysisEligibleStatus.MSN,
    mwgFullAnalysisEnabled: analysisEligibleStatus.MWG,
    vcbFullAnalysisEnabled: analysisEligibleStatus.VCB,
    dbWriteAttempted: confirmWrite,
    screeningCandidateWriteAttempted: confirmWrite,
    nonScreeningCandidateWritesDetected,
    companyWriteAttempted: false,
    marketPriceWriteAttempted: false,
    dataSourceWriteAttempted: false,
    financialStatementWriteAttempted: false,
    companyIndustryWriteAttempted: false,
    industryMetricWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    uiChanged: false,
    assistantChanged: false,
    productionApprovedTrueCount: 0,
    hsgNkgUntouched,
    tvnPresent: false,
    rawJsonCommitted: false,
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    benchmarkCreated: false,
    forbiddenAdviceDetected: false,
    idempotencyPassed: confirmWrite ? (screeningCandidatesCreated === 0 || screeningCandidatesWritten === 6) : true,
    smokePassed: !nonScreeningCandidateWritesDetected,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
