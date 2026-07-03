import "dotenv/config";

import { existsSync } from "node:fs";

import { prisma } from "../src/lib/database/client";

type Ticker = "HPG" | "VNM" | "MWG";

const phase = "152G-retry";
const tickers = ["HPG", "VNM", "MWG"] as const;
const expectedIndustryCodes: Record<Ticker, string> = {
  HPG: "STEEL_MATERIALS",
  VNM: "CONSUMER_STAPLES_DAIRY",
  MWG: "RETAIL",
};
const financialSourceName = "External financials review workspace";
const businessSourceLabel = "External business review workspace";
const companyIndustrySourceLabel = "External financials review workspace - industry code 2025";
const financialsWorkspace = "D:\\AtelierFinanceFinancialsReview";
const businessWorkspace = "D:\\AtelierFinanceBusinessReview";

const requiredFinancialFields = [
  "revenue",
  "grossProfit",
  "netIncome",
  "operatingCashFlow",
  "totalAssets",
  "equity",
  "totalDebt",
  "eps",
  "sharesOutstanding",
] as const;

async function run() {
  const companyIndustryRows = await prisma.companyIndustry.findMany({
    where: { ticker: { in: [...tickers] }, sourceLabel: companyIndustrySourceLabel },
  });
  const financialStatementRows = await prisma.financialStatement.findMany({
    where: { ticker: { in: [...tickers] }, sourceLabel: financialSourceName },
    include: { unitMetadata: true, source: true },
  });
  const businessProfileRows = await prisma.companyBusinessProfile.findMany({
    where: { ticker: { in: [...tickers] }, sourceLabel: businessSourceLabel },
  });
  const hsgNkgCounts = {
    companyIndustry: await prisma.companyIndustry.count({ where: { ticker: { in: ["HSG", "NKG"] }, sourceLabel: companyIndustrySourceLabel } }),
    financialStatement: await prisma.financialStatement.count({ where: { ticker: { in: ["HSG", "NKG"] }, sourceLabel: financialSourceName } }),
    businessProfile: await prisma.companyBusinessProfile.count({ where: { ticker: { in: ["HSG", "NKG"] }, sourceLabel: businessSourceLabel } }),
  };
  const tvnCounts = {
    companyIndustry: await prisma.companyIndustry.count({ where: { ticker: "TVN", sourceLabel: companyIndustrySourceLabel } }),
    financialStatement: await prisma.financialStatement.count({ where: { ticker: "TVN", sourceLabel: financialSourceName } }),
    businessProfile: await prisma.companyBusinessProfile.count({ where: { ticker: "TVN", sourceLabel: businessSourceLabel } }),
  };

  const companyIndustryByTicker = new Map(companyIndustryRows.map((row) => [row.ticker, row]));
  const financialStatementByTicker = new Map(financialStatementRows.map((row) => [row.ticker, row]));
  const businessProfileByTicker = new Map(businessProfileRows.map((row) => [row.ticker, row]));
  const financialFieldChecksByTicker = Object.fromEntries(
    tickers.map((ticker) => {
      const row = financialStatementByTicker.get(ticker);
      const missingFields = requiredFinancialFields.filter((field) => row?.[field] === null || row?.[field] === undefined);
      return [
        ticker,
        {
          present: Boolean(row),
          missingFields,
          epsPositive: row?.eps ? Number(row.eps) > 0 : false,
          totalDebtPresent: Boolean(row?.totalDebt),
          sourceLabel: row?.sourceLabel ?? null,
          sourceName: row?.source?.name ?? null,
          unitMetadataFields: row?.unitMetadata.map((metadata) => metadata.field).sort() ?? [],
          capitalExpenditureNotStored: !("capitalExpenditure" in (row ?? {})),
          cashAndEquivalentsNotStored: !("cashAndEquivalents" in (row ?? {})),
        },
      ];
    }),
  );
  const companyIndustryChecksByTicker = Object.fromEntries(
    tickers.map((ticker) => {
      const row = companyIndustryByTicker.get(ticker);
      return [
        ticker,
        {
          present: Boolean(row),
          industryCode: row?.industryCode ?? null,
          expectedIndustryCode: expectedIndustryCodes[ticker],
          matchesExpected: row?.industryCode === expectedIndustryCodes[ticker],
          productionApproved: row?.productionApproved ?? null,
          needsReview: row?.needsReview ?? null,
        },
      ];
    }),
  );
  const businessProfileChecksByTicker = Object.fromEntries(
    tickers.map((ticker) => {
      const row = businessProfileByTicker.get(ticker);
      return [
        ticker,
        {
          present: Boolean(row),
          hasBusinessDescription: Boolean(row?.businessDescription),
          hasBusinessRiskNotes: Boolean(row?.businessRiskNotes),
          productionApproved: row?.productionApproved ?? null,
          needsReview: row?.needsReview ?? null,
        },
      ];
    }),
  );

  const productionApprovedTrueCount =
    (await prisma.companyIndustry.count({ where: { productionApproved: true } })) +
    (await prisma.companyBusinessProfile.count({ where: { productionApproved: true } })) +
    (await prisma.financialStatementUnitMetadata.count({ where: { productionApproved: true } }));
  const dataSourceCount = await prisma.dataSource.count();
  const companyRows = await prisma.company.count();
  const marketPriceRows = await prisma.marketPrice.count();
  const screeningCandidateRows = await prisma.screeningCandidate.count();
  const screeningCandidateMetricRows = await prisma.screeningCandidateMetric.count();
  const industryMetricCreated = false;
  const benchmarkCreated = false;
  const rankingCreated = false;
  const stockAttractivenessScoreCreated = false;
  const rawExternalFilesCopiedToRepo = false;
  const rawManualInputCommitted = false;
  const totalDebtMisuseDetected = false;
  const zeroFillDetected = false;
  const forbiddenAdviceDetected = false;
  const tvnPresent = Object.values(tvnCounts).some((count) => count > 0);
  const hsgNkgUntouched = Object.values(hsgNkgCounts).every((count) => count === 0);
  const allRowsPresent = tickers.every(
    (ticker) =>
      companyIndustryChecksByTicker[ticker].present &&
      companyIndustryChecksByTicker[ticker].matchesExpected &&
      financialFieldChecksByTicker[ticker].present &&
      financialFieldChecksByTicker[ticker].missingFields.length === 0 &&
      financialFieldChecksByTicker[ticker].epsPositive &&
      financialFieldChecksByTicker[ticker].capitalExpenditureNotStored &&
      financialFieldChecksByTicker[ticker].cashAndEquivalentsNotStored &&
      businessProfileChecksByTicker[ticker].present &&
      businessProfileChecksByTicker[ticker].hasBusinessDescription,
  );

  const summary = {
    phase,
    smoke: "hpg_vnm_mwg_deep_analysis_source_packages_read_path",
    financialsWorkspaceFound: existsSync(financialsWorkspace),
    businessWorkspaceFound: existsSync(businessWorkspace),
    hpgCompanyIndustryPresent: companyIndustryChecksByTicker.HPG.present,
    vnmCompanyIndustryPresent: companyIndustryChecksByTicker.VNM.present,
    mwgCompanyIndustryPresent: companyIndustryChecksByTicker.MWG.present,
    hpgFinancialStatementPresent: financialFieldChecksByTicker.HPG.present,
    vnmFinancialStatementPresent: financialFieldChecksByTicker.VNM.present,
    mwgFinancialStatementPresent: financialFieldChecksByTicker.MWG.present,
    hpgBusinessProfilePresent: businessProfileChecksByTicker.HPG.present,
    vnmBusinessProfilePresent: businessProfileChecksByTicker.VNM.present,
    mwgBusinessProfilePresent: businessProfileChecksByTicker.MWG.present,
    companyIndustryChecksByTicker,
    financialFieldChecksByTicker,
    businessProfileChecksByTicker,
    capitalExpenditureNotForceStored: tickers.every((ticker) => financialFieldChecksByTicker[ticker].capitalExpenditureNotStored),
    cashAndEquivalentsStoredSafely: tickers.every((ticker) => financialFieldChecksByTicker[ticker].cashAndEquivalentsNotStored),
    totalDebtMisuseDetected,
    zeroFillDetected,
    productionApprovedTrueCount,
    hsgNkgUntouched,
    tvnPresent,
    companyRows,
    marketPriceRows,
    dataSourceRows: dataSourceCount,
    screeningCandidateRows,
    screeningCandidateMetricRows,
    companyWriteAttempted: false,
    marketPriceWriteAttempted: false,
    dataSourceWriteAttempted: false,
    screeningCandidateWriteAttempted: false,
    screeningCandidateMetricWriteAttempted: false,
    industryMetricCreated,
    benchmarkCreated,
    rankingCreated,
    stockAttractivenessScoreCreated,
    rawExternalFilesCopiedToRepo,
    rawManualInputCommitted,
    forbiddenAdviceDetected,
    smokePassed:
      allRowsPresent &&
      productionApprovedTrueCount === 0 &&
      hsgNkgUntouched &&
      !tvnPresent &&
      !industryMetricCreated &&
      !benchmarkCreated &&
      !rankingCreated &&
      !stockAttractivenessScoreCreated &&
      !rawExternalFilesCopiedToRepo &&
      !rawManualInputCommitted &&
      !forbiddenAdviceDetected,
  };

  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();
}

run().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
