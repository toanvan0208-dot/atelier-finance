import {
  DataMode,
  ManualImportStatus,
  PeriodType,
  QualityStatus,
  ReadinessStatus,
  SourceType,
} from "../../../generated/prisma/client";
import {
  normalizeManualUpload,
  type ManualUploadBatchMetadata,
  type ManualUploadInput,
  type ManualUploadRowResult,
} from "../../data-sources/manual-upload-adapter";
import { parseManualUploadCsv } from "../../data-sources/manual-upload-parser";
import { buildManualUploadValidationReport } from "../../data-sources/manual-upload-report";
import type { RawSourceRecord } from "../../data-sources/types";
import { prisma, type DatabaseClient } from "../client";

export type CreateManualImportSessionInput = {
  userId?: string | null;
  sourceLabel?: string;
  targetTicker?: string | null;
  targetPeriod?: string | null;
  fileName?: string | null;
  rowCount?: number;
};

export type CreateManualImportSessionOptions = {
  db?: DatabaseClient;
};

export const createManualImportSession = (
  input: CreateManualImportSessionInput,
  { db = prisma }: CreateManualImportSessionOptions = {},
) =>
  db.manualImportSession.create({
    data: {
      userId: input.userId ?? null,
      mode: "thesis_verification",
      sourceLabel: input.sourceLabel ?? "manual_upload",
      sourceType: SourceType.user_input,
      dataMode: DataMode.user_input,
      targetTicker: input.targetTicker?.trim().toUpperCase() || null,
      targetPeriod: input.targetPeriod?.trim() || null,
      fileName: input.fileName ?? null,
      rowCount: input.rowCount ?? 0,
      validRowCount: 0,
      warningRowCount: 0,
      errorRowCount: 0,
      status: ManualImportStatus.draft,
      readiness: ReadinessStatus.unknown,
    },
  });

export type PersistManualImportInput = {
  kind: "csv" | "rows";
  csvText?: string;
  rows?: RawSourceRecord[];
  batch?: ManualUploadBatchMetadata;
  userId?: string | null;
  sourceLabel?: string | null;
  targetTicker?: string | null;
  targetPeriod?: string | null;
  fileName?: string | null;
};

export type PersistManualImportOptions = {
  db?: DatabaseClient;
};

export type PersistManualImportResult = {
  sessionId: string;
  dataQualityReportId: string;
  status: "pass" | "needs_review" | "failed";
  readiness: ReadinessStatus;
  counts: {
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
  };
  warningCodes: string[];
  errorCodes: string[];
  missingFields: string[];
  topIssues: Array<{
    issueCode: string;
    severity: string;
    category: string;
    count: number;
    affectedFields: string[];
  }>;
  sourceType: SourceType;
  dataMode: DataMode;
  productionApproved: false;
};

const json = (value: unknown): string => JSON.stringify(value ?? null);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const normalizeNullableText = (value: string | null | undefined): string | null => {
  const text = value?.trim();
  return text ? text : null;
};

const readinessValues = new Set(Object.values(ReadinessStatus));
const periodTypeValues = new Set(Object.values(PeriodType));

const toReadinessStatus = (value: string): ReadinessStatus =>
  readinessValues.has(value as ReadinessStatus)
    ? (value as ReadinessStatus)
    : ReadinessStatus.unknown;

const toPeriodType = (value: string | null | undefined): PeriodType =>
  value && periodTypeValues.has(value as PeriodType)
    ? (value as PeriodType)
    : PeriodType.unknown;

const toSessionStatus = (status: PersistManualImportResult["status"]): ManualImportStatus => {
  if (status === "pass") return ManualImportStatus.validated;
  if (status === "needs_review") return ManualImportStatus.needs_review;
  return ManualImportStatus.failed;
};

const adapterInputFromPersistInput = (input: PersistManualImportInput): ManualUploadInput => {
  if (input.kind === "csv") {
    return {
      kind: "csv",
      csvText: input.csvText ?? "",
      batch: input.batch,
    };
  }

  return {
    kind: "rows",
    rows: input.rows ?? [],
    batch: input.batch,
  };
};

const rawRowsFromInput = (input: PersistManualImportInput): RawSourceRecord[] => {
  if (input.kind === "rows") return input.rows ?? [];
  return parseManualUploadCsv(input.csvText ?? "").rows;
};

const tickerFromRow = (row: ManualUploadRowResult): string | null =>
  row.financialStatement?.ticker ??
  row.marketData?.ticker ??
  row.valuationInput?.ticker ??
  null;

const periodValueFromRow = (row: ManualUploadRowResult): string | null =>
  row.financialStatement?.metadata.period?.value ??
  row.marketData?.metadata.period?.value ??
  row.valuationInput?.metadata.period?.value ??
  null;

const periodTypeFromRow = (row: ManualUploadRowResult): PeriodType =>
  toPeriodType(
    row.financialStatement?.metadata.period?.type ??
      row.marketData?.metadata.period?.type ??
      row.valuationInput?.metadata.period?.type,
  );

