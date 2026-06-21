import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import {
  getFinancialStatementSeries,
  type FinancialStatementSeriesResult,
} from "@/lib/data-sources/financial-statement-read-service";
import {
  runFinancialStatementLocalWriteTrial,
  type FinancialStatementLocalWriteTrialReport,
} from "@/lib/data-sources/financial-statement-local-write-service";
import type { NormalizedFinancialStatementImportRow } from "@/lib/data-sources/financial-statement-import-contract";
import { buildControlledValuationIntegrationBoundary } from "@/features/valuation/lib/controlled-valuation-integration-boundary";
import {
  cleanupFptPrismaTempDbEnvironment,
  createFptPrismaTempDbEnvironment,
  type FptPrismaTempDbEnvironment,
} from "./fpt-financial-statement-prisma-temp-db-write-verification";
import {
  buildFinancialsUnitMetadata,
  financialsUnitsForValuation,
  type FinancialsNumericField,
} from "./financials-unit-metadata-contract";
import {
  parseFinancialStatementCsvParserBoundary,
  type FinancialStatementCsvParserBoundaryResult,
  type FinancialStatementCsvParsedRow,
} from "./financial-statement-csv-parser-boundary";

export const FINANCIAL_STATEMENT_CSV_TO_PRISMA_TEMP_DB_SCENARIO =
  "phase82_csv_parser_to_prisma_temp_db_write_trial" as const;

export type FinancialStatementCsvToPrismaTempDbWritePayload = {
  sourceLabel: typeof FINANCIAL_STATEMENT_CSV_TO_PRISMA_TEMP_DB_SCENARIO;
  dataMode: "research_only";
  productionApproved: false;
  acceptedRows: NormalizedFinancialStatementImportRow[];
};

export type FinancialStatementCsvToPrismaTempDbWriteTrialResult = {
  scenario: typeof FINANCIAL_STATEMENT_CSV_TO_PRISMA_TEMP_DB_SCENARIO;
  parserResult: FinancialStatementCsvParserBoundaryResult;
  payload: FinancialStatementCsvToPrismaTempDbWritePayload;
  writeReport: FinancialStatementLocalWriteTrialReport;
  readBack: FinancialStatementSeriesResult;
  valuationBoundary: ReturnType<typeof buildControlledValuationIntegrationBoundary>;
  productionApproved: false;
  dbFileCommitted: false;
  tempDirOutsideRepo: boolean;
};

export type FinancialStatementCsvToPrismaTempDbValidationResult = {
  readyForPrismaTempDbWrite: boolean;
  productionApproved: false;
  blockedReasons: string[];
  warnings: string[];
};

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

const row = ({
  field,
  statementType,
  unit,
  value,
}: {
  field: string;
  statementType: string;
  unit: ValuationUnit;
  value: number;
}): string =>
  [
    "FPT",
    "2024",
    "annual",
    statementType,
    field,
    String(value),
    unit,
    "VND",
    FINANCIAL_STATEMENT_CSV_TO_PRISMA_TEMP_DB_SCENARIO,
    "user_provided_local_research",
    "",
    "phase82-inline-csv-string-no-file",
    "2026-06-21",
    "research_only",
    "false",
    "Inline CSV string fixture; not official and not production-approved.",
    "consolidated",
  ].join(",");

export const buildFinancialStatementCsvToPrismaTempDbInlineFixture = (): string =>
  [
    header,
    row({ field: "revenue", statementType: "income_statement", unit: "billion_vnd", value: 60_000 }),
    row({ field: "netIncome", statementType: "income_statement", unit: "billion_vnd", value: 8_000 }),
    row({ field: "eps", statementType: "income_statement", unit: "vnd_per_share", value: 5_000 }),
    row({ field: "totalAssets", statementType: "balance_sheet", unit: "billion_vnd", value: 70_000 }),
    row({ field: "totalEquity", statementType: "balance_sheet", unit: "billion_vnd", value: 35_000 }),
    row({ field: "currentAssets", statementType: "balance_sheet", unit: "billion_vnd", value: 25_000 }),
    row({ field: "currentLiabilities", statementType: "balance_sheet", unit: "billion_vnd", value: 14_000 }),
    row({ field: "operatingCashFlow", statementType: "cash_flow", unit: "billion_vnd", value: 9_000 }),
    row({ field: "sharesOutstanding", statementType: "balance_sheet", unit: "million_shares", value: 1_500 }),
  ].join("\n");

const valueFor = (rows: FinancialStatementCsvParsedRow[], field: string): number | null =>
  rows.find((item) => item.field === field)?.value ?? null;

const unitFor = (rows: FinancialStatementCsvParsedRow[], field: string): ValuationUnit | null =>
  rows.find((item) => item.field === field)?.unit ?? null;

