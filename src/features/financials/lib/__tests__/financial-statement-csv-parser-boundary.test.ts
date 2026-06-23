 
import { describe, expect, it } from "vitest";

import {
  parseFinancialStatementCsvParserBoundary,
  phase81CsvParserBoundaryExposedFunctionNames,
  phase81CsvParserBoundaryForbiddenExposureTerms,
} from "../financial-statement-csv-parser-boundary";

const header = [
  "ticker",
  "period",
  "periodType",
  "statementType",
  "field",
  "value",
  "unit",
  "currency",
  "sourceLabel",
  "sourceOwner",
  "sourceUrl",
  "sourceDocumentRef",
  "asOf",
  "dataMode",
  "productionApproved",
  "evidenceNote",
  "basis",
].join(",");

const row = (patch: Partial<Record<string, string>> = {}) =>
  [
    patch.ticker ?? "FPT",
    patch.period ?? "2024",
    patch.periodType ?? "annual",
    patch.statementType ?? "income_statement",
    patch.field ?? "revenue",
    patch.value ?? "60000",
    patch.unit ?? "billion_vnd",
    patch.currency ?? "VND",
    patch.sourceLabel ?? "phase81_inline_csv_parser_boundary",
    patch.sourceOwner ?? "user_provided_local_research",
    patch.sourceUrl ?? "",
    patch.sourceDocumentRef ?? "phase81-inline-csv-string-no-file",
    patch.asOf ?? "2026-06-21",
    patch.dataMode ?? "research_only",
    patch.productionApproved ?? "false",
    patch.evidenceNote ?? "Inline parser boundary fixture; not official and not production-approved.",
    patch.basis ?? "consolidated",
  ].join(",");

const csv = (...rows: string[]) => [header, ...rows].join("\n");

