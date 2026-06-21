import { getMarketPriceSeries } from "../src/lib/data-sources/market-price-read-service";
import { loadTechnicalDeskData } from "../src/features/technical/lib/load-technical-desk-data";
import {
  runControlledVnstockMarketPvtIngestionBatch,
  VNSTOCK_RESEARCH_SOURCE_LABEL,
} from "../src/lib/data-sources/vnstock-market-pvt-controlled-ingestion";

const valueAfter = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const tickerList = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter(Boolean);

const totalsFor = (
  results: Awaited<ReturnType<typeof runControlledVnstockMarketPvtIngestionBatch>>,
) =>
  results.reduce(
    (totals, item) => ({
      inputRows: totals.inputRows + item.result.summary.totalRows,
      validRows: totals.validRows + item.result.summary.validRows,
      invalidRows: totals.invalidRows + item.result.summary.invalidRows,
      skippedRows: totals.skippedRows + item.result.summary.skippedRows,
      writtenRows: totals.writtenRows + item.result.summary.writtenRows,
    }),
    { inputRows: 0, validRows: 0, invalidRows: 0, skippedRows: 0, writtenRows: 0 },
  );

const technicalReadFor = async (ticker: string, from: string, to: string) => {
  const read = await loadTechnicalDeskData(
    { ticker, from, to, sourceLabel: VNSTOCK_RESEARCH_SOURCE_LABEL, preferDb: true },
    { readMarketPriceSeries: (params) => getMarketPriceSeries(params) },
  );

  return {
    fallbackUsed: read.fallbackUsed,
    source: read.source,
    marketDataSource: read.marketDataSource,
    availableObservations: read.data?.pvtDerivedMetrics?.availableObservations ?? null,
  };
};

const main = async () => {
  const tickers = tickerList(valueAfter("--ticker"));
  const from = valueAfter("--from");
  const to = valueAfter("--to");

  if (tickers.length === 0 || !from || !to) {
    throw new Error("Usage: --ticker FPT[,MWG,VNM] --from YYYY-MM-DD --to YYYY-MM-DD [--confirm-write] [--verify-technical-read]");
  }

  const results = await runControlledVnstockMarketPvtIngestionBatch({
    tickers,
    from,
    to,
    confirmWrite: process.argv.includes("--confirm-write"),
  });
  const verifyTechnicalRead = process.argv.includes("--verify-technical-read");
  const technicalRead = verifyTechnicalRead
    ? Object.fromEntries(await Promise.all(results.map(async ({ ticker }) => [ticker, await technicalReadFor(ticker, from, to)])))
    : undefined;

  console.log(JSON.stringify({
    status: "controlled_vnstock_market_pvt_completed",
    dryRun: results.every((item) => item.result.dryRun),
    confirmWrite: process.argv.includes("--confirm-write"),
    sourceLabel: VNSTOCK_RESEARCH_SOURCE_LABEL,
    productionApproved: false,
    tickerCount: results.length,
    tickerList: results.map((item) => item.ticker),
    totals: totalsFor(results),
    results: results.map(({ ticker, result }) => ({
      ticker,
      status: result.status,
      dryRun: result.dryRun,
      productionApproved: result.productionApproved,
      audit: result.audit,
      summary: result.summary,
    })),
    technicalRead,
  }, null, 2));
};

void main();
