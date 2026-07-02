import "dotenv/config";

import { execSync } from "node:child_process";

import { prisma } from "../src/lib/database/client";

const phase = "151Y";
const coreTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"] as const;
const csvPath = "data/manual-review/company-identity/fpt-hpg-vnm-company-identity-reviewed.csv";

const expectedCompanyNames = {
  FPT: "Công ty Cổ phần FPT",
  HPG: "Công ty Cổ phần Tập đoàn Hòa Phát",
  VNM: "Công ty Cổ phần Sữa Việt Nam",
  MSN: "Công ty Cổ phần Tập đoàn Masan",
  MWG: "Công ty Cổ phần Đầu tư Thế Giới Di Động",
  VCB: "Ngân hàng TMCP Ngoại thương Việt Nam",
} as const;

const rawCsvCommitted = (): boolean => {
  try {
    execSync(`git ls-files --error-unmatch "${csvPath}"`, { cwd: process.cwd(), stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

async function run() {
  const companies = await prisma.company.findMany({
    where: { ticker: { in: [...coreTickers] } },
    orderBy: { ticker: "asc" },
  });

  const rowByTicker = new Map(companies.map((company) => [company.ticker, company]));
  const tickerPresent = Object.fromEntries(
    coreTickers.map((ticker) => [ticker, rowByTicker.get(ticker)?.companyName === expectedCompanyNames[ticker]]),
  );

  const hsgNkgCompanyRows = await prisma.company.count({ where: { ticker: { in: ["HSG", "NKG"] } } });
  const tvnCompanyRows = await prisma.company.count({ where: { ticker: "TVN" } });
  const productionApprovedCompanyRows = await prisma.company.count({
    where: { ticker: { in: [...coreTickers] }, dataMode: "production_approved" },
  });

  const screeningCandidateRows = await prisma.screeningCandidate.count();
  const marketPriceRows = await prisma.marketPrice.count();
  const financialStatementRows = await prisma.financialStatement.count();
  const companyIndustryRows = await prisma.companyIndustry.count();

  const summary = {
    phase,
    smoke: "core_ticker_company_metadata_all_six_read_path",
    fptCompanyPresent: tickerPresent.FPT,
    hpgCompanyPresent: tickerPresent.HPG,
    vnmCompanyPresent: tickerPresent.VNM,
    msnCompanyPresent: tickerPresent.MSN,
    mwgCompanyPresent: tickerPresent.MWG,
    vcbCompanyPresent: tickerPresent.VCB,
    companyRowsFound: companies.length,
    companyRows: companies.map((company) => ({
      ticker: company.ticker,
      companyName: company.companyName,
      exchange: company.exchange,
      companyType: company.companyType,
      country: company.country,
      currency: company.currency,
      dataMode: company.dataMode,
    })),
    hsgNkgUntouched: hsgNkgCompanyRows === 0,
    tvnPresent: tvnCompanyRows > 0,
    productionApprovedTrueCount: productionApprovedCompanyRows,
    screeningCandidateWriteAttempted: false,
    marketPriceWriteAttempted: false,
    financialStatementWriteAttempted: false,
    companyIndustryWriteAttempted: false,
    screeningCandidateRows,
    marketPriceRows,
    financialStatementRows,
    companyIndustryRows,
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated: false,
    rawCsvCommitted: rawCsvCommitted(),
    smokePassed:
      Object.values(tickerPresent).every(Boolean) &&
      hsgNkgCompanyRows === 0 &&
      tvnCompanyRows === 0 &&
      productionApprovedCompanyRows === 0 &&
      !rawCsvCommitted(),
  };

  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();

  if (!summary.smokePassed) {
    process.exitCode = 1;
  }
}

run().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
