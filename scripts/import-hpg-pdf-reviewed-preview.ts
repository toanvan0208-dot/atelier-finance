import fs from "fs";
import path from "path";
import { buildFinancialStatementImportDryRun } from "../src/lib/data-sources/financial-statement-import-contract";
import { buildDryRunImport } from "./dry-run-hpg-pdf-reviewed-import";
import { runFinancialStatementLocalWriteTrial } from "../src/lib/data-sources/financial-statement-local-write-service";

const main = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
  }
  const argv = process.argv.slice(2);
  const isConfirmWrite = argv.includes("--confirm-write");
  const isDryRun = !isConfirmWrite;

  console.log(`[HPG PDF Preview] Starting controlled import. Mode: ${isDryRun ? "DRY-RUN" : "CONFIRM-WRITE"}`);

  const jsonPath = path.join(process.cwd(), "docs/product/evidence/PHASE139B_HPG_PDF_2025_PREVIEW.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("Phase 139B preview JSON not found!");
    process.exitCode = 1;
    return;
  }

  const rawPreviews = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const importRows = buildDryRunImport(rawPreviews);

  // Validation
  if (importRows.length !== 1 || importRows[0].ticker !== "HPG") {
    console.error("[FATAL] Only HPG is allowed.");
    process.exitCode = 1;
    return;
  }

  const hpg = importRows[0];
  if (hpg.sourceLabel !== "annual_report_2025_pdf_reviewed_preview") {
    console.error("[FATAL] Invalid sourceLabel");
    process.exitCode = 1;
    return;
  }
  if (hpg.productionApproved) {
    console.error("[FATAL] productionApproved must be false");
    process.exitCode = 1;
    return;
  }
  if (hpg.totalDebt === 0 || hpg.eps === 0 || hpg.sharesOutstanding === 0) {
    console.error("[FATAL] Missing value converted to 0");
    process.exitCode = 1;
    return;
  }
  if (hpg.totalDebt && hpg.totalDebt > 1000000000) {
    console.error("[FATAL] raw VND magnitude detected for totalDebt");
    process.exitCode = 1;
    return;
  }
  if (hpg.totalDebt !== 92174.151302217 || hpg.totalDebtUnit !== "billion_vnd") {
    console.error("[FATAL] Incorrect normalized totalDebt");
    process.exitCode = 1;
    return;
  }

  const dryRunReport = buildFinancialStatementImportDryRun([{
    ticker: "HPG",
    fiscalYear: 2025,
    periodType: "annual",
    eps: hpg.eps ?? undefined,
    sharesOutstanding: hpg.sharesOutstanding ?? undefined,
    totalDebt: hpg.totalDebt ?? undefined,
    epsUnit: hpg.epsUnit ?? undefined,
    sharesOutstandingUnit: hpg.sharesOutstandingUnit ?? undefined,
    totalDebtUnit: hpg.totalDebtUnit ?? undefined,
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
  console.log(JSON.stringify(hpg, null, 2));

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
    databaseUrl: process.env.DATABASE_URL
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
