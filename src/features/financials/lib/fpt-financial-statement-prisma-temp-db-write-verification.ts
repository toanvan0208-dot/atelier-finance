import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../../generated/prisma/client";
import {
  getFinancialStatementSeries,
  type FinancialStatementReadServiceOptions,
  type FinancialStatementSeriesResult,
} from "@/lib/data-sources/financial-statement-read-service";
import {
  runFinancialStatementLocalWriteTrial,
  type FinancialStatementLocalWriteDb,
  type FinancialStatementLocalWriteTrialReport,
} from "@/lib/data-sources/financial-statement-local-write-service";
import { buildControlledValuationIntegrationBoundary } from "@/features/valuation/lib/controlled-valuation-integration-boundary";
import {
  buildFptFinancialStatementDbWriteTrialPayload,
  FPT_DB_WRITE_TRIAL_SCENARIO,
  phase79ExposedFunctionNames,
  validateFptFinancialStatementDbWriteTrialPayload,
  type FptFinancialStatementDbWriteTrialPayload,
} from "./fpt-financial-statement-db-write-trial";
import { financialsUnitsForValuation, isFinancialsUnitAccepted } from "./financials-unit-metadata-contract";

const execFileAsync = promisify(execFile);

export const FPT_PRISMA_TEMP_DB_SCENARIO =
  "phase80_prisma_backed_fpt_financial_statement_temp_db_write_verification" as const;

export const PHASE80_MIGRATION_FILES = [
  "prisma/migrations/20260618162000_phase_29e_local_database_foundation/migration.sql",
  "prisma/migrations/20260621070000_phase_68_financials_unit_metadata_sidecar/migration.sql",
  "prisma/migrations/20260621093000_phase_75_market_pvt_unit_metadata_sidecar/migration.sql",
] as const;

export type FptPrismaTempDbEnvironment = {
  client: PrismaClient;
  databaseUrl: string;
  dbPath: string;
  tempDir: string;
  tempDirOutsideRepo: boolean;
  appliedMigrationFiles: string[];
};

export type FptPrismaTempDbWritePayload = Omit<FptFinancialStatementDbWriteTrialPayload, "sourceLabel"> & {
  sourceLabel: typeof FPT_PRISMA_TEMP_DB_SCENARIO;
};

export type FptPrismaTempDbVerificationResult = {
  scenario: typeof FPT_PRISMA_TEMP_DB_SCENARIO;
  databaseUrl: string;
  tempDir: string;
  tempDirOutsideRepo: boolean;
  appliedMigrationFiles: string[];
  writeReport: FinancialStatementLocalWriteTrialReport;
  readBack: FinancialStatementSeriesResult;
  valuationBoundary: ReturnType<typeof buildControlledValuationIntegrationBoundary>;
  productionApproved: false;
  dbFileCommitted: false;
};

export type FptPrismaTempDbVerificationValidationResult = {
  readyForPrismaTempDbWrite: boolean;
  productionApproved: false;
  blockedReasons: string[];
  warnings: string[];
};

const npxCommand = (): string => (process.platform === "win32" ? "npx.cmd" : "npx");

const fileUrlForSqlitePath = (path: string): string => `file:${path.replace(/\\/g, "/")}`;

const isOutsideRepo = (targetPath: string, repoRoot: string): boolean => {
  const target = resolve(targetPath).toLowerCase();
  const repo = resolve(repoRoot).toLowerCase();
  return target !== repo && !target.startsWith(`${repo}\\`) && !target.startsWith(`${repo}/`);
};

const applyMigrationFile = async ({
  cwd,
  databaseUrl,
  file,
}: {
  cwd: string;
  databaseUrl: string;
  file: string;
}): Promise<void> => {
  const command = process.platform === "win32" ? "cmd.exe" : npxCommand();
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", `npx prisma db execute --file ${file}`]
      : ["prisma", "db", "execute", "--file", file];

  await execFileAsync(command, args, {
    cwd,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    timeout: 30_000,
  });
};

export const createFptPrismaTempDbEnvironment = async ({
  repoRoot = process.cwd(),
}: {
  repoRoot?: string;
} = {}): Promise<FptPrismaTempDbEnvironment> => {
  const tempDir = await mkdtemp(join(tmpdir(), "atelier-phase80-fpt-prisma-"));
  const dbPath = join(tempDir, "phase80-fpt-financials.db");
  const databaseUrl = fileUrlForSqlitePath(dbPath);

  for (const file of PHASE80_MIGRATION_FILES) {
    await applyMigrationFile({ cwd: repoRoot, databaseUrl, file });
  }

  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  const client = new PrismaClient({ adapter });

  return {
    appliedMigrationFiles: [...PHASE80_MIGRATION_FILES],
    client,
    databaseUrl,
    dbPath,
    tempDir,
    tempDirOutsideRepo: isOutsideRepo(tempDir, repoRoot),
  };
};

export const cleanupFptPrismaTempDbEnvironment = async (
  environment: Pick<FptPrismaTempDbEnvironment, "client" | "tempDir"> | null | undefined,
): Promise<boolean> => {
  if (!environment) return true;
  await environment.client.$disconnect();
  await rm(environment.tempDir, { force: true, recursive: true });
  return true;
};

export const buildFptPrismaTempDbWritePayload = (): FptPrismaTempDbWritePayload => {
  const payload = buildFptFinancialStatementDbWriteTrialPayload();
  if (!payload) {
    throw new Error("Phase 78/79 FPT payload is not ready for Prisma temp DB verification.");
  }

  return {
    ...payload,
    scenario: "phase79_fpt_financial_statement_db_write_trial",
    sourceLabel: FPT_PRISMA_TEMP_DB_SCENARIO,
  };
};

