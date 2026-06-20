import type { NormalizedFinancialStatementImportRow } from "./financial-statement-import-contract";
import {
  assessFinancialStatementLocalWriteDatabaseUrl,
  type FinancialStatementLocalWriteGuardResult,
} from "./financial-statement-local-write-guard";

export type FinancialStatementLocalWriteConfirmations = {
  confirmLocalResearchOnly?: boolean;
  confirmNoProductionSource?: boolean;
  confirmReviewedDryRun?: boolean;
  confirmNoProductionDatabase?: boolean;
};

export type FinancialStatementLocalWriteStatus =
  | "write_completed"
  | "write_completed_with_skips"
  | "write_rejected"
  | "write_failed";

export type FinancialStatementLocalWriteTrialInput = {
  acceptedRows: NormalizedFinancialStatementImportRow[];
  sourceLabel: string;
  dataMode: string;
  confirmations: FinancialStatementLocalWriteConfirmations;
  databaseUrl?: string;
};

export type FinancialStatementLocalWriteTrialReport = {
  status: FinancialStatementLocalWriteStatus;
  dryRun: false;
  writePlanned: false;
  writeExecuted: boolean;
  noDbWrite: boolean;
  insertedCount: number;
  updatedCount: 0;
  skippedExistingCount: number;
  rejectedCount: number;
  warnings: string[];
  errors: string[];
  sourceLabel: string;
  dataMode: string;
  productionApproved: false;
  databaseGuard: FinancialStatementLocalWriteGuardResult;
  verificationHint: string;
};

type FinancialStatementLocalWriteTx = {
  dataSource: {
    upsert: (args: unknown) => Promise<{ id: string; name: string }>;
  };
  company: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
    create: (args: unknown) => Promise<{ id: string }>;
  };
  financialStatement: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
    create: (args: unknown) => Promise<unknown>;
  };
};

export type FinancialStatementLocalWriteDb = {
  $transaction: <T>(fn: (tx: FinancialStatementLocalWriteTx) => Promise<T>) => Promise<T>;
};

const REQUIRED_CONFIRMATIONS: Array<keyof FinancialStatementLocalWriteConfirmations> = [
  "confirmLocalResearchOnly",
  "confirmNoProductionSource",
  "confirmReviewedDryRun",
  "confirmNoProductionDatabase",
];

const FINANCIAL_STATEMENT_GROUPS = JSON.stringify(["financial_statement"]);

const normalizeText = (value: string): string => value.trim();

const rowPeriodType = (periodType: NormalizedFinancialStatementImportRow["periodType"]): "year" | "quarter" | "unknown" => {
  if (periodType === "annual") return "year";
  if (periodType === "quarterly") return "quarter";
  return "unknown";
};

const rowPeriod = (row: NormalizedFinancialStatementImportRow): string => {
  if (row.periodType === "quarterly" && row.fiscalQuarter) return `${row.fiscalYear}-Q${row.fiscalQuarter}`;
  if (row.periodType === "annual") return String(row.fiscalYear);
  return `${row.fiscalYear}-unknown`;
};

const dateFromStatement = (row: NormalizedFinancialStatementImportRow): Date => {
  if (row.statementDate) return new Date(`${row.statementDate}T00:00:00.000Z`);
  return new Date(Date.UTC(row.fiscalYear, 11, 31));
};

const missingConfirmationErrors = (confirmations: FinancialStatementLocalWriteConfirmations): string[] =>
  REQUIRED_CONFIRMATIONS.flatMap((confirmation) =>
    confirmations[confirmation] === true ? [] : [`${confirmation} confirmation is required.`],
  );

