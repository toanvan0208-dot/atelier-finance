import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { readFinancialsUnitMetadataFromPersistencePayload } from "../financials-unit-metadata-persistence-boundary";
import {
  buildFptPrismaTempDbWritePayload,
  cleanupFptPrismaTempDbEnvironment,
  createFptPrismaTempDbEnvironment,
  phase80ExposedFunctionNames,
  phase80ForbiddenExposureTerms,
  PHASE80_MIGRATION_FILES,
  runFptPrismaTempDbWriteVerification,
  validateFptPrismaTempDbVerificationPayload,
  verifyFptPrismaTempDbReadBack,
  type FptPrismaTempDbEnvironment,
} from "../fpt-financial-statement-prisma-temp-db-write-verification";

const gitStatus = async (): Promise<string> => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const { stdout } = await execFileAsync(process.platform === "win32" ? "git.exe" : "git", ["status", "--short"], {
    cwd: process.cwd(),
  });
  return stdout;
};

describe("Prisma-backed FPT financial statement temp DB write verification", () => {
  it("creates a temp SQLite DB outside tracked repo paths, applies existing migrations, writes, reads back, and cleans up", async () => {
    let environment: FptPrismaTempDbEnvironment | null = null;
    let tempDir = "";

    try {
      environment = await createFptPrismaTempDbEnvironment();
      tempDir = environment.tempDir;

      expect(environment.tempDirOutsideRepo).toBe(true);
      expect(resolve(environment.tempDir).toLowerCase()).toContain(resolve(tmpdir()).toLowerCase());
      expect(environment.appliedMigrationFiles).toEqual([...PHASE80_MIGRATION_FILES]);
      expect(existsSync(environment.dbPath)).toBe(true);

      const result = await runFptPrismaTempDbWriteVerification(environment);
      const verification = verifyFptPrismaTempDbReadBack(result);
      const record = result.readBack.records[0];
      const metadataRows = await environment.client.financialStatementUnitMetadata.findMany({
        where: { financialStatementId: record.id },
        orderBy: { field: "asc" },
      });

      expect(verification.readyForPrismaTempDbWrite).toBe(true);
      expect(result.writeReport.status).toBe("write_completed");
      expect(result.writeReport.insertedCount).toBe(1);
      expect(result.writeReport.productionApproved).toBe(false);
      expect(result.readBack.status).toBe("available");
      expect(record.ticker).toBe("FPT");
      expect(record.fiscalYear).toBe(2024);
      expect(record.values.revenue).toBe(60_000);
      expect(record.values.totalEquity).toBe(35_000);
      expect(record.values.sharesOutstanding).toBe(1_500);
      expect(record.values.eps).toBe(5_000);
      expect(record.source.sourceLabel).toBe("phase80_prisma_backed_fpt_financial_statement_temp_db_write_verification");
      expect(record.source.dataMode).toBe("research_only");
      expect(record.source.productionApproved).toBe(false);
      expect(metadataRows).toHaveLength(10);
      expect(metadataRows.every((row) => row.financialStatementId === record.id)).toBe(true);
      expect(record.unitMetadata?.revenue).toMatchObject({ status: "explicit", unit: "billion_vnd" });
      expect(record.unitMetadata?.equity).toMatchObject({ status: "explicit", unit: "billion_vnd" });
      expect(record.unitMetadata?.sharesOutstanding).toMatchObject({ status: "explicit", unit: "million_shares" });
      expect(record.unitMetadata?.eps).toMatchObject({ status: "explicit", unit: "vnd_per_share" });
      expect(result.valuationBoundary.selectedInputs.revenue.normalizationStatus).toBe("ready");
      expect(result.valuationBoundary.selectedInputs.equity.normalizationStatus).toBe("ready");
      expect(result.valuationBoundary.selectedInputs.sharesOutstanding.normalizationStatus).toBe("ready");
      expect(result.valuationBoundary.selectedInputs.eps.normalizationStatus).toBe("ready");
      expect(result.valuationBoundary.sourceBoundary.canClaimValuationDbBacked).toBe(false);
      expect(result.valuationBoundary.sourceBoundary.productionApproved).toBe(false);
    } finally {
      const cleaned = await cleanupFptPrismaTempDbEnvironment(environment);
      expect(cleaned).toBe(true);
      if (tempDir) expect(existsSync(tempDir)).toBe(false);
    }
  }, 60_000);

  it("accepts only the Phase 78/79 FPT payload for Prisma-backed verification", () => {
    const payload = buildFptPrismaTempDbWritePayload();
    const validation = validateFptPrismaTempDbVerificationPayload(payload);

    expect(payload.acceptedRows[0].ticker).toBe("FPT");
    expect(payload.acceptedRows[0].fiscalYear).toBe(2024);
    expect(payload.sourceLabel).toBe("phase80_prisma_backed_fpt_financial_statement_temp_db_write_verification");
    expect(validation.readyForPrismaTempDbWrite).toBe(true);
  });

  it("blocks non-FPT ticker for this Prisma-backed trial", () => {
    const payload = buildFptPrismaTempDbWritePayload();
    payload.acceptedRows[0].ticker = "MWG";

    expect(validateFptPrismaTempDbVerificationPayload(payload).blockedReasons).toContain("ticker_must_be_fpt");
  });

  it("does not convert missing values to zero and blocks required write", () => {
    const payload = buildFptPrismaTempDbWritePayload();
    payload.acceptedRows[0].revenue = null;

    const validation = validateFptPrismaTempDbVerificationPayload(payload);

    expect(validation.blockedReasons).toContain("revenue_missing_value_blocks_db_write");
    expect(payload.acceptedRows[0].revenue).toBeNull();
    expect(payload.acceptedRows[0].revenue).not.toBe(0);
  });

  it("blocks missing unit before Prisma write", () => {
    const payload = buildFptPrismaTempDbWritePayload();
    payload.acceptedRows[0].unitMetadata.revenue = {
      ...payload.acceptedRows[0].unitMetadata.revenue,
      status: "unknown_unit",
      unit: "unknown",
    };

    expect(validateFptPrismaTempDbVerificationPayload(payload).blockedReasons).toEqual(
      expect.arrayContaining(["revenue_missing_explicit_unit_metadata", "revenue_missing_unit_blocks_db_write"]),
    );
  });

  it("blocks invalid unit before Prisma write", () => {
    const payload = buildFptPrismaTempDbWritePayload();
    payload.acceptedRows[0].unitMetadata.eps = {
      ...payload.acceptedRows[0].unitMetadata.eps,
      status: "explicit",
      unit: "million_vnd",
    };

    expect(validateFptPrismaTempDbVerificationPayload(payload).blockedReasons).toContain(
      "eps_invalid_unit_blocks_db_write",
    );
  });

  it("does not guess magnitude from numeric values", () => {
    const payload = buildFptPrismaTempDbWritePayload();
    payload.acceptedRows[0].revenue = 60_000_000_000_000;
    payload.acceptedRows[0].unitMetadata.revenue = {
      ...payload.acceptedRows[0].unitMetadata.revenue,
      status: "unknown_unit",
      unit: "unknown",
    };

    expect(validateFptPrismaTempDbVerificationPayload(payload).blockedReasons).toContain(
      "revenue_missing_unit_blocks_db_write",
    );
    expect(payload.acceptedRows[0].unitMetadata.revenue.unit).not.toBe("billion_vnd");
  });

  it("keeps old rows without metadata unknown and not ready", () => {
    const read = readFinancialsUnitMetadataFromPersistencePayload({
      payload: null,
      snapshot: {
        eps: 5_000,
        revenue: 60_000,
        sharesOutstanding: 1_500,
        sourceName: "legacy_without_sidecar",
        totalEquity: 35_000,
      },
    });

    expect(read.status).toBe("missing_metadata");
    expect(read.unitMetadata.revenue.status).toBe("unknown_unit");
    expect(read.unitMetadata.revenue.unit).toBe("unknown");
  });

  it("does not let invalid persisted metadata be bypassed by numeric values", () => {
    const read = readFinancialsUnitMetadataFromPersistencePayload({
      payload: {
        productionApproved: false,
        schemaVersion: 1,
        unitMetadata: {
          eps: { status: "explicit", unit: "million_vnd" },
          revenue: { status: "explicit", unit: "usd" },
          sharesOutstanding: { status: "explicit", unit: "vnd" },
        },
      },
      snapshot: {
        eps: 5_000,
        revenue: 60_000,
        sharesOutstanding: 1_500,
        sourceName: "invalid_sidecar",
        totalEquity: 35_000,
      },
    });

    expect(read.status).toBe("invalid_metadata");
    expect(read.unitMetadata.revenue.status).toBe("unknown_unit");
    expect(read.unitMetadata.eps.status).toBe("unknown_unit");
    expect(read.unitMetadata.sharesOutstanding.status).toBe("unknown_unit");
  });

  it("does not expose parser, import, upload, recommendation, target, fair value, or risk scoring functions", async () => {
    const moduleExports = await import("../fpt-financial-statement-prisma-temp-db-write-verification");
    const exportNames = Object.keys(moduleExports);

    expect(exportNames).toEqual(expect.arrayContaining([...phase80ExposedFunctionNames]));
    for (const term of phase80ForbiddenExposureTerms) {
      expect(exportNames.some((name) => name.toLowerCase().includes(term.toLowerCase()))).toBe(false);
    }
  });

  it("does not leave DB files in git status", async () => {
    const status = await gitStatus();
    const unexpectedArtifacts = status.replace(
      /^.. docs\/product\/data\/phase116_reviewed_financial_missing_fields\.csv\r?\n?/gim,
      "",
    );

    expect(unexpectedArtifacts).not.toMatch(/\.db\b/i);
    expect(unexpectedArtifacts).not.toMatch(/dev\.db/i);
    expect(unexpectedArtifacts).not.toMatch(/\.csv\b/i);
  });
});
