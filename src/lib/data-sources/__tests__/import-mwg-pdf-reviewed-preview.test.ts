import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import {
  buildMwgPdfReviewedImportDryRun,
  validateMwgPdfReviewedImportArtifact,
  type Phase140FImportArtifact,
} from "../mwg-pdf-reviewed-preview-import";

const artifact = (): Phase140FImportArtifact =>
  JSON.parse(
    fs.readFileSync(
      path.join(
        process.cwd(),
        "docs/product/evidence/PHASE140F_MWG_REFRESHED_ANNUAL_REPORT_MANUAL_PREVIEW_RESULT.json",
      ),
      "utf8",
    ),
  ) as Phase140FImportArtifact;

describe("Phase 140G MWG reviewed-preview controlled import", () => {
  it("uses dry-run by default and requires --confirm-write for mutation", () => {
    const script = fs.readFileSync(
      path.join(process.cwd(), "scripts/import-mwg-pdf-reviewed-preview.ts"),
      "utf8",
    );
    expect(script).toContain('argv.includes("--confirm-write")');
    expect(script).toContain(
      'const mode = isConfirmWrite ? "confirm_write" : "dry_run"',
    );
    expect(script.indexOf("DRY RUN IMPORT CANDIDATE")).toBeLessThan(
      script.indexOf(
        "const writeReport = await runFinancialStatementLocalWriteTrial",
      ),
    );
  });

  it("accepts exactly the validated MWG primary fields", () => {
    const result = validateMwgPdfReviewedImportArtifact(artifact());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row).toEqual({
      ticker: "MWG",
      fiscalYear: 2025,
      periodType: "annual",
      sourceLabel: "annual_report_2025_pdf_reviewed_preview",
      dataMode: "research_only",
      productionApproved: false,
      eps: 4774,
      epsUnit: "vnd_per_share",
      sharesOutstanding: 1468456763,
      sharesOutstandingUnit: "shares",
      totalDebt: 29930.943,
      totalDebtUnit: "billion_vnd",
    });
  });

  it("blocks any ticker other than MWG", () => {
    const input = artifact();
    input.ticker = "FPT";
    expect(validateMwgPdfReviewedImportArtifact(input)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining(["Only ticker MWG is allowed."]),
    });
  });

  it("blocks secondary fields from import", () => {
    const input = artifact();
    input.financials = {
      revenue: {
        value: 81621.329,
        unit: "billion_vnd",
      }
    };
    expect(validateMwgPdfReviewedImportArtifact(input)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "Only EPS, sharesOutstanding, and totalDebt may be imported.",
      ]),
    });
  });

  it("writes totalDebt as 29930.943 billion_vnd", () => {
    const result = buildMwgPdfReviewedImportDryRun(artifact());
    expect(result.validation.ok).toBe(true);
    expect(result.report?.acceptedRows).toHaveLength(1);
    expect(result.report?.acceptedRows[0].totalDebt).toBe(29930.943);
    expect(result.report?.acceptedRows[0].unitMetadata.totalDebt.unit).toBe(
      "billion_vnd",
    );
    expect(result.report?.acceptedRows[0].totalLiabilities).toBeNull();
  });

  it("fails closed on raw VND magnitude", () => {
    const input = artifact();
    input.totalDebtPreview!.value = 29930942961668;
    expect(validateMwgPdfReviewedImportArtifact(input)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "totalDebt must be 29930.943 billion_vnd.",
        "Raw VND magnitude must not be stored as billion_vnd.",
      ]),
    });
  });

  it("requires valid entity identity and import readiness", () => {
    const invalidEntity = artifact();
    invalidEntity.entityStatus = "invalid_for_mwg";
    expect(validateMwgPdfReviewedImportArtifact(invalidEntity)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "entityStatus must refer to Công ty Cổ phần Đầu tư Thế Giới Di Động.",
      ]),
    });

    const invalidReadiness = artifact();
    invalidReadiness.importReadiness =
      "partial_only_do_not_import_yet";
    expect(
      validateMwgPdfReviewedImportArtifact(invalidReadiness),
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "importReadiness must be ready_for_future_controlled_import.",
      ]),
    });
  });

  it("blocks missing-to-zero and production approval", () => {
    const zero = artifact();
    zero.epsPreview!.value = 0;
    expect(validateMwgPdfReviewedImportArtifact(zero)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "Missing values must not be converted to 0.",
      ]),
    });

    const approved = artifact();
    approved.productionApproved = true;
    expect(validateMwgPdfReviewedImportArtifact(approved)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "productionApproved must remain false.",
      ]),
    });
  });

  it("uses idempotent insert-or-skip service without delete or update", () => {
    const service = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/lib/data-sources/financial-statement-local-write-service.ts",
      ),
      "utf8",
    );
    expect(service).toContain("skippedExistingCount");
    expect(service).toContain("if (existing)");
    expect(service).not.toContain("financialStatement.delete");
    expect(service).not.toContain("financialStatement.update");
  });
});
