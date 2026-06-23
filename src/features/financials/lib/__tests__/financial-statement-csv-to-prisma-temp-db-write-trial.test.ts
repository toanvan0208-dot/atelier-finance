/* eslint-disable @typescript-eslint/no-explicit-any */
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { parseFinancialStatementCsvParserBoundary } from "../financial-statement-csv-parser-boundary";
import {
  buildFinancialStatementCsvToPrismaTempDbInlineFixture,
  cleanupFinancialStatementCsvToPrismaTempDbEnvironment,
  createFinancialStatementCsvToPrismaTempDbEnvironment,
  mapCsvParserResultToPrismaTempDbWritePayload,
  phase82CsvToPrismaTempDbExposedFunctionNames,
  phase82CsvToPrismaTempDbForbiddenExposureTerms,
  runFinancialStatementCsvToPrismaTempDbWriteTrial,
  validateCsvParserToPrismaTempDbWritePayload,
  type FinancialStatementCsvToPrismaTempDbWritePayload,
} from "../financial-statement-csv-to-prisma-temp-db-write-trial";
import type { FptPrismaTempDbEnvironment } from "../fpt-financial-statement-prisma-temp-db-write-verification";

const removeColumn = (csvText: string, column: string): string => {
  const [header, ...rows] = csvText.split("\n");
  const headers = header.split(",");
  const index = headers.indexOf(column);
  return [
    headers.filter((_, itemIndex) => itemIndex !== index).join(","),
    ...rows.map((row) => row.split(",").filter((_, itemIndex) => itemIndex !== index).join(",")),
  ].join("\n");
};

const patchFirstDataRow = (csvText: string, column: string, value: string): string => {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",");
  const index = headers.indexOf(column);
  const cells = lines[1].split(",");
  cells[index] = value;
  lines[1] = cells.join(",");
  return lines.join("\n");
};

const duplicateFirstDataRow = (csvText: string): string => {
  const lines = csvText.split("\n");
  return [...lines, lines[1]].join("\n");
};

const expectBlockedNoPayload = (csvText: string, reason: string) => {
  const parserResult = parseFinancialStatementCsvParserBoundary(csvText);
  const payload = mapCsvParserResultToPrismaTempDbWritePayload(parserResult);
  const validation = validateCsvParserToPrismaTempDbWritePayload(parserResult, payload);

  expect(parserResult.blockedRows.some((row) => row.blockedReasons.includes(reason))).toBe(true);
  expect(payload).toBeNull();
  expect(validation.blockedReasons).toContain("parser_blocked_rows_prevent_write");
};

