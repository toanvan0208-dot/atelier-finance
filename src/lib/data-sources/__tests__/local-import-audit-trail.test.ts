import { describe, expect, it } from "vitest";

import { buildLocalImportAuditResult } from "../local-import-audit-trail";

const baseSummary = {
  errors: [],
  invalidRows: 0,
  skippedRows: 0,
  totalRows: 1,
  validRows: 1,
  warnings: [],
  writtenRows: 1,
};

describe("local import audit trail", () => {
  it("builds deterministic audit metadata and safety flags", () => {
    const audit = buildLocalImportAuditResult({
      completedAt: "2026-06-21T01:05:00.000Z",
      confirmWrite: true,
      dryRun: false,
      importJobId: "audit-job-1",
      importType: "financial_statement",
      sourceKind: "user_input",
      sourceLabel: "local_csv",
      startedAt: "2026-06-21T01:00:00.000Z",
      summary: baseSummary,
      tickers: [" fpt ", "FPT", "vnm"],
    });

    expect(audit).toMatchObject({
      completedAt: "2026-06-21T01:05:00.000Z",
      confirmWrite: true,
      dryRun: false,
      importJobId: "audit-job-1",
      importType: "financial_statement",
      productionApproved: false,
      sourceLabel: "local_csv",
      startedAt: "2026-06-21T01:00:00.000Z",
      status: "completed",
      tickers: ["FPT", "VNM"],
    });
    expect(audit.safetyFlags).toEqual({
      invalidRowsNotWritten: true,
      localDataProductionApprovedFalse: true,
      missingUnitFailsClosed: true,
      noOverwrite: true,
      noZeroFillForMissing: true,
    });
  });

  it("maps dry-run, warning, validation, blocked, and write failure statuses", () => {
    expect(
      buildLocalImportAuditResult({
        confirmWrite: false,
        dryRun: true,
        importType: "market_pvt",
        now: () => new Date("2026-06-21T00:00:00.000Z"),
        sourceKind: "user_input",
        sourceLabel: "local_csv",
        summary: { ...baseSummary, writtenRows: 0 },
      }).status,
    ).toBe("dry_run_completed");

    expect(
      buildLocalImportAuditResult({
        confirmWrite: true,
        dryRun: false,
        importType: "market_pvt",
        sourceKind: "user_input",
        sourceLabel: "local_csv",
        summary: { ...baseSummary, skippedRows: 1, warnings: ["duplicate skipped"] },
      }).status,
    ).toBe("completed_with_warnings");

    expect(
      buildLocalImportAuditResult({
        confirmWrite: true,
        dryRun: false,
        importType: "market_pvt",
        sourceKind: "user_input",
        sourceLabel: "local_csv",
        summary: {
          ...baseSummary,
          errors: ["marketPrice_unit_missing"],
          invalidRows: 1,
          validRows: 0,
          writtenRows: 0,
        },
      }).status,
    ).toBe("failed_validation");

    expect(
      buildLocalImportAuditResult({
        blocked: true,
        confirmWrite: true,
        dryRun: false,
        importType: "financial_statement",
        sourceKind: "user_input",
        sourceLabel: "local_csv",
        summary: { ...baseSummary, skippedRows: 1, validRows: 0, writtenRows: 0 },
      }).status,
    ).toBe("blocked");

    expect(
      buildLocalImportAuditResult({
        confirmWrite: true,
        dryRun: false,
        importType: "financial_statement",
        sourceKind: "user_input",
        sourceLabel: "local_csv",
        summary: { ...baseSummary, errors: ["write failed"], writtenRows: 0 },
        writeFailed: true,
      }).status,
    ).toBe("failed_write");
  });
});
