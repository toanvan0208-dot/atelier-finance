import {
  runVnstockFinancialsPreview,
  VNSTOCK_FINANCIALS_PROBE_TICKERS,
} from "../src/lib/data-sources/vnstock-financials-probe";

const valueAfter = (argv: string[], key: string): string | undefined => {
  const index = argv.indexOf(key);
  return index >= 0 ? argv[index + 1] : undefined;
};

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  const tickerArg = valueAfter(argv, "--tickers");
  const fiscalYearArg = valueAfter(argv, "--fiscal-year") ?? "2025";
  const tickers = tickerArg
    ? tickerArg.split(",")
    : [...VNSTOCK_FINANCIALS_PROBE_TICKERS];

  const report = await runVnstockFinancialsPreview({
    tickers,
    fiscalYear: Number(fiscalYearArg),
    allowNetwork: argv.includes("--allow-network"),
  });

  console.log(JSON.stringify(report, null, 2));
};

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