const rejectReport = ({
  input,
  databaseGuard,
  errors,
  warnings = [],
}: {
  input: FinancialStatementLocalWriteTrialInput;
  databaseGuard: FinancialStatementLocalWriteGuardResult;
  errors: string[];
  warnings?: string[];
}): FinancialStatementLocalWriteTrialReport => ({
  status: "write_rejected",
  dryRun: false,
  writePlanned: false,
  writeExecuted: false,
  noDbWrite: true,
  insertedCount: 0,
  updatedCount: 0,
  skippedExistingCount: 0,
  rejectedCount: input.acceptedRows.length,
  warnings: [...warnings, ...databaseGuard.warnings],
  errors: [...errors, ...databaseGuard.errors],
  sourceLabel: input.sourceLabel,
  dataMode: input.dataMode,
  productionApproved: false,
  databaseGuard,
  verificationHint: "No DB write was executed. Fix rejected write-trial conditions and rerun dry-run first.",
});

const resolveDb = async (db: FinancialStatementLocalWriteDb | undefined): Promise<FinancialStatementLocalWriteDb> => {
  if (db) return db;
  const database = await import("../database/client");
  return database.prisma as unknown as FinancialStatementLocalWriteDb;
};

const statementData = ({
  companyId,
  sourceId,
  sourceLabel,
  dataMode,
  row,
}: {
  companyId: string;
  sourceId: string;
  sourceLabel: string;
  dataMode: string;
  row: NormalizedFinancialStatementImportRow;
}) => {
  const asOf = dateFromStatement(row);
  return {
    companyId,
    ticker: row.ticker,
    companyType: "unknown",
    periodType: rowPeriodType(row.periodType),
    period: rowPeriod(row),
    fiscalYear: row.fiscalYear,
    fiscalQuarter: row.fiscalQuarter,
    reportDate: row.statementDate ? asOf : null,
    publishedDate: null,
    currency: row.currency,
    unit: null,
    revenue: row.revenue,
    grossProfit: row.grossProfit,
    netIncome: row.netIncome,
    operatingCashFlow: row.operatingCashFlow,
    totalAssets: row.totalAssets,
    equity: row.totalEquity,
    totalDebt: row.totalDebt ?? row.totalLiabilities,
    currentAssets: row.currentAssets,
    currentLiabilities: row.currentLiabilities,
    eps: row.eps,
    sharesOutstanding: row.sharesOutstanding,
    sourceId,
    sourceLabel,
    sourceType: "user_input",
    dataMode,
    asOf,
    collectedAt: new Date(),
    qualityStatus: row.missingFields.length > 0 || row.warnings.length > 0 ? "partial" : "usable_with_caution",
    readiness: row.missingFields.length > 0 || row.warnings.length > 0 ? "needs_review" : "ready",
    missingFields: JSON.stringify(row.missingFields),
    warningCodes: JSON.stringify(row.warnings.length > 0 ? ["LOCAL_RESEARCH_REVIEW_WARNING"] : []),
    errorCodes: "[]",
  };
};