const explicitUnitsFrom = (rows: FinancialStatementCsvParsedRow[]): Partial<Record<FinancialsNumericField, ValuationUnit>> => {
  const pairs: Array<[FinancialsNumericField, string]> = [
    ["currentAssets", "currentAssets"],
    ["currentLiabilities", "currentLiabilities"],
    ["eps", "eps"],
    ["equity", "totalEquity"],
    ["netIncome", "netIncome"],
    ["operatingCashFlow", "operatingCashFlow"],
    ["revenue", "revenue"],
    ["sharesOutstanding", "sharesOutstanding"],
    ["totalAssets", "totalAssets"],
  ];
  return Object.fromEntries(
    pairs.flatMap(([target, source]) => {
      const unit = unitFor(rows, source);
      return unit ? [[target, unit]] : [];
    }),
  ) as Partial<Record<FinancialsNumericField, ValuationUnit>>;
};

export const mapCsvParserResultToPrismaTempDbWritePayload = (
  parserResult: FinancialStatementCsvParserBoundaryResult,
): FinancialStatementCsvToPrismaTempDbWritePayload | null => {
  if (!parserResult.ok || parserResult.blockedRows.length > 0 || parserResult.parsedRows.length === 0) return null;

  const first = parserResult.parsedRows[0];
  const rows = parserResult.parsedRows;
  const fiscalYear = Number(first.period);
  if (!Number.isInteger(fiscalYear)) return null;

  const unitMetadata = buildFinancialsUnitMetadata({
    dataMode: "research_only",
    explicitUnits: explicitUnitsFrom(rows),
    snapshot: {
      currentAssets: valueFor(rows, "currentAssets"),
      currentLiabilities: valueFor(rows, "currentLiabilities"),
      eps: valueFor(rows, "eps"),
      netProfit: valueFor(rows, "netIncome"),
      operatingCashFlow: valueFor(rows, "operatingCashFlow"),
      revenue: valueFor(rows, "revenue"),
      sharesOutstanding: valueFor(rows, "sharesOutstanding"),
      sourceName: FINANCIAL_STATEMENT_CSV_TO_PRISMA_TEMP_DB_SCENARIO,
      totalAssets: valueFor(rows, "totalAssets"),
      totalDebt: null,
      totalEquity: valueFor(rows, "totalEquity"),
    },
    sourceLabel: FINANCIAL_STATEMENT_CSV_TO_PRISMA_TEMP_DB_SCENARIO,
  });

  return {
    acceptedRows: [
      {
        capitalExpenditure: valueFor(rows, "capitalExpenditure"),
        cashAndEquivalents: valueFor(rows, "cashAndEquivalents"),
        currency: first.currency,
        currentAssets: valueFor(rows, "currentAssets"),
        currentLiabilities: valueFor(rows, "currentLiabilities"),
        dataMode: "research_only",
        eps: valueFor(rows, "eps"),
        fiscalQuarter: null,
        fiscalYear,
        grossProfit: valueFor(rows, "grossProfit"),
        missingFields: [],
        netIncome: valueFor(rows, "netIncome"),
        operatingCashFlow: valueFor(rows, "operatingCashFlow"),
        operatingIncome: null,
        periodType: "annual",
        productionApproved: false,
        revenue: valueFor(rows, "revenue"),
        rowIndex: 0,
        sharesOutstanding: valueFor(rows, "sharesOutstanding"),
        sourceLabel: FINANCIAL_STATEMENT_CSV_TO_PRISMA_TEMP_DB_SCENARIO,
        sourceRowNumber: 1,
        statementDate: `${first.period}-12-31`,
        ticker: first.ticker,
        totalAssets: valueFor(rows, "totalAssets"),
        totalDebt: null,
        totalEquity: valueFor(rows, "totalEquity"),
        totalLiabilities: valueFor(rows, "totalLiabilities"),
        unitMetadata,
        warnings: parserResult.warnings,
      },
    ],
    dataMode: "research_only",
    productionApproved: false,
    sourceLabel: FINANCIAL_STATEMENT_CSV_TO_PRISMA_TEMP_DB_SCENARIO,
  };
};

