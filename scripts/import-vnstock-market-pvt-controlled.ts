import { runControlledVnstockMarketPvtIngestion } from "../src/lib/data-sources/vnstock-market-pvt-controlled-ingestion";

const valueAfter = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const main = async () => {
  const ticker = valueAfter("--ticker");
  const from = valueAfter("--from");
  const to = valueAfter("--to");

  if (!ticker || !from || !to) {
    throw new Error("Usage: --ticker FPT --from YYYY-MM-DD --to YYYY-MM-DD [--confirm-write]");
  }

  const result = await runControlledVnstockMarketPvtIngestion({
    ticker,
    from,
    to,
    confirmWrite: process.argv.includes("--confirm-write"),
  });

  console.log(JSON.stringify({
    status: result.status,
    dryRun: result.dryRun,
    productionApproved: result.productionApproved,
    audit: result.audit,
    summary: result.summary,
  }, null, 2));
};

void main();