describe("financial statement CSV parser to Prisma temp DB write trial", () => {
  it("parses a valid inline CSV string and maps to Prisma temp DB write payload", () => {
    const parserResult = parseFinancialStatementCsvParserBoundary(buildFinancialStatementCsvToPrismaTempDbInlineFixture());
    const payload = mapCsvParserResultToPrismaTempDbWritePayload(parserResult);

    expect(parserResult.ok).toBe(true);
    expect(parserResult.writeIntent).toBe("draft_only_no_db_write");
    expect(parserResult.blockedRows).toEqual([]);
    expect(payload).not.toBeNull();
    expect(payload?.acceptedRows).toHaveLength(1);
    expect(payload?.acceptedRows[0]).toMatchObject({
      fiscalYear: 2024,
      productionApproved: false,
      revenue: 60_000,
      ticker: "FPT",
      totalEquity: 35_000,
    });
    expect(payload?.acceptedRows[0].unitMetadata.revenue.unit).toBe("billion_vnd");
    expect(payload?.acceptedRows[0].unitMetadata.equity.unit).toBe("billion_vnd");
    expect(payload?.acceptedRows[0].unitMetadata.sharesOutstanding.unit).toBe("million_shares");
    expect(payload?.acceptedRows[0].unitMetadata.eps.unit).toBe("vnd_per_share");
  });

  it("persists parsed output through actual Prisma temp DB and reads back metadata", async () => {
    let environment: FptPrismaTempDbEnvironment | null = null;
    let tempDir = "";

    try {
      environment = await createFinancialStatementCsvToPrismaTempDbEnvironment();
      tempDir = environment.tempDir;
      const result = await runFinancialStatementCsvToPrismaTempDbWriteTrial({ environment });
      const record = result.readBack.records[0];
      const metadataRows = await environment.client.financialStatementUnitMetadata.findMany({
        where: { financialStatementId: record.id },
      });

      expect(result.scenario).toBe("phase82_csv_parser_to_prisma_temp_db_write_trial");
      expect(result.tempDirOutsideRepo).toBe(true);
      expect(result.writeReport.status).toBe("write_completed");
      expect(result.writeReport.productionApproved).toBe(false);
      expect(result.readBack.status).toBe("available");
      expect(record.ticker).toBe("FPT");
      expect(record.fiscalYear).toBe(2024);
      expect(record.values.revenue).toBe(60_000);
      expect(record.values.totalEquity).toBe(35_000);
      expect(record.values.sharesOutstanding).toBe(1_500);
      expect(record.values.eps).toBe(5_000);
      expect(record.source.sourceLabel).toBe("phase82_csv_parser_to_prisma_temp_db_write_trial");
      expect(record.source.dataMode).toBe("research_only");
      expect(record.source.productionApproved).toBe(false);
      expect(metadataRows.length).toBeGreaterThanOrEqual(8);
      expect(metadataRows.every((row) => row.financialStatementId === record.id)).toBe(true);
      expect(record.unitMetadata?.revenue).toMatchObject({ status: "explicit", unit: "billion_vnd" });
      expect(record.unitMetadata?.equity).toMatchObject({ status: "explicit", unit: "billion_vnd" });
      expect(record.unitMetadata?.sharesOutstanding).toMatchObject({ status: "explicit", unit: "million_shares" });
      expect(record.unitMetadata?.eps).toMatchObject({ status: "explicit", unit: "vnd_per_share" });
      expect(result.valuationBoundary.sourceBoundary.canClaimValuationDbBacked).toBe(false);
      expect(result.valuationBoundary.sourceBoundary.productionApproved).toBe(false);
      expect(result.valuationBoundary.selectedInputs.revenue.normalizationStatus).toBe("ready");
      expect(result.valuationBoundary.selectedInputs.eps.normalizationStatus).toBe("ready");
    } finally {
      await cleanupFinancialStatementCsvToPrismaTempDbEnvironment(environment);
      if (tempDir) expect(existsSync(tempDir)).toBe(false);
    }
  }, 60_000);

  it("blocks missing required column before Prisma write", () => {
    expectBlockedNoPayload(removeColumn(buildFinancialStatementCsvToPrismaTempDbInlineFixture(), "unit"), "required_columns_missing");
  });

  it("blocks missing unit before Prisma write", () => {
    expectBlockedNoPayload(patchFirstDataRow(buildFinancialStatementCsvToPrismaTempDbInlineFixture(), "unit", ""), "missing_unit");
  });

  it("blocks invalid unit before Prisma write", () => {
    expectBlockedNoPayload(patchFirstDataRow(buildFinancialStatementCsvToPrismaTempDbInlineFixture(), "unit", "usd"), "invalid_unit");
  });

  it("blocks missing value without zero-fill before Prisma write", () => {
    const csvText = patchFirstDataRow(buildFinancialStatementCsvToPrismaTempDbInlineFixture(), "value", "");
    expectBlockedNoPayload(csvText, "missing_value");
    expect(JSON.stringify(parseFinancialStatementCsvParserBoundary(csvText))).not.toContain('"value":0');
  });

  it("blocks invalid numeric value before Prisma write", () => {
    expectBlockedNoPayload(patchFirstDataRow(buildFinancialStatementCsvToPrismaTempDbInlineFixture(), "value", "Infinity"), "invalid_numeric_value");
  });

  it("blocks unsupported fields before Prisma write", () => {
    expectBlockedNoPayload(patchFirstDataRow(buildFinancialStatementCsvToPrismaTempDbInlineFixture(), "field", "ebitda"), "unsupported_field");
  });

  it("blocks duplicate row keys before Prisma write", () => {
    expectBlockedNoPayload(duplicateFirstDataRow(buildFinancialStatementCsvToPrismaTempDbInlineFixture()), "duplicate_row_key");
  });

  it("blocks productionApproved true before Prisma write", () => {
    expectBlockedNoPayload(
      patchFirstDataRow(buildFinancialStatementCsvToPrismaTempDbInlineFixture(), "productionApproved", "true"),
      "production_approval_not_allowed",
    );
  });

  it("does not expose filesystem CSV read, parser/import/upload API, or investment output surface", async () => {
    const moduleExports = await import("../financial-statement-csv-to-prisma-temp-db-write-trial");
    const exportNames = Object.keys(moduleExports);
    const output = JSON.stringify({
      exportNames,
      result: parseFinancialStatementCsvParserBoundary(buildFinancialStatementCsvToPrismaTempDbInlineFixture()),
    }).toLowerCase();

    expect(exportNames).toEqual(expect.arrayContaining([...phase82CsvToPrismaTempDbExposedFunctionNames]));
    for (const term of phase82CsvToPrismaTempDbForbiddenExposureTerms) {
      expect(exportNames.some((name) => name.toLowerCase().includes(term.toLowerCase()))).toBe(false);
    }
    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("fairvalue");
    expect(output).not.toContain("riskscore");
  });

  it("requires no CSV fixture file and leaves no DB or CSV file in git status", async () => {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const { stdout } = await promisify(execFile)(process.platform === "win32" ? "git.exe" : "git", ["status", "--short"], {
      cwd: process.cwd(),
    });
    const unexpectedArtifacts = stdout.replace(
      /^.. docs\/product\/data\/phase116_reviewed_financial_missing_fields\.csv\r?\n?/gim,
      "",
    );

    expect(buildFinancialStatementCsvToPrismaTempDbInlineFixture()).toContain("phase82-inline-csv-string-no-file");
    expect(unexpectedArtifacts).not.toMatch(/\.db\b/i);
    expect(unexpectedArtifacts).not.toMatch(/dev\.db/i);
    expect(unexpectedArtifacts).not.toMatch(/\.csv\b/i);
  });

  it("validation blocks null payloads when parser output is not fully valid", () => {
    const parserResult = parseFinancialStatementCsvParserBoundary(
      patchFirstDataRow(buildFinancialStatementCsvToPrismaTempDbInlineFixture(), "unit", ""),
    );
    const validation = validateCsvParserToPrismaTempDbWritePayload(parserResult, null as FinancialStatementCsvToPrismaTempDbWritePayload | null);

    expect(validation.readyForPrismaTempDbWrite).toBe(false);
    expect(validation.productionApproved).toBe(false);
    expect(validation.blockedReasons).toEqual(
      expect.arrayContaining(["parser_result_not_ok", "parser_blocked_rows_prevent_write", "payload_not_mappable"]),
    );
  });
});