export const validateCsvParserToPrismaTempDbWritePayload = (
  parserResult: FinancialStatementCsvParserBoundaryResult,
  payload: FinancialStatementCsvToPrismaTempDbWritePayload | null,
): FinancialStatementCsvToPrismaTempDbValidationResult => {
  const blockedReasons: string[] = [];
  if (!parserResult.ok) blockedReasons.push("parser_result_not_ok");
  if (parserResult.blockedRows.length > 0) blockedReasons.push("parser_blocked_rows_prevent_write");
  if (parserResult.writeIntent !== "draft_only_no_db_write") blockedReasons.push("parser_write_intent_mismatch");
  if (!payload) blockedReasons.push("payload_not_mappable");
  if (payload?.acceptedRows.length !== 1) blockedReasons.push("single_payload_row_required");
  if (payload?.acceptedRows[0]?.productionApproved !== false) blockedReasons.push("production_approval_not_allowed");

  return {
    blockedReasons: Array.from(new Set(blockedReasons)),
    productionApproved: false,
    readyForPrismaTempDbWrite: blockedReasons.length === 0,
    warnings: [
      "phase_82_csv_parser_to_prisma_temp_db_write_trial_only",
      "inline_csv_string_only_no_filesystem_read",
      "local_research_manual_data_production_approved_false",
    ],
  };
};

export const runFinancialStatementCsvToPrismaTempDbWriteTrial = async ({
  csvText = buildFinancialStatementCsvToPrismaTempDbInlineFixture(),
  environment,
}: {
  csvText?: string;
  environment: FptPrismaTempDbEnvironment;
}): Promise<FinancialStatementCsvToPrismaTempDbWriteTrialResult> => {
  const parserResult = parseFinancialStatementCsvParserBoundary(csvText);
  const payload = mapCsvParserResultToPrismaTempDbWritePayload(parserResult);
  const validation = validateCsvParserToPrismaTempDbWritePayload(parserResult, payload);
  if (!validation.readyForPrismaTempDbWrite || !payload) {
    throw new Error(`CSV parser to Prisma temp DB trial blocked: ${validation.blockedReasons.join(", ")}`);
  }

  const db = environment.client as Parameters<typeof runFinancialStatementLocalWriteTrial>[1] extends { db?: infer Db }
    ? Db
    : never;
  const writeReport = await runFinancialStatementLocalWriteTrial(
    {
      acceptedRows: payload.acceptedRows,
      confirmations: {
        confirmLocalResearchOnly: true,
        confirmNoProductionDatabase: true,
        confirmNoProductionSource: true,
        confirmReviewedDryRun: true,
      },
      dataMode: payload.dataMode,
      databaseUrl: environment.databaseUrl,
      sourceLabel: payload.sourceLabel,
    },
    { db },
  );
  const readBack = await getFinancialStatementSeries(
    {
      dataMode: payload.dataMode,
      limit: 1,
      periodType: "year",
      sourceLabel: payload.sourceLabel,
      ticker: "FPT",
    },
    { db: environment.client as Parameters<typeof getFinancialStatementSeries>[1] extends { db?: infer Db } ? Db : never },
  );
  const record = readBack.records[0] ?? null;
  const units = record?.unitMetadata ? financialsUnitsForValuation(record.unitMetadata) : financialsUnitsForValuation(null);
  const valuationBoundary = buildControlledValuationIntegrationBoundary({
    financialsRuntimeSnapshot: {
      dataMode: record?.source.dataMode,
      equity: record?.values.totalEquity,
      eps: record?.values.eps,
      productionApproved: false,
      readPath: "local_db",
      revenue: record?.values.revenue,
      sharesOutstanding: record?.values.sharesOutstanding,
      units,
    },
    persistedValuationInputs: {
      marketPrice: 50_000,
      units: { marketPrice: "vnd_per_share" },
    },
  });

  return {
    dbFileCommitted: false,
    parserResult,
    payload,
    productionApproved: false,
    readBack,
    scenario: FINANCIAL_STATEMENT_CSV_TO_PRISMA_TEMP_DB_SCENARIO,
    tempDirOutsideRepo: environment.tempDirOutsideRepo,
    valuationBoundary,
    writeReport,
  };
};

export const createFinancialStatementCsvToPrismaTempDbEnvironment = createFptPrismaTempDbEnvironment;
export const cleanupFinancialStatementCsvToPrismaTempDbEnvironment = cleanupFptPrismaTempDbEnvironment;

export const phase82CsvToPrismaTempDbExposedFunctionNames = [
  "buildFinancialStatementCsvToPrismaTempDbInlineFixture",
  "cleanupFinancialStatementCsvToPrismaTempDbEnvironment",
  "createFinancialStatementCsvToPrismaTempDbEnvironment",
  "mapCsvParserResultToPrismaTempDbWritePayload",
  "runFinancialStatementCsvToPrismaTempDbWriteTrial",
  "validateCsvParserToPrismaTempDbWritePayload",
] as const;

export const phase82CsvToPrismaTempDbForbiddenExposureTerms = [
  "readFile",
  "writeFile",
  "upload",
  "endpoint",
  "recommendation",
  "target",
  "fairValue",
  "riskScore",
] as const;
