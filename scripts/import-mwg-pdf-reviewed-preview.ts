import fs from "fs";
import path from "path";
import { requirePostgresDatabaseUrl } from "./lib/supabase-env";

import {
  buildMwgPdfReviewedImportDryRun,
  MWG_PDF_REVIEWED_DATA_MODE,
  MWG_PDF_REVIEWED_SOURCE_LABEL,
  type Phase140FImportArtifact,
} from "../src/lib/data-sources/mwg-pdf-reviewed-preview-import";
import { runFinancialStatementLocalWriteTrial } from "../src/lib/data-sources/financial-statement-local-write-service";

export const MWG_IMPORT_ARTIFACT_PATH =
  "docs/product/evidence/PHASE140F_MWG_REFRESHED_ANNUAL_REPORT_MANUAL_PREVIEW_RESULT.json";

export type MwgImportExecutionSummary = {
  mode: "dry_run" | "confirm_write";
  writtenRows: number;
  skippedRows: number;
  invalidRows: number;
  productionApproved: false;
};

export async function runMwgPdfReviewedImport(
  argv = process.argv.slice(2),
): Promise<MwgImportExecutionSummary> {
  const databaseUrl = requirePostgresDatabaseUrl("import-mwg-pdf-reviewed-preview.ts");
  const isConfirmWrite = argv.includes("--confirm-write");
  const mode = isConfirmWrite ? "confirm_write" : "dry_run";
  const jsonPath = path.join(process.cwd(), MWG_IMPORT_ARTIFACT_PATH);

  console.log(
    `[MWG PDF Preview] Starting controlled import. Mode: ${
      isConfirmWrite ? "CONFIRM-WRITE" : "DRY-RUN"
    }`,
  );

  if (!fs.existsSync(jsonPath)) {
    throw new Error("Phase 140F MWG dry-run artifact was not found.");
  }

  const artifact = JSON.parse(
    fs.readFileSync(jsonPath, "utf8"),
  ) as Phase140FImportArtifact;
  const { validation, report } =
    buildMwgPdfReviewedImportDryRun(artifact);

  if (!validation.ok || !report || report.status === "failed") {
    const errors = validation.ok ? report?.errors ?? [] : validation.errors;
    throw new Error(`MWG import validation failed: ${errors.join(" ")}`);
  }
  if (report.acceptedRows.length !== 1) {
    throw new Error("Exactly one MWG row must pass the dry run.");
  }

  const acceptedRow = report.acceptedRows[0];
  if (
    acceptedRow.ticker !== "MWG" ||
    acceptedRow.eps !== 4774 ||
    acceptedRow.sharesOutstanding !== 1468456763 ||
    acceptedRow.totalDebt !== 29930.943 ||
    acceptedRow.totalLiabilities !== null
  ) {
    throw new Error("Accepted MWG row failed the final write boundary.");
  }

  console.log("\n=== DRY RUN IMPORT CANDIDATE ===");
  console.log(
    JSON.stringify(
      {
        ticker: acceptedRow.ticker,
        fiscalYear: acceptedRow.fiscalYear,
        sourceLabel: MWG_PDF_REVIEWED_SOURCE_LABEL,
        dataMode: MWG_PDF_REVIEWED_DATA_MODE,
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
      "\n[INFO] Dry-run complete. Pass --confirm-write to write MWG only.",
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
    sourceLabel: MWG_PDF_REVIEWED_SOURCE_LABEL,
    dataMode: MWG_PDF_REVIEWED_DATA_MODE,
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
  void runMwgPdfReviewedImport().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
