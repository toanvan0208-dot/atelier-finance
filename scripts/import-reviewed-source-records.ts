import { readFile } from "node:fs/promises";
import { loadPortfolioReadiness } from "../src/features/watchlist/lib/load-portfolio-readiness";
import { runReviewedSourceRecordImport } from "../src/lib/data-sources/reviewed-source-records-import";

const hasFlag = (flag: string): boolean => process.argv.includes(flag);

const valueFor = (flag: string): string | null => {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
};

if (hasFlag("--help")) {
  process.stdout.write(
    [
      "Usage: npm run source-records:reviewed:import -- --file docs/product/data/phase114_reviewed_source_records_candidate.csv [--confirm-write] [--verify-runtime-read] [--json]",
      "",
      "Dry-run is the default. Confirmed writes require --confirm-write, ATELIER_LOCAL_IMPORTS_ENABLED=true, and DATABASE_URL=file:./dev.db.",
    ].join("\n"),
  );
  process.exit(0);
}

const file = valueFor("--file");

if (!file) {
  process.stderr.write("--file is required.\n");
  process.exit(1);
}

void readFile(file, "utf8")
  .then((csvText) =>
    runReviewedSourceRecordImport({
      confirmWrite: hasFlag("--confirm-write"),
      csvText,
      verifyRuntimeRead: hasFlag("--verify-runtime-read"),
    }),
  )
  .then(async (report) => {
    const portfolio = hasFlag("--verify-runtime-read") ? await loadPortfolioReadiness() : null;
    const payload = {
      ...report,
      portfolioProof: portfolio
        ? portfolio.tickers.map((item) => ({
            blockedMetrics: item.blockedMetrics,
            eps: item.sourceDecisions.eps.status,
            risk: item.risk,
            sharesOutstanding: item.sourceDecisions.sharesOutstanding.status,
            ticker: item.ticker,
            totalDebt: item.sourceDecisions.totalDebt.status,
            valuation: item.valuation,
          }))
        : null,
    };

    if (hasFlag("--json")) {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
      return;
    }

    process.stdout.write(
      [
        "Phase 114 reviewed source record import",
        `confirmWrite: ${report.confirmWrite}`,
        `dryRun: ${report.dryRun}`,
        `sourceLabel: ${report.sourceLabel ?? "none"}`,
        `dataMode: ${report.dataMode ?? "none"}`,
        `productionApproved: ${report.productionApproved}`,
        `inputRows: ${report.inputRows}`,
        `validRows: ${report.validRows}`,
        `invalidRows: ${report.invalidRows}`,
        `skippedRows: ${report.skippedRows}`,
        `writtenRows: ${report.writtenRows}`,
        `breakdownByTicker: ${JSON.stringify(report.breakdownByTicker)}`,
        `breakdownByField: ${JSON.stringify(report.breakdownByField)}`,
        ...(portfolio
          ? portfolio.tickers.flatMap((item) => [
              `ticker: ${item.ticker}`,
              `  totalDebt: ${item.sourceDecisions.totalDebt.status}`,
              `  eps: ${item.sourceDecisions.eps.status}`,
              `  sharesOutstanding: ${item.sourceDecisions.sharesOutstanding.status}`,
              `  riskLeverage: ${item.risk.leverageRisk}`,
              `  valuationPE: ${item.valuation.pe}`,
              `  valuationMarketCap: ${item.valuation.marketCap}`,
              `  canClaimValuationDbBacked: ${item.valuation.canClaimValuationDbBacked}`,
            ])
          : []),
        ...(report.errors.length ? [`errors: ${report.errors.join("; ")}`] : []),
      ].join("\n") + "\n",
    );
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Reviewed source record import failed."}\n`);
    process.exitCode = 1;
  });
