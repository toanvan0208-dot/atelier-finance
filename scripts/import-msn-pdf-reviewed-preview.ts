import fs from "fs";
import path from "path";
import { requirePostgresDatabaseUrl } from "./lib/supabase-env";

import {
  buildMsnPdfReviewedImportDryRun,
  MSN_PDF_REVIEWED_DATA_MODE,
  MSN_PDF_REVIEWED_SOURCE_LABEL,
  type Phase139KImportArtifact,
} from "../src/lib/data-sources/msn-pdf-reviewed-preview-import";
import { runFinancialStatementLocalWriteTrial } from "../src/lib/data-sources/financial-statement-local-write-service";

export const MSN_IMPORT_ARTIFACT_PATH =
  "docs/product/evidence/PHASE139K_MSN_PDF_2025_DRY_RUN.json";

export type MsnImportExecutionSummary = {
  mode: "dry_run" | "confirm_write";
  writtenRows: number;
  skippedRows: number;
  invalidRows: number;
  productionApproved: false;
};

export async function runMsnPdfReviewedImport(
  argv = process.argv.slice(2),
): Promise<MsnImportExecutionSummary> {
  const databaseUrl = requirePostgresDatabaseUrl("import-msn-pdf-reviewed-preview.ts");
  const isConfirmWrite = argv.includes("--confirm-write");
  const mode = isConfirmWrite ? "confirm_write" : "dry_run";
  const jsonPath = path.join(process.cwd(), MSN_IMPORT_ARTIFACT_PATH);

  console.log(
    `[MSN PDF Preview] Starting controlled import. Mode: ${
      isConfirmWrite ? "CONFIRM-WRITE" : "DRY-RUN"
    }`,
  );

  if (!fs.existsSync(jsonPath)) {
    throw new Error("Phase 139K MSN dry-run artifact was not found.");
  }

  const artifact = JSON.parse(
    fs.readFileSync(jsonPath, "utf8"),
  ) as Phase139KImportArtifact;
  const { validation, report } =
    buildMsnPdfReviewedImportDryRun(artifact);

  if (!validation.ok || !report || report.status === "failed") {
    const errors = validation.ok ? report?.errors ?? [] : validation.errors;
    throw new Error(`MSN import validation failed: ${errors.join(" ")}`);
  }
  if (report.acceptedRows.length !== 1) {
    throw new Error("Exactly one MSN row must pass the dry run.");
  }

  const acceptedRow = report.acceptedRows[0];
  if (
    acceptedRow.ticker !== "MSN" ||
    acceptedRow.eps !== 2710 ||
    acceptedRow.sharesOutstanding !== 1520491927 ||
    acceptedRow.totalDebt !== 64877.178 ||
    acceptedRow.totalLiabilities !== null
  ) {
    throw new Error("Accepted MSN row failed the final write boundary.");
  }

  console.log("\n=== DRY RUN IMPORT CANDIDATE ===");
  console.log(
    JSON.stringify(
      {
        ticker: acceptedRow.ticker,
        fiscalYear: acceptedRow.fiscalYear,
        sourceLabel: MSN_PDF_REVIEWED_SOURCE_LABEL,
        dataMode: MSN_PDF_REVIEWED_DATA_MODE,
        productionApproved: false,
        eps: acceptedRow.eps,
        epsUnit: acceptedRow.unitMetadata.eps.unit,
        sharesOutstanding: acceptedRow.sharesOutstanding,
        sharesOutstandingUnit:
          acceptedRow.unitMetadata.sharesOutstanding.unit,
        totalDebt: acceptedRow.totalDebt,
        totalDebtUnit: acceptedRow.unitMetadata.totalDebt.unit,
        secondaryFieldsImported: false,
      },
      null,
      2,
    ),
  );

  if (!isConfirmWrite) {
    console.log(
      "\n[INFO] Dry-run complete. Pass --confirm-write to write MSN only.",
    );
    return {
      mode,
      writtenRows: 0,
      skippedRows: 0,
      invalidRows: 0,
      productionApproved: false,
    };
  }

  const writeReport = await runFinancialStatementLocalWriteTrial({
    acceptedRows: report.acceptedRows,
    sourceLabel: MSN_PDF_REVIEWED_SOURCE_LABEL,
    dataMode: MSN_PDF_REVIEWED_DATA_MODE,
    confirmations: {
      confirmLocalResearchOnly: true,
      confirmNoProductionSource: true,
      confirmReviewedDryRun: true,
      confirmNoProductionDatabase: true,
    },
    databaseUrl,
  });

  console.log("\n=== CONFIRM WRITE RESULT ===");
  console.log(
    JSON.stringify(
      {
        status: writeReport.status,
        writeExecuted: writeReport.writeExecuted,
        insertedCount: writeReport.insertedCount,
        skippedExistingCount: writeReport.skippedExistingCount,
        rejectedCount: writeReport.rejectedCount,
        productionApproved: writeReport.productionApproved,
        warnings: writeReport.warnings,
        errors: writeReport.errors,
      },
      null,
      2,
    ),
  );

  if (
    writeReport.status === "write_failed" ||
    writeReport.status === "write_rejected"
  ) {
    throw new Error(writeReport.errors.join(" "));
  }

  return {
    mode,
    writtenRows: writeReport.insertedCount,
    skippedRows: writeReport.skippedExistingCount,
    invalidRows: writeReport.rejectedCount,
    productionApproved: false,
  };
}

if (
  import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` ||
  require.main === module
) {
  void runMsnPdfReviewedImport().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
