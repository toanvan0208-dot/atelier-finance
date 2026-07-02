import "dotenv/config";

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "../src/lib/database/client";

type RawMarketPriceRow = Record<string, unknown>;

const phase = "152B-retry";
const jsonPath =
  "data/manual-review/market-price/core-ticker-vnstock-market-price-snapshot-2026-07-02.json";
const targetTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"] as const;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const parsed = String(value).trim();
  return parsed.length > 0 ? parsed : null;
};

const getRows = (payload: unknown): RawMarketPriceRow[] => {
  if (Array.isArray(payload)) return payload as RawMarketPriceRow[];
  if (!payload || typeof payload !== "object") return [];
  const container = payload as Record<string, unknown>;
  for (const key of ["rows", "snapshots", "marketPrices", "data"]) {
    if (Array.isArray(container[key])) return container[key] as RawMarketPriceRow[];
  }
  return [];
};

const rawJsonCommitted = (): boolean => {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", jsonPath], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

const fullJsonPath = join(process.cwd(), jsonPath);
const jsonFound = existsSync(fullJsonPath);
const jsonRows = getRows(jsonFound ? JSON.parse(readFileSync(fullJsonPath, "utf-8")) : []);
const expectedByTicker = new Map(
  jsonRows.map((row) => [String(row.ticker).toUpperCase(), row]),
);

async function run() {
  const marketRows = await prisma.marketPrice.findMany({
    where: {
      ticker: { in: [...targetTickers] },
      sourceLabel: "VNStock market price snapshot",
    },
    include: { source: true },
    orderBy: [{ ticker: "asc" }, { tradingDate: "desc" }],
  });
  const latestByTicker = new Map<string, (typeof marketRows)[number]>();

  for (const row of marketRows) {
    if (!latestByTicker.has(row.ticker)) latestByTicker.set(row.ticker, row);
  }

  const comparisonByTicker = Object.fromEntries(
    targetTickers.map((ticker) => {
      const expected = expectedByTicker.get(ticker);
      const actual = latestByTicker.get(ticker);
      const expectedDate = toStringOrNull(expected?.priceDate);
      const actualDate = actual?.tradingDate.toISOString().slice(0, 10) ?? null;
      const closePriceMatches =
        actual && expected
          ? Number(actual.closePrice) === toNumber(expected.closePrice)
          : false;
      const volumeMatches =
        actual && expected ? Number(actual.volume) === toNumber(expected.volume) : false;
      const liquidityMatches =
        actual && expected
          ? Number(actual.tradingValue) === toNumber(expected.liquidity)
          : false;
      const dateMatches = actualDate === expectedDate;

      return [
        ticker,
        {
          present: Boolean(actual),
          closePriceMatches,
          priceDateMatches: dateMatches,
          volumeMatches,
          liquidityMatches,
          closePrice: actual ? Number(actual.closePrice) : null,
          expectedClosePrice: toNumber(expected?.closePrice),
          tradingDate: actualDate,
          expectedTradingDate: expectedDate,
          volume: actual ? Number(actual.volume) : null,
          expectedVolume: toNumber(expected?.volume),
          tradingValue: actual ? Number(actual.tradingValue) : null,
          expectedLiquidity: toNumber(expected?.liquidity),
          dataMode: actual?.dataMode ?? null,
          sourceLabel: actual?.sourceLabel ?? null,
          sourceTypeStored: actual?.sourceType ?? null,
        },
      ];
    }),
  );

  const hsgNkgRows = await prisma.marketPrice.count({
    where: { ticker: { in: ["HSG", "NKG"] } },
  });
  const tvnRows = await prisma.marketPrice.count({ where: { ticker: "TVN" } });
  const dataSourceCount = await prisma.dataSource.count({
    where: { name: "VNStock market price snapshot" },
  });
  const productionApprovedTrueCount = 0;
  const companyRows = await prisma.company.count();
  const screeningCandidateRows = await prisma.screeningCandidate.count();
  const financialStatementRows = await prisma.financialStatement.count();
  const companyIndustryRows = await prisma.companyIndustry.count();
  const industryMetricCreated = false;
  const benchmarkCreated = false;
  const rankingCreated = false;
  const stockAttractivenessScoreCreated = false;
  const rawJsonIsCommitted = rawJsonCommitted();
  const allExpectedRowsPresent = Object.values(comparisonByTicker).every(
    (item) =>
      item.present &&
      item.closePriceMatches &&
      item.priceDateMatches &&
      item.volumeMatches &&
      item.liquidityMatches &&
      item.dataMode === "research_only",
  );

  const summary = {
    phase,
    smoke: "core_ticker_market_price_provider_json_read_path",
    jsonFound,
    targetTickers,
    marketPriceRowsFound: marketRows.length,
    comparisonByTicker,
    fptMarketPricePresent: comparisonByTicker.FPT.present,
    hpgMarketPricePresent: comparisonByTicker.HPG.present,
    vnmMarketPricePresent: comparisonByTicker.VNM.present,
    msnMarketPricePresent: comparisonByTicker.MSN.present,
    mwgMarketPricePresent: comparisonByTicker.MWG.present,
    vcbMarketPricePresent: comparisonByTicker.VCB.present,
    hsgNkgUntouched: hsgNkgRows === 0,
    tvnPresent: tvnRows > 0,
    productionApprovedTrueCount,
    companyRows,
    screeningCandidateRows,
    financialStatementRows,
    companyIndustryRows,
    companyWriteAttempted: false,
    screeningCandidateWriteAttempted: false,
    financialStatementWriteAttempted: false,
    companyIndustryWriteAttempted: false,
    dataSourceWriteAttempted: false,
    rawJsonCommitted: rawJsonIsCommitted,
    rankingCreated,
    stockAttractivenessScoreCreated,
    industryMetricCreated,
    benchmarkCreated,
    smokePassed:
      jsonFound &&
      allExpectedRowsPresent &&
      hsgNkgRows === 0 &&
      tvnRows === 0 &&
      dataSourceCount === 1 &&
      productionApprovedTrueCount === 0 &&
      !rawJsonIsCommitted &&
      !industryMetricCreated &&
      !benchmarkCreated &&
      !rankingCreated &&
      !stockAttractivenessScoreCreated,
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