export const validateFptPrismaTempDbVerificationPayload = (
  payload: FptPrismaTempDbWritePayload,
): FptPrismaTempDbVerificationValidationResult => {
  const phase79Validation = validateFptFinancialStatementDbWriteTrialPayload({
    ...payload,
    sourceLabel: FPT_DB_WRITE_TRIAL_SCENARIO,
  });
  const blockedReasons = phase79Validation.blockedReasons.filter((reason) => reason !== "scenario_mismatch");

  if (payload.sourceLabel !== FPT_PRISMA_TEMP_DB_SCENARIO) blockedReasons.push("phase80_source_label_required");

  return {
    blockedReasons: Array.from(new Set(blockedReasons)),
    productionApproved: false,
    readyForPrismaTempDbWrite: blockedReasons.length === 0,
    warnings: [
      "phase_80_prisma_temp_db_write_verification_only",
      "phase_80_not_csv_importer",
      "phase_80_no_source_approval",
    ],
  };
};

export const runFptPrismaTempDbWriteVerification = async (
  environment: FptPrismaTempDbEnvironment,
  payload: FptPrismaTempDbWritePayload = buildFptPrismaTempDbWritePayload(),
): Promise<FptPrismaTempDbVerificationResult> => {
  const validation = validateFptPrismaTempDbVerificationPayload(payload);
  if (!validation.readyForPrismaTempDbWrite) {
    throw new Error(`FPT Prisma temp DB verification blocked: ${validation.blockedReasons.join(", ")}`);
  }

  const db = environment.client as unknown as FinancialStatementLocalWriteDb & FinancialStatementReadServiceOptions["db"];
  const writeReport = await runFinancialStatementLocalWriteTrial(
    {
      acceptedRows: payload.acceptedRows,
      confirmations: payload.confirmations,
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
    { db },
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
    appliedMigrationFiles: environment.appliedMigrationFiles,
    databaseUrl: environment.databaseUrl,
    dbFileCommitted: false,
    productionApproved: false,
    readBack,
    scenario: FPT_PRISMA_TEMP_DB_SCENARIO,
    tempDir: environment.tempDir,
    tempDirOutsideRepo: environment.tempDirOutsideRepo,
    valuationBoundary,
    writeReport,
  };
};

export const verifyFptPrismaTempDbReadBack = (
  result: FptPrismaTempDbVerificationResult,
): FptPrismaTempDbVerificationValidationResult => {
  const blockedReasons: string[] = [];
  const record = result.readBack.records[0] ?? null;

  if (!result.tempDirOutsideRepo) blockedReasons.push("temp_db_must_be_outside_repo");
  if (result.appliedMigrationFiles.length !== PHASE80_MIGRATION_FILES.length) {
    blockedReasons.push("expected_existing_migrations_not_applied");
  }
  if (result.writeReport.status !== "write_completed") blockedReasons.push("write_report_not_completed");
  if (result.writeReport.productionApproved !== false) blockedReasons.push("write_report_production_approval_not_false");
  if (!record) blockedReasons.push("read_back_record_missing");
  if (record?.ticker !== "FPT") blockedReasons.push("read_back_ticker_mismatch");
  if (record?.fiscalYear !== 2024) blockedReasons.push("read_back_period_mismatch");
  if (record?.source.productionApproved !== false) blockedReasons.push("read_back_production_approval_not_false");

  const expectedUnits = {
    eps: "vnd_per_share",
    equity: "billion_vnd",
    revenue: "billion_vnd",
    sharesOutstanding: "million_shares",
  } as const;

  if (record) {
    for (const [field, unit] of Object.entries(expectedUnits)) {
      const metadata = record.unitMetadata?.[field as keyof typeof expectedUnits];
      if (!metadata || metadata.status !== "explicit") blockedReasons.push(`${field}_metadata_not_explicit`);
      if (!metadata || metadata.unit !== unit) blockedReasons.push(`${field}_metadata_unit_mismatch`);
      if (metadata && !isFinancialsUnitAccepted(field as keyof typeof expectedUnits, metadata.unit)) {
        blockedReasons.push(`${field}_metadata_unit_invalid`);
      }
    }
  }

  if (result.valuationBoundary.sourceBoundary.canClaimValuationDbBacked !== false) {
    blockedReasons.push("valuation_db_backed_claim_not_allowed");
  }
  if (result.valuationBoundary.sourceBoundary.productionApproved !== false) {
    blockedReasons.push("valuation_production_approval_not_false");
  }

  return {
    blockedReasons: Array.from(new Set(blockedReasons)),
    productionApproved: false,
    readyForPrismaTempDbWrite: blockedReasons.length === 0,
    warnings: [
      "phase_80_prisma_temp_db_write_verification_only",
      "financials_db_backed_does_not_imply_valuation_fully_db_backed",
    ],
  };
};

export const phase80ExposedFunctionNames = [
  "buildFptPrismaTempDbWritePayload",
  "cleanupFptPrismaTempDbEnvironment",
  "createFptPrismaTempDbEnvironment",
  "runFptPrismaTempDbWriteVerification",
  "validateFptPrismaTempDbVerificationPayload",
  "verifyFptPrismaTempDbReadBack",
] as const;

export const phase80ForbiddenExposureTerms = [
  ...phase79ExposedFunctionNames.filter(() => false),
  "csv",
  "parser",
  "upload",
  "recommendation",
  "target",
  "fairValue",
  "riskScore",
  "dcf",
  "evEbitda",
] as const;