describe("financial statement CSV parser boundary", () => {
  it("parses valid inline CSV string into a draft_only_no_db_write result", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row()));

    expect(result.ok).toBe(true);
    expect(result.writeIntent).toBe("draft_only_no_db_write");
    expect(result.noDbWrite).toBe(true);
    expect(result.productionApproved).toBe(false);
    expect(result.parsedRows).toHaveLength(1);
    expect(result.parsedRows[0]).toMatchObject({
      field: "revenue",
      productionApproved: false,
      unit: "billion_vnd",
      value: 60_000,
      writeIntent: "draft_only_no_db_write",
    });
    expect(result.drafts[0]).toMatchObject({
      productionApproved: false,
      writeIntent: "draft_only_no_db_write",
    });
    expect(result.drafts[0].values.revenue).toBe(60_000);
    expect(result.drafts[0].unitMetadata.revenue?.unit).toBe("billion_vnd");
  });

  it("enforces required columns", () => {
    const result = parseFinancialStatementCsvParserBoundary(
      ["ticker,period,field,value,unit", "FPT,2024,revenue,1,billion_vnd"].join("\n"),
    );

    expect(result.ok).toBe(false);
    expect(result.blockedRows[0].blockedReasons).toEqual(
      expect.arrayContaining(["missing_required_column:periodType", "missing_required_column:statementType"]),
    );
  });

  it("enforces sourceUrl or sourceDocumentRef evidence", () => {
    const result = parseFinancialStatementCsvParserBoundary(
      csv(row({ sourceDocumentRef: "", sourceUrl: "" })),
    );

    expect(result.ok).toBe(false);
    expect(result.blockedRows[0].blockedReasons).toContain("missing_source_url_or_document_ref");
  });

  it("blocks missing unit", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row({ unit: "" })));

    expect(result.blockedRows[0].blockedReasons).toContain("missing_unit");
  });

  it("blocks invalid unit", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row({ unit: "usd" })));

    expect(result.blockedRows[0].blockedReasons).toContain("invalid_unit");
  });

  it("does not convert missing value to zero", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row({ value: "" })));

    expect(result.blockedRows[0].blockedReasons).toContain("missing_value");
    expect(result.parsedRows).toEqual([]);
    expect(JSON.stringify(result)).not.toContain('"value":0');
  });

  it("blocks invalid numeric value", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row({ value: "NaN" })));

    expect(result.blockedRows[0].blockedReasons).toContain("invalid_numeric_value");
  });

  it("does not silently accept comma-formatted numbers or guess magnitude", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row({ value: "1000000000000", unit: "" })));
    const comma = parseFinancialStatementCsvParserBoundary(csv(row({ value: "1,000" })));

    expect(result.blockedRows[0].blockedReasons).toContain("missing_unit");
    expect(JSON.stringify(result)).not.toContain("billion_vnd");
    expect(comma.blockedRows[0].blockedReasons).toContain("row_cell_count_mismatch");
  });

  it("blocks unsupported fields", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row({ field: "ebitda" })));

    expect(result.blockedRows[0].blockedReasons).toContain("unsupported_field");
  });

  it("blocks invalid periodType", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row({ periodType: "ttm" })));

    expect(result.blockedRows[0].blockedReasons).toContain("invalid_period_type");
  });

  it("blocks invalid statementType", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row({ statementType: "notes" })));

    expect(result.blockedRows[0].blockedReasons).toContain("invalid_statement_type");
  });

  it("blocks missing basis", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row({ basis: "" })));

    expect(result.blockedRows[0].blockedReasons).toContain("missing_basis");
  });

  it("blocks invalid basis", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row({ basis: "combined" })));

    expect(result.blockedRows[0].blockedReasons).toContain("invalid_basis");
  });

  it("blocks productionApproved true", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row({ productionApproved: "true" })));

    expect(result.productionApproved).toBe(false);
    expect(result.blockedRows[0].blockedReasons).toContain("production_approval_not_allowed");
  });

  it("requires local research/manual modes to stay productionApproved false", () => {
    for (const dataMode of ["research_only", "local_research", "manual"]) {
      const result = parseFinancialStatementCsvParserBoundary(csv(row({ dataMode, productionApproved: "false" })));
      expect(result.ok).toBe(true);
      expect(result.parsedRows[0].dataMode).toBe(dataMode);
      expect(result.parsedRows[0].productionApproved).toBe(false);
    }
  });

  it("detects duplicate row key without keeping first or last row", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row(), row({ value: "61000" })));

    expect(result.ok).toBe(false);
    expect(result.parsedRows).toEqual([]);
    expect(result.blockedRows.some((blocked) => blocked.blockedReasons.includes("duplicate_row_key"))).toBe(true);
  });

  it("lets monetary fields accept only monetary units", () => {
    const valid = parseFinancialStatementCsvParserBoundary(csv(row({ field: "grossProfit", unit: "million_vnd" })));
    const invalid = parseFinancialStatementCsvParserBoundary(csv(row({ field: "grossProfit", unit: "shares" })));

    expect(valid.ok).toBe(true);
    expect(invalid.blockedRows[0].blockedReasons).toContain("invalid_unit");
  });

  it("lets eps accept only vnd_per_share", () => {
    const valid = parseFinancialStatementCsvParserBoundary(csv(row({ field: "eps", unit: "vnd_per_share" })));
    const invalid = parseFinancialStatementCsvParserBoundary(csv(row({ field: "eps", unit: "million_vnd" })));

    expect(valid.ok).toBe(true);
    expect(invalid.blockedRows[0].blockedReasons).toContain("invalid_unit");
  });

  it("lets sharesOutstanding accept only share units", () => {
    const valid = parseFinancialStatementCsvParserBoundary(csv(row({ field: "sharesOutstanding", unit: "million_shares" })));
    const invalid = parseFinancialStatementCsvParserBoundary(csv(row({ field: "sharesOutstanding", unit: "billion_vnd" })));

    expect(valid.ok).toBe(true);
    expect(invalid.blockedRows[0].blockedReasons).toContain("invalid_unit");
  });

  it("does not expose a DB write, filesystem reader, upload endpoint, or investment output surface", async () => {
    const moduleExports = await import("../financial-statement-csv-parser-boundary");
    const exportNames = Object.keys(moduleExports);

    expect(exportNames).toEqual(expect.arrayContaining([...phase81CsvParserBoundaryExposedFunctionNames]));
    for (const term of phase81CsvParserBoundaryForbiddenExposureTerms) {
      expect(exportNames.some((name) => name.toLowerCase().includes(term.toLowerCase()))).toBe(false);
    }
  });

  it("introduces no recommendation, target, fair value, or risk scoring output", () => {
    const result = parseFinancialStatementCsvParserBoundary(csv(row()));
    const output = JSON.stringify(result).toLowerCase();

    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("target");
    expect(output).not.toContain("fairvalue");
    expect(output).not.toContain("riskscore");
  });

  it("maps parsed rows to Phase 78/79/80-style draft/write-intent without DB write", () => {
    const result = parseFinancialStatementCsvParserBoundary(
      csv(
        row({ field: "revenue", unit: "billion_vnd", value: "60000" }),
        row({ field: "totalEquity", statementType: "balance_sheet", unit: "billion_vnd", value: "35000" }),
        row({ field: "sharesOutstanding", statementType: "balance_sheet", unit: "million_shares", value: "1500" }),
        row({ field: "eps", unit: "vnd_per_share", value: "5000" }),
      ),
    );

    expect(result.ok).toBe(true);
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0].writeIntent).toBe("draft_only_no_db_write");
    expect(result.drafts[0].values.revenue).toBe(60_000);
    expect(result.drafts[0].values.totalEquity).toBe(35_000);
    expect(result.drafts[0].unitMetadata.eps?.unit).toBe("vnd_per_share");
    expect(result.noDbWrite).toBe(true);
  });
});
