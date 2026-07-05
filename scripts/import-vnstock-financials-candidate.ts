import { requirePostgresDatabaseUrl } from "./lib/supabase-env";
import {
  runVnstockFinancialsPreview,
  VNSTOCK_FINANCIALS_PROBE_TICKERS,
} from "../src/lib/data-sources/vnstock-financials-probe";
import { VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL } from "../src/lib/data-sources/vnstock-financials-candidate";
import { buildFinancialStatementImportDryRun } from "../src/lib/data-sources/financial-statement-import-contract";
import { runFinancialStatementLocalWriteTrial } from "../src/lib/data-sources/financial-statement-local-write-service";
import { buildCandidateImportRows } from "../src/lib/data-sources/vnstock-financials-candidate-import-flow";

const valueAfter = (argv: string[], key: string): string | undefined => {
  const index = argv.indexOf(key);
  return index >= 0 ? argv[index + 1] : undefined;
};

const main = async (): Promise<void> => {
  const databaseUrl = requirePostgresDatabaseUrl("import-vnstock-financials-candidate.ts");
  const argv = process.argv.slice(2);
  const isConfirmWrite = argv.includes("--confirm-write");
  const isDryRun = !isConfirmWrite;
  const tickerArg = valueAfter(argv, "--tickers");
  const fiscalYearArg = valueAfter(argv, "--fiscal-year") ?? "2025";
  const tickers = tickerArg
    ? tickerArg.split(",")
    : [...VNSTOCK_FINANCIALS_PROBE_TICKERS];

  console.log(`[VNStock] Starting candidate import. Mode: ${isDryRun ? "DRY-RUN" : "CONFIRM-WRITE"}`);
  
  const report = await runVnstockFinancialsPreview({
    tickers,
    fiscalYear: Number(fiscalYearArg),
    allowNetwork: argv.includes("--allow-network"),
  });

  const allCandidates = report.tickers.flatMap((g) => g.candidates);
  
  const { rows, errors } = buildCandidateImportRows(allCandidates);
  if (errors.length > 0) {
    console.error("[FATAL] Safety checks failed during candidate mapping:");
    errors.forEach(e => console.error(`  - ${e}`));
    process.exitCode = 1;
    return;
  }

  const dryRunReport = buildFinancialStatementImportDryRun(rows, {
    sourceLabel: VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL,
    dataMode: "research_only"
  });

  console.log("\n=== DRY RUN REPORT ===");
  console.log(JSON.stringify(
    {
      status: dryRunReport.status,
      normalizedCount: dryRunReport.normalizedCount,
      acceptedCount: dryRunReport.acceptedCount,
      rejectedCount: dryRunReport.rejectedCount,
      skippedCount: dryRunReport.skippedCount,
      warnings: dryRunReport.warnings,
      errors: dryRunReport.errors,
      acceptedRows: dryRunReport.acceptedRows.map(r => ({
        ticker: r.ticker,
        fiscalYear: r.fiscalYear,
        eps: r.eps,
        sharesOutstanding: r.sharesOutstanding,
        totalDebt: r.totalDebt,
      })),
      skippedRows: dryRunReport.skippedRows,
      rejectedRows: dryRunReport.rejectedRows,
    },
    null,
    2
  ));

  if (isDryRun) {
    console.log("\n[INFO] Dry-run complete. Pass --confirm-write to write to database.");
    return;
  }

  if (dryRunReport.status === "failed") {
    console.error("\n[ERROR] Dry-run failed. Aborting confirm-write.");
    process.exitCode = 1;
    return;
  }

  if (dryRunReport.acceptedRows.length === 0) {
    console.log("\n[INFO] No valid rows to write.");
    return;
  }

  console.log("\n=== EXECUTING CONFIRM WRITE ===");
  const writeReport = await runFinancialStatementLocalWriteTrial({
    acceptedRows: dryRunReport.acceptedRows,
    sourceLabel: VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL,
    dataMode: "research_only",
    confirmations: {
      confirmLocalResearchOnly: true,
      confirmNoProductionSource: true,
      confirmReviewedDryRun: true,
      confirmNoProductionDatabase: true,
    },
    databaseUrl
  });

  console.log(JSON.stringify({
    status: writeReport.status,
    writeExecuted: writeReport.writeExecuted,
    insertedCount: writeReport.insertedCount,
    skippedExistingCount: writeReport.skippedExistingCount,
    rejectedCount: writeReport.rejectedCount,
    warnings: writeReport.warnings,
    errors: writeReport.errors,
  }, null, 2));

  if (writeReport.status === "write_failed" || writeReport.status === "write_rejected") {
    process.exitCode = 1;
  }
};

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
