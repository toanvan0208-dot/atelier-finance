import fs from "fs";
import path from "path";
import { buildFinancialStatementImportDryRun } from "../src/lib/data-sources/financial-statement-import-contract";
import { buildDryRunImport } from "./dry-run-fpt-pdf-reviewed-import";
import { runFinancialStatementLocalWriteTrial } from "../src/lib/data-sources/financial-statement-local-write-service";

import { requirePostgresDatabaseUrl } from "./lib/supabase-env";
const main = async (): Promise<void> => {
  const databaseUrl = requirePostgresDatabaseUrl("import-fpt-pdf-reviewed-preview.ts");
  const argv = process.argv.slice(2);
  const isConfirmWrite = argv.includes("--confirm-write");
  const isDryRun = !isConfirmWrite;

  console.log(`[FPT PDF Preview] Starting controlled import. Mode: ${isDryRun ? "DRY-RUN" : "CONFIRM-WRITE"}`);

  const jsonPath = path.join(process.cwd(), "docs/product/evidence/PHASE139I_FPT_PDF_2025_PREVIEW.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("Phase 139I preview JSON not found!");
    process.exitCode = 1;
    return;
  }

  const rawPreviews = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const importRows = buildDryRunImport(rawPreviews);

  // Validation
  if (importRows.length !== 1 || importRows[0].ticker !== "FPT") {
    console.error("[FATAL] Only FPT is allowed.");
    process.exitCode = 1;
    return;
  }

  const fpt = importRows[0];
  if (fpt.sourceLabel !== "annual_report_2025_pdf_reviewed_preview") {
    console.error("[FATAL] Invalid sourceLabel");
    process.exitCode = 1;
    return;
  }
  if (fpt.productionApproved) {
    console.error("[FATAL] productionApproved must be false");
    process.exitCode = 1;
    return;
  }
  if (fpt.eps === 0 || fpt.sharesOutstanding === 0) {
    console.error("[FATAL] Missing value converted to 0");
    process.exitCode = 1;
    return;
  }
  if (fpt.totalDebt && fpt.totalDebt > 100000) {
    console.error("[FATAL] raw VND magnitude detected for totalDebt");
    process.exitCode = 1;
    return;
  }
  if (fpt.totalDebtUnit !== "billion_vnd") {
    console.error("[FATAL] Incorrect normalized totalDebt unit");
    process.exitCode = 1;
    return;
  }

  const dryRunReport = buildFinancialStatementImportDryRun([{
    ticker: "FPT",
    fiscalYear: 2025,
    periodType: "annual",
    eps: fpt.eps ?? undefined,
    sharesOutstanding: fpt.sharesOutstanding ?? undefined,
    totalDebt: fpt.totalDebt ?? undefined,
    epsUnit: fpt.epsUnit ?? undefined,
    sharesOutstandingUnit: fpt.sharesOutstandingUnit ?? undefined,
    totalDebtUnit: fpt.totalDebtUnit ?? undefined,
    sourceLabel: "annual_report_2025_pdf_reviewed_preview",
    dataMode: "research_only"
  }], {
    sourceLabel: "annual_report_2025_pdf_reviewed_preview",
    dataMode: "research_only"
  });

  if (dryRunReport.status === "failed") {
    console.error("[FATAL] Dry run report failed to normalize row.");
    console.error(dryRunReport.errors);
    process.exitCode = 1;
    return;
  }

  const acceptedRows = dryRunReport.acceptedRows;

  console.log("\n=== DRY RUN IMPORT CANDIDATES ===");
  console.log(JSON.stringify(fpt, null, 2));

  if (isDryRun) {
    console.log("\n[INFO] Dry-run complete. Pass --confirm-write to write to database.");
    return;
  }

  console.log("\n=== EXECUTING CONFIRM WRITE ===");
  const writeReport = await runFinancialStatementLocalWriteTrial({
    acceptedRows,
    sourceLabel: "annual_report_2025_pdf_reviewed_preview",
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
