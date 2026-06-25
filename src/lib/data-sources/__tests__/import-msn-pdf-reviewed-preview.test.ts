import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import {
  buildMsnPdfReviewedImportDryRun,
  validateMsnPdfReviewedImportArtifact,
  type Phase139KImportArtifact,
} from "../msn-pdf-reviewed-preview-import";

const artifact = (): Phase139KImportArtifact =>
  JSON.parse(
    fs.readFileSync(
      path.join(
        process.cwd(),
        "docs/product/evidence/PHASE139K_MSN_PDF_2025_DRY_RUN.json",
      ),
      "utf8",
    ),
  ) as Phase139KImportArtifact;

describe("Phase 139L MSN reviewed-preview controlled import", () => {
  it("uses dry-run by default and requires --confirm-write for mutation", () => {
    const script = fs.readFileSync(
      path.join(process.cwd(), "scripts/import-msn-pdf-reviewed-preview.ts"),
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

  it("accepts exactly the validated MSN primary fields", () => {
    const result = validateMsnPdfReviewedImportArtifact(artifact());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row).toEqual({
      ticker: "MSN",
      fiscalYear: 2025,
      periodType: "annual",
      sourceLabel: "annual_report_2025_pdf_reviewed_preview",
      dataMode: "research_only",
      productionApproved: false,
      eps: 2710,
      epsUnit: "vnd_per_share",
      sharesOutstanding: 1520491927,
      sharesOutstandingUnit: "shares",
      totalDebt: 64877.178,
      totalDebtUnit: "billion_vnd",
    });
  });

  it("blocks any ticker other than MSN", () => {
    const input = artifact();
    input.dryRunImportCandidate!.ticker = "FPT";
    expect(validateMsnPdfReviewedImportArtifact(input)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining(["Only ticker MSN is allowed."]),
    });
  });

  it("blocks secondary fields from import", () => {
    const input = artifact();
    input.dryRunImportCandidate!.values!.revenue = {
      normalizedValue: 81621.329,
      normalizedUnit: "billion_vnd",
    };
    expect(validateMsnPdfReviewedImportArtifact(input)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "Only eps, sharesOutstanding, and totalDebt may be imported.",
      ]),
    });
  });

  it("writes totalDebt as 64877.178 billion_vnd", () => {
    const result = buildMsnPdfReviewedImportDryRun(artifact());
    expect(result.validation.ok).toBe(true);
    expect(result.report?.acceptedRows).toHaveLength(1);
    expect(result.report?.acceptedRows[0].totalDebt).toBe(64877.178);
    expect(result.report?.acceptedRows[0].unitMetadata.totalDebt.unit).toBe(
      "billion_vnd",
    );
    expect(result.report?.acceptedRows[0].totalLiabilities).toBeNull();
  });

  it("fails closed on raw million VND magnitude", () => {
    const input = artifact();
    input.dryRunImportCandidate!.values!.totalDebt.normalizedValue = 64877178;
    expect(validateMsnPdfReviewedImportArtifact(input)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "totalDebt must be 64877.178 billion_vnd.",
        "Raw million VND magnitude must not be stored as billion_vnd.",
      ]),
    });
  });

  it("requires valid entity identity and import readiness", () => {
    const invalidEntity = artifact();
    invalidEntity.entityIdentity!.status = "invalid_for_msn";
    expect(validateMsnPdfReviewedImportArtifact(invalidEntity)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "entityStatus must be valid_msn_consolidated.",
      ]),
    });

    const invalidReadiness = artifact();
    invalidReadiness.dryRunImportCandidate!.importReadiness =
      "partial_only_do_not_import_yet";
    expect(
      validateMsnPdfReviewedImportArtifact(invalidReadiness),
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "importReadiness must be ready_for_future_controlled_import.",
      ]),
    });
  });

  it("blocks total liabilities and double-counted debt components", () => {
    const liabilities = artifact();
    liabilities.dryRunImportCandidate!.values!.totalDebt.components![0].label =
      "Tổng nợ phải trả";
    expect(validateMsnPdfReviewedImportArtifact(liabilities)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "totalLiabilities must never map to totalDebt.",
      ]),
    });

    const duplicated = artifact();
    duplicated.dryRunImportCandidate!.values!.totalDebt.components!.push({
      label: "Trái phiếu đã nằm trong nợ dài hạn",
      value: 11164668,
      unit: "million_vnd",
    });
    expect(validateMsnPdfReviewedImportArtifact(duplicated)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "Exactly two explicit million-VND debt components are required.",
      ]),
    });
  });

  it("blocks missing-to-zero and production approval", () => {
    const zero = artifact();
    zero.dryRunImportCandidate!.values!.eps.normalizedValue = 0;
    expect(validateMsnPdfReviewedImportArtifact(zero)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        "Missing values must not be converted to 0.",
      ]),
    });

    const approved = artifact();
    approved.dryRunImportCandidate!.productionApproved = true;
    expect(validateMsnPdfReviewedImportArtifact(approved)).toMatchObject({
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