export const runFinancialStatementLocalWriteTrial = async (
  input: FinancialStatementLocalWriteTrialInput,
  { db }: { db?: FinancialStatementLocalWriteDb } = {},
): Promise<FinancialStatementLocalWriteTrialReport> => {
  const sourceLabel = normalizeText(input.sourceLabel);
  const dataMode = normalizeText(input.dataMode);
  const normalizedInput = { ...input, sourceLabel, dataMode };
  const databaseGuard = assessFinancialStatementLocalWriteDatabaseUrl(input.databaseUrl ?? process.env.DATABASE_URL);
  const errors: string[] = [];

  if (sourceLabel.length === 0) errors.push("sourceLabel is required for a local financial statement write trial.");
  if (dataMode !== "research_only") errors.push("dataMode must be research_only for local write trials.");
  if (input.acceptedRows.length === 0) errors.push("acceptedRows must contain at least one dry-run accepted row.");
  errors.push(...missingConfirmationErrors(input.confirmations));

  if (!databaseGuard.accepted || errors.length > 0) {
    return rejectReport({ input: normalizedInput, databaseGuard, errors });
  }

  const client = await resolveDb(db);

  try {
    const result = await client.$transaction(async (tx) => {
      const source = await tx.dataSource.upsert({
        where: {
          name_sourceType: {
            name: sourceLabel,
            sourceType: "user_input",
          },
        },
        update: {
          supportedDataGroups: FINANCIAL_STATEMENT_GROUPS,
          usageStatus: "research_only",
          licenseStatus: "needs_review",
          tosStatus: "needs_review",
          accessMethod: "manual_upload",
          cachingAllowed: "unknown",
          redistributionAllowed: "unknown",
          runtimeDisplayAllowed: "unknown",
          derivedDataAllowed: "unknown",
          notes: "Synthetic/local financial statement rows for controlled research-only DB write trial.",
        },
        create: {
          name: sourceLabel,
          sourceType: "user_input",
          supportedDataGroups: FINANCIAL_STATEMENT_GROUPS,
          usageStatus: "research_only",
          licenseStatus: "needs_review",
          tosStatus: "needs_review",
          accessMethod: "manual_upload",
          cachingAllowed: "unknown",
          redistributionAllowed: "unknown",
          runtimeDisplayAllowed: "unknown",
          derivedDataAllowed: "unknown",
          notes: "Synthetic/local financial statement rows for controlled research-only DB write trial.",
        },
      });

      let insertedCount = 0;
      let skippedExistingCount = 0;
      const warnings = [...databaseGuard.warnings];

      for (const row of input.acceptedRows) {
        const periodType = rowPeriodType(row.periodType);
        const period = rowPeriod(row);
        const company =
          (await tx.company.findFirst({
            where: { ticker: row.ticker },
            orderBy: [{ dataMode: "asc" }, { createdAt: "asc" }],
            select: { id: true },
          })) ??
          (await tx.company.create({
            data: {
              ticker: row.ticker,
              exchange: null,
              companyName: `${row.ticker} research company`,
              country: "VN",
              currency: row.currency ?? "VND",
              dataMode,
              profileSourceId: source.id,
              profileAsOf: dateFromStatement(row),
            },
            select: { id: true },
          }));

        const existing = await tx.financialStatement.findFirst({
          where: {
            ticker: row.ticker,
            fiscalYear: row.fiscalYear,
            fiscalQuarter: row.fiscalQuarter,
            periodType,
            sourceId: source.id,
            dataMode,
          },
          select: { id: true },
        });

        if (existing) {
          skippedExistingCount += 1;
          warnings.push(`Existing local research financial statement for ${row.ticker} ${period} was skipped.`);
          continue;
        }

        await tx.financialStatement.create({
          data: statementData({ companyId: company.id, sourceId: source.id, sourceLabel: source.name, dataMode, row }),
        });
        insertedCount += 1;
      }

      return { insertedCount, skippedExistingCount, warnings };
    });

    return {
      status: result.skippedExistingCount > 0 ? "write_completed_with_skips" : "write_completed",
      dryRun: false,
      writePlanned: false,
      writeExecuted: result.insertedCount > 0,
      noDbWrite: false,
      insertedCount: result.insertedCount,
      updatedCount: 0,
      skippedExistingCount: result.skippedExistingCount,
      rejectedCount: 0,
      warnings: result.warnings,
      errors: [],
      sourceLabel,
      dataMode,
      productionApproved: false,
      databaseGuard,
      verificationHint: `Verify DB rows by sourceLabel=${sourceLabel} and dataMode=${dataMode}; production approval must remain false.`,
    };
  } catch (error) {
    return {
      status: "write_failed",
      dryRun: false,
      writePlanned: false,
      writeExecuted: false,
      noDbWrite: false,
      insertedCount: 0,
      updatedCount: 0,
      skippedExistingCount: 0,
      rejectedCount: input.acceptedRows.length,
      warnings: databaseGuard.warnings,
      errors: [error instanceof Error ? error.message : "Unknown local write trial failure."],
      sourceLabel,
      dataMode,
      productionApproved: false,
      databaseGuard,
      verificationHint: "Write failed; inspect local DB manually and do not commit DB files.",
    };
  }
};
