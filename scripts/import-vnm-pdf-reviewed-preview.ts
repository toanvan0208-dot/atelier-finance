import fs from "fs";
import path from "path";
import { buildFinancialStatementImportDryRun } from "../src/lib/data-sources/financial-statement-import-contract";
import { buildDryRunImport } from "./dry-run-vnm-pdf-reviewed-import";
import { runFinancialStatementLocalWriteTrial } from "../src/lib/data-sources/financial-statement-local-write-service";

import { requirePostgresDatabaseUrl } from "./lib/supabase-env";
const main = async (): Promise<void> => {
  const databaseUrl = requirePostgresDatabaseUrl("import-vnm-pdf-reviewed-preview.ts");
  const argv = process.argv.slice(2);
  const isConfirmWrite = argv.includes("--confirm-write");
  const isDryRun = !isConfirmWrite;

  console.log(`[VNM PDF Preview] Starting controlled import. Mode: ${isDryRun ? "DRY-RUN" : "CONFIRM-WRITE"}`);

  const jsonPath = path.join(process.cwd(), "docs/product/evidence/PHASE139F_VNM_PDF_2025_PREVIEW.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("Phase 139F preview JSON not found!");
    process.exitCode = 1;
    return;
  }

  const rawPreviews = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const importRows = buildDryRunImport(rawPreviews);

  // Validation
  if (importRows.length !== 1 || importRows[0].ticker !== "VNM") {
    console.error("[FATAL] Only VNM is allowed.");
    process.exitCode = 1;
    return;
  }

  const vnm = importRows[0];
  if (vnm.sourceLabel !== "annual_report_2025_pdf_reviewed_preview") {
    console.error("[FATAL] Invalid sourceLabel");
    process.exitCode = 1;
    return;
  }
  if (vnm.productionApproved) {
    console.error("[FATAL] productionApproved must be false");
    process.exitCode = 1;
    return;
  }
  if (vnm.totalDebt === 0 || vnm.eps === 0 || vnm.sharesOutstanding === 0) {
    console.error("[FATAL] Missing value converted to 0");
    process.exitCode = 1;
    return;
  }
  if (vnm.totalDebt && vnm.totalDebt > 10000000) {
    console.error("[FATAL] raw million VND magnitude detected for totalDebt");
    process.exitCode = 1;
    return;
  }
  if (vnm.totalDebt !== 9456.645 || vnm.totalDebtUnit !== "billion_vnd") {
    console.error("[FATAL] Incorrect normalized totalDebt");
    process.exitCode = 1;
    return;
  }

  const dryRunReport = buildFinancialStatementImportDryRun([{
    ticker: "VNM",
    fiscalYear: 2025,
    periodType: "annual",
    eps: vnm.eps ?? undefined,
    sharesOutstanding: vnm.sharesOutstanding ?? undefined,
    totalDebt: vnm.totalDebt ?? undefined,
    epsUnit: vnm.epsUnit ?? undefined,
    sharesOutstandingUnit: vnm.sharesOutstandingUnit ?? undefined,
    totalDebtUnit: vnm.totalDebtUnit ?? undefined,
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
  console.log(JSON.stringify(vnm, null, 2));

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