const asOfFromRow = (row: ManualUploadRowResult): Date | null => {
  const asOf =
    row.financialStatement?.metadata.asOf ??
    row.marketData?.metadata.asOf ??
    row.valuationInput?.metadata.asOf;
  if (!asOf) return null;

  const date = new Date(asOf);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sourceLabelFromRow = (
  row: ManualUploadRowResult,
  fallback: string,
): string =>
  row.financialStatement?.metadata.source ??
  row.marketData?.metadata.source ??
  row.valuationInput?.metadata.source ??
  fallback;

export const persistManualImport = async (
  input: PersistManualImportInput,
  { db = prisma }: PersistManualImportOptions = {},
): Promise<PersistManualImportResult> => {
  const adapterResult = normalizeManualUpload(adapterInputFromPersistInput(input));
  const report = buildManualUploadValidationReport(adapterResult);
  const rawRows = rawRowsFromInput(input);
  const sourceLabel =
    normalizeNullableText(input.sourceLabel) ??
    normalizeNullableText(input.batch?.source ?? null) ??
    "manual_upload";
  const missingFields = uniqueStrings(adapterResult.rowResults.flatMap((row) => row.missingFields));
  const warningCodes = uniqueStrings([
    ...adapterResult.warnings.map((warning) => warning.code),
    ...adapterResult.rowResults.flatMap((row) => row.warnings.map((warning) => warning.code)),
  ]);
  const errorCodes = uniqueStrings([
    ...adapterResult.errors.map((error) => error.code),
    ...adapterResult.rowResults.flatMap((row) => row.errors.map((error) => error.code)),
  ]);
  const readiness = toReadinessStatus(report.readiness);
  const sessionStatus = toSessionStatus(report.status);

  return db.$transaction(async (tx) => {
    const session = await tx.manualImportSession.create({
      data: {
        userId: input.userId ?? null,
        mode: "thesis_verification",
        sourceLabel,
        sourceType: SourceType.user_input,
        dataMode: DataMode.user_input,
        targetTicker: normalizeNullableText(input.targetTicker)?.toUpperCase() ?? null,
        targetPeriod: normalizeNullableText(input.targetPeriod),
        fileName: normalizeNullableText(input.fileName),
        rowCount: report.summary.totalRows,
        validRowCount: report.summary.validRows,
        warningRowCount: report.summary.warningRows,
        errorRowCount: report.summary.errorRows,
        status: sessionStatus,
        readiness,
      },
    });

    const qualityReport = await tx.dataQualityReport.create({
      data: {
        scopeType: "manual_import",
        scopeId: session.id,
        status: report.status,
        readiness,
        qualityStatus: QualityStatus.user_input,
        missingFields: json(missingFields),
        warningCodes: json(warningCodes),
        errorCodes: json(errorCodes),
        topIssues: json(report.topIssues),
        fieldCoverage: json(report.fieldCoverage),
        safeNextSteps: json(report.safeNextSteps),
        calculationVersion: "phase-29f-manual-import-v1",
      },
    });

    if (adapterResult.rowResults.length > 0) {
      await tx.manualImportRecord.createMany({
        data: adapterResult.rowResults.map((row) => ({
          sessionId: session.id,
          rowIndex: row.rowIndex,
          rawPayload: json(rawRows[row.rowIndex - 1] ?? { rowIndex: row.rowIndex }),
          normalizedPayload: json({
            financialStatement: row.financialStatement,
            marketData: row.marketData,
            valuationInput: row.valuationInput,
          }),
          ticker: tickerFromRow(row),
          period: periodValueFromRow(row),
          periodType: periodTypeFromRow(row),
          asOf: asOfFromRow(row),
          sourceLabel: sourceLabelFromRow(row, sourceLabel),
          sourceType: SourceType.user_input,
          dataMode: DataMode.user_input,
          readiness: toReadinessStatus(row.readiness),
          qualityStatus: QualityStatus.user_input,
          warnings: json(row.warnings),
          errors: json(row.errors),
          warningCodes: json(row.warnings.map((warning) => warning.code)),
          errorCodes: json(row.errors.map((error) => error.code)),
          unmappedFields: json(row.unmappedFields),
          missingFields: json(row.missingFields),
        })),
      });
    }

    await tx.manualImportSession.update({
      where: { id: session.id },
      data: { dataQualityReportId: qualityReport.id },
    });

    return {
      sessionId: session.id,
      dataQualityReportId: qualityReport.id,
      status: report.status,
      readiness,
      counts: {
        totalRows: report.summary.totalRows,
        validRows: report.summary.validRows,
        warningRows: report.summary.warningRows,
        errorRows: report.summary.errorRows,
      },
      warningCodes,
      errorCodes,
      missingFields,
      topIssues: report.topIssues.slice(0, 5).map((issue) => ({
        issueCode: issue.issueCode,
        severity: issue.severity,
        category: issue.category,
        count: issue.count,
        affectedFields: issue.affectedFields,
      })),
      sourceType: SourceType.user_input,
      dataMode: DataMode.user_input,
      productionApproved: false,
    };
  });
};
