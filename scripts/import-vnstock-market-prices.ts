import { runVnstockMarketPriceImportCommand } from "../src/lib/data-sources/vnstock-market-price-import-command";

const main = async (): Promise<void> => {
  const report = await runVnstockMarketPriceImportCommand({
    argv: process.argv.slice(2),
    env: process.env,
  });

  console.log(JSON.stringify(report, null, 2));
  if (
    report.status !== "dry_run_completed" &&
    report.status !== "import_completed"
  ) {
    process.exitCode = 1;
  }
};

void main();
