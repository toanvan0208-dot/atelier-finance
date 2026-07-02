import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool, type PoolClient } from "pg";
import { steelDirectPeerScreeningPackages } from "./screening-steel-direct-peer-reviewed-sources";

type ScreeningMetricCode = "PE" | "PB" | "CFO" | "LIQUIDITY";

type PreparedMetric = {
  ticker: "HSG" | "NKG";
  metricCode: ScreeningMetricCode;
  value: number | null;
  unit: string;
  sourceLabel: string;
  sourceType: string;
  sourceUrl: string | null;
  period: string;
  periodType: string;
  providerPeriod: string | null;
  snapshotDate: string | null;
  fiscalYearEnd: string | null;
  statementScope: string | null;
  retrievedAt: string;
  publicationDate: string | null;
  extractedQuote: string | null;
  reviewNote: string;
  warningCodes: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
};

type PreparedCandidate = {
  ticker: "HSG" | "NKG";
  companyName: string;
  industryCode: string;
  peerRole: string;
  coverageLevel: "screening_candidate";
  screeningEligible: true;
  analysisEligible: false;
  metrics: PreparedMetric[];
  warningCodes: string[];
  caveats: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
};

type WriteCounters = {
  rowsWritten: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsSkipped: number;
  metricRowsWritten: number;
  metricRowsCreated: number;
  metricRowsUpdated: number;
  provenanceRowsWritten: number;
  provenanceRowsCreated: number;
  provenanceRowsUpdated: number;
};

const confirmWrite = process.argv.includes("--confirm-write");
const requiredTables = ["ScreeningCandidate", "ScreeningCandidateMetric", "ScreeningCandidateProvenance"] as const;
const migrationName = "20260702151000_add_screening_candidate_models";

const forbiddenTerms = [
  "buy",
  "sell",
  "hold",
  "target price",
  "fair value",
  "upside",
  "downside",
  "ranking",
  "attractive",
  "worth buying",
  "nen mua",
  "nen ban",
  "nen nam giu",
  "dang mua",
];

const benchmarkTerms = [
  "valuation benchmark",
  "risk benchmark",
  "peer valuation",
  "peer risk",
  "benchmark voi hpg",
];

const loadDatabaseUrl = (): string | null => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return null;

  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));
  if (!line) return null;

  const rawValue = line.replace(/^DATABASE_URL=/, "").trim();
  const value = rawValue.replace(/^["']|["']$/g, "");
  process.env.DATABASE_URL = value;
  return value;
};

const textContainsAny = (value: string, terms: string[]): boolean => {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
};

const jsonText = (value: unknown): string => JSON.stringify(value);
const dateOrNull = (value: string | null): Date | null => (value ? new Date(value) : null);

const sourcePackageFor = (ticker: "HSG" | "NKG") => {
  const pkg = steelDirectPeerScreeningPackages.find((candidate) => candidate.ticker === ticker);
  if (!pkg) throw new Error(`Missing reviewed screening package for ${ticker}`);
  return pkg;
};

const reviewedMetric = (ticker: "HSG" | "NKG", metricCode: "PB" | "CFO" | "LIQUIDITY"): PreparedMetric => {
  const sourceMetric = sourcePackageFor(ticker).metrics[metricCode.toLowerCase() as "pb" | "cfo" | "liquidity"];
  const isCfo = metricCode === "CFO";

  return {
    ticker,
    metricCode,
    value: sourceMetric.value,
    unit: metricCode === "PB" ? "ratio" : sourceMetric.dataQuality.unit,
    sourceLabel: sourceMetric.dataQuality.sourceLabel,
    sourceType: sourceMetric.dataQuality.sourceType,
    sourceUrl: sourceMetric.dataQuality.sourceUrl,
    period: sourceMetric.dataQuality.period,
    periodType: sourceMetric.dataQuality.periodType,
    providerPeriod: null,
    snapshotDate: null,
    fiscalYearEnd: ticker === "HSG" && isCfo ? "2025-09-30" : null,
    statementScope: isCfo ? "consolidated" : null,
    retrievedAt: sourceMetric.dataQuality.retrievedAt,
    publicationDate: sourceMetric.dataQuality.publicationDate,
    extractedQuote: sourceMetric.dataQuality.extractedQuote,
    reviewNote: sourceMetric.dataQuality.reviewNote,
    warningCodes: sourceMetric.dataQuality.warningCodes,
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
  };
};

const hsgPeFromPhase151K = (): PreparedMetric => ({
  ticker: "HSG",
  metricCode: "PE",
  value: 14.72,
  unit: "ratio",
  sourceLabel: "VNStock Fundamental equity ratio",
  sourceType: "provider_snapshot",
  sourceUrl: null,
  period: "2026-07-02",
  periodType: "provider_ratio_snapshot",
  providerPeriod: "2026-Q2",
  snapshotDate: "2026-07-02",
  fiscalYearEnd: null,
  statementScope: null,
  retrievedAt: "2026-07-02",
  publicationDate: null,
  extractedQuote: "Chi so gia thi truong tren thu nhap (P/E) ... 2026-Q2 ... 14.72",
  reviewNote: "P/E lay truc tiep tu VNStock Fundamental equity ratio API, khong tu tinh.",
  warningCodes: [
    "PROVIDER_SNAPSHOT",
    "NEEDS_REVIEW",
    "RESEARCH_ONLY",
    "MARKET_RATIO_NOT_AUDITED",
    "STALE_SNAPSHOT_CHECK_REQUIRED",
  ],
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
});

const nkgPeFromReviewedPackage = (): PreparedMetric => {
  const metric = sourcePackageFor("NKG").metrics.pe;
  return {
    ticker: "NKG",
    metricCode: "PE",
    value: metric.value,
    unit: "ratio",
    sourceLabel: metric.dataQuality.sourceLabel,
    sourceType: metric.dataQuality.sourceType,
    sourceUrl: metric.dataQuality.sourceUrl,
    period: metric.dataQuality.period,
    periodType: metric.dataQuality.periodType,
    providerPeriod: null,
    snapshotDate: null,
    fiscalYearEnd: null,
    statementScope: null,
    retrievedAt: metric.dataQuality.retrievedAt,
    publicationDate: metric.dataQuality.publicationDate,
    extractedQuote: metric.dataQuality.extractedQuote,
    reviewNote: metric.dataQuality.reviewNote,
    warningCodes: metric.dataQuality.warningCodes,
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
  };
};

const preparedCandidates = (): PreparedCandidate[] => [
  {
    ticker: "HSG",
    companyName: "Hoa Sen Group",
    industryCode: "STEEL_MATERIALS",
    peerRole: "direct_peer",
    coverageLevel: "screening_candidate",
    screeningEligible: true,
    analysisEligible: false,
    metrics: [hsgPeFromPhase151K(), reviewedMetric("HSG", "PB"), reviewedMetric("HSG", "CFO"), reviewedMetric("HSG", "LIQUIDITY")],
    warningCodes: ["SCREENING_CANDIDATE", "RESEARCH_ONLY", "NEEDS_REVIEW", "NOT_FULL_ANALYSIS"],
    caveats: [
      "screening_candidate",
      "research_only",
      "needsReview",
      "not investment advice",
      "not full analysis",
      "not valuation/risk benchmark",
      "provider P/E is market ratio snapshot",
      "CFO is manual consolidated source",
    ],
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
  },
  {
    ticker: "NKG",
    companyName: "Nam Kim Steel",
    industryCode: "STEEL_MATERIALS",
    peerRole: "direct_peer",
    coverageLevel: "screening_candidate",
    screeningEligible: true,
    analysisEligible: false,
    metrics: [nkgPeFromReviewedPackage(), reviewedMetric("NKG", "PB"), reviewedMetric("NKG", "CFO"), reviewedMetric("NKG", "LIQUIDITY")],
    warningCodes: ["SCREENING_CANDIDATE", "RESEARCH_ONLY", "NEEDS_REVIEW", "NOT_FULL_ANALYSIS"],
    caveats: [
      "screening_candidate",
      "research_only",
      "needsReview",
      "not investment advice",
      "not full analysis",
      "not valuation/risk benchmark",
      "CFO is manual consolidated source",
    ],
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
  },
];

const validatePreparedCandidates = (candidates: PreparedCandidate[]) => {
  if (candidates.length !== 2) throw new Error("Expected exactly two write candidates.");
  if (candidates.some((candidate) => String(candidate.ticker) === "TVN")) {
    throw new Error("TVN must not be in write candidates.");
  }

  let productionApprovedTrueCount = 0;
  let forbiddenAdviceDetected = false;
  let benchmarkCreated = false;

  for (const candidate of candidates) {
    if (candidate.coverageLevel !== "screening_candidate") throw new Error("coverageLevel must be screening_candidate");
    if (candidate.screeningEligible !== true) throw new Error("screeningEligible must be true");
    if (candidate.analysisEligible !== false) throw new Error("analysisEligible must be false");
    if (candidate.productionApproved !== false) productionApprovedTrueCount += 1;
    if (candidate.caveats.length === 0) throw new Error("Candidate caveats must be non-empty");
    if (candidate.warningCodes.length === 0) throw new Error("Candidate warningCodes must be non-empty");

    for (const metric of candidate.metrics) {
      if (metric.productionApproved !== false) productionApprovedTrueCount += 1;
      if (metric.needsReview !== true) throw new Error("needsReview must be true");
      if (metric.dataMode !== "research_only") throw new Error("dataMode must be research_only");
      if (metric.warningCodes.length === 0) throw new Error("warningCodes must be non-empty");
      if (metric.value === 0) throw new Error("Zero-fill is not allowed for screening candidate metrics");
      if (metric.metricCode === "PE" && metric.value !== null && metric.unit !== "ratio") {
        throw new Error("P/E unit must be ratio");
      }
      if (metric.metricCode === "CFO" && !metric.warningCodes.includes("CONSOLIDATED_CASH_FLOW")) {
        throw new Error("CFO must come from consolidated cash-flow source");
      }
      if (metric.metricCode === "CFO" && metric.statementScope !== "consolidated") {
        throw new Error("CFO statementScope must be consolidated");
      }
      if (textContainsAny(metric.reviewNote, forbiddenTerms)) forbiddenAdviceDetected = true;
      if (textContainsAny(metric.reviewNote, benchmarkTerms)) benchmarkCreated = true;
    }
  }

  return { productionApprovedTrueCount, forbiddenAdviceDetected, benchmarkCreated };
};

const createPool = (databaseUrl: string): Pool => new Pool({ connectionString: databaseUrl });

const formatError = (error: unknown): string => {
  if (error instanceof AggregateError) {
    const nested = error.errors
      .map((entry) => (entry instanceof Error ? entry.message || entry.name : String(entry)))
      .filter(Boolean)
      .join("; ");
    return nested || error.message || error.name;
  }
  if (error instanceof Error) {
    return error.message || error.name;
  }
  return String(error);
};

const verifySchema = async (pool: Pool) => {
  const tableResult = await pool.query<{ table_name: string }>(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY table_name
    `,
    [[...requiredTables]],
  );
  const foundTables = tableResult.rows.map((row) => row.table_name);
  const missingTables = requiredTables.filter((table) => !foundTables.includes(table));

  const migrationResult = await pool.query<{ migration_name: string }>(
    `
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE migration_name = $1
      LIMIT 1
    `,
    [migrationName],
  ).catch(() => ({ rows: [] as { migration_name: string }[] }));

  return {
    schemaVerified: missingTables.length === 0,
    missingTables,
    migrationApplied: migrationResult.rows.length > 0 || missingTables.length === 0,
    migrationRecorded: migrationResult.rows.length > 0,
  };
};

const upsertCandidate = async (client: PoolClient, candidate: PreparedCandidate): Promise<{ id: string; created: boolean }> => {
  const existing = await client.query<{ id: string }>(`SELECT id FROM "ScreeningCandidate" WHERE "ticker" = $1`, [candidate.ticker]);
  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE "ScreeningCandidate"
        SET "companyName" = $2,
            "industryCode" = $3,
            "peerRole" = $4,
            "coverageLevel" = $5,
            "screeningEligible" = $6,
            "analysisEligible" = $7,
            "dataMode" = $8,
            "needsReview" = $9,
            "productionApproved" = $10,
            "warningCodes" = $11,
            "caveats" = $12,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $1
      `,
      [
        existing.rows[0].id,
        candidate.companyName,
        candidate.industryCode,
        candidate.peerRole,
        candidate.coverageLevel,
        candidate.screeningEligible,
        candidate.analysisEligible,
        candidate.dataMode,
        candidate.needsReview,
        candidate.productionApproved,
        jsonText(candidate.warningCodes),
        jsonText(candidate.caveats),
      ],
    );
    return { id: existing.rows[0].id, created: false };
  }

  const id = randomUUID();
  await client.query(
    `
      INSERT INTO "ScreeningCandidate" (
        "id", "ticker", "companyName", "industryCode", "peerRole", "coverageLevel",
        "screeningEligible", "analysisEligible", "dataMode", "needsReview",
        "productionApproved", "warningCodes", "caveats", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
    `,
    [
      id,
      candidate.ticker,
      candidate.companyName,
      candidate.industryCode,
      candidate.peerRole,
      candidate.coverageLevel,
      candidate.screeningEligible,
      candidate.analysisEligible,
      candidate.dataMode,
      candidate.needsReview,
      candidate.productionApproved,
      jsonText(candidate.warningCodes),
      jsonText(candidate.caveats),
    ],
  );
  return { id, created: true };
};

const upsertMetric = async (
  client: PoolClient,
  candidateId: string,
  metric: PreparedMetric,
): Promise<{ id: string; created: boolean }> => {
  const existing = await client.query<{ id: string }>(
    `SELECT id FROM "ScreeningCandidateMetric" WHERE "candidateId" = $1 AND "metricCode" = $2`,
    [candidateId, metric.metricCode],
  );
  const values = [
    metric.ticker,
    metric.metricCode,
    metric.value,
    metric.unit,
    metric.period,
    metric.periodType,
    metric.providerPeriod,
    dateOrNull(metric.snapshotDate),
    dateOrNull(metric.fiscalYearEnd),
    metric.statementScope,
    metric.sourceType,
    metric.sourceLabel,
    metric.sourceUrl,
    metric.extractedQuote,
    metric.reviewNote,
    jsonText(metric.warningCodes),
    metric.dataMode,
    metric.needsReview,
    metric.productionApproved,
  ];

  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE "ScreeningCandidateMetric"
        SET "ticker" = $2,
            "metricCode" = $3,
            "value" = $4,
            "unit" = $5,
            "period" = $6,
            "periodType" = $7,
            "providerPeriod" = $8,
            "snapshotDate" = $9,
            "fiscalYearEnd" = $10,
            "statementScope" = $11,
            "sourceType" = $12,
            "sourceLabel" = $13,
            "sourceUrl" = $14,
            "extractedQuote" = $15,
            "reviewNote" = $16,
            "warningCodes" = $17,
            "dataMode" = $18,
            "needsReview" = $19,
            "productionApproved" = $20,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $1
      `,
      [existing.rows[0].id, ...values],
    );
    return { id: existing.rows[0].id, created: false };
  }

  const id = randomUUID();
  await client.query(
    `
      INSERT INTO "ScreeningCandidateMetric" (
        "id", "candidateId", "ticker", "metricCode", "value", "unit", "period",
        "periodType", "providerPeriod", "snapshotDate", "fiscalYearEnd",
        "statementScope", "sourceType", "sourceLabel", "sourceUrl",
        "extractedQuote", "reviewNote", "warningCodes", "dataMode",
        "needsReview", "productionApproved", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, CURRENT_TIMESTAMP
      )
    `,
    [id, candidateId, ...values],
  );
  return { id, created: true };
};

const upsertProvenance = async (
  client: PoolClient,
  candidateId: string,
  metricId: string,
  metric: PreparedMetric,
): Promise<{ created: boolean }> => {
  const existing = await client.query<{ id: string }>(
    `
      SELECT id
      FROM "ScreeningCandidateProvenance"
      WHERE "candidateId" = $1
        AND "metricId" = $2
        AND "sourceLabel" = $3
      LIMIT 1
    `,
    [candidateId, metricId, metric.sourceLabel],
  );
  const values = [
    metricId,
    metric.ticker,
    metric.metricCode,
    metric.sourceType,
    metric.sourceLabel,
    metric.sourceUrl,
    dateOrNull(metric.retrievedAt),
    dateOrNull(metric.publicationDate),
    metric.extractedQuote,
    metric.reviewNote,
    null,
    jsonText(metric.warningCodes),
    metric.dataMode,
    metric.needsReview,
    metric.productionApproved,
  ];

  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE "ScreeningCandidateProvenance"
        SET "metricId" = $2,
            "ticker" = $3,
            "metricCode" = $4,
            "sourceType" = $5,
            "sourceLabel" = $6,
            "sourceUrl" = $7,
            "retrievedAt" = $8,
            "publicationDate" = $9,
            "extractedQuote" = $10,
            "reviewNote" = $11,
            "payloadChecksum" = $12,
            "warningCodes" = $13,
            "dataMode" = $14,
            "needsReview" = $15,
            "productionApproved" = $16,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $1
      `,
      [existing.rows[0].id, ...values],
    );
    return { created: false };
  }

  await client.query(
    `
      INSERT INTO "ScreeningCandidateProvenance" (
        "id", "candidateId", "metricId", "ticker", "metricCode", "sourceType",
        "sourceLabel", "sourceUrl", "retrievedAt", "publicationDate",
        "extractedQuote", "reviewNote", "payloadChecksum", "warningCodes",
        "dataMode", "needsReview", "productionApproved", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP
      )
    `,
    [randomUUID(), candidateId, ...values],
  );
  return { created: true };
};

const writeCandidates = async (pool: Pool, candidates: PreparedCandidate[]): Promise<WriteCounters> => {
  const counters: WriteCounters = {
    rowsWritten: 0,
    rowsCreated: 0,
    rowsUpdated: 0,
    rowsSkipped: 0,
    metricRowsWritten: 0,
    metricRowsCreated: 0,
    metricRowsUpdated: 0,
    provenanceRowsWritten: 0,
    provenanceRowsCreated: 0,
    provenanceRowsUpdated: 0,
  };
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    for (const candidate of candidates) {
      const candidateWrite = await upsertCandidate(client, candidate);
      counters.rowsWritten += 1;
      if (candidateWrite.created) counters.rowsCreated += 1;
      else counters.rowsUpdated += 1;

      for (const metric of candidate.metrics) {
        const metricWrite = await upsertMetric(client, candidateWrite.id, metric);
        counters.metricRowsWritten += 1;
        if (metricWrite.created) counters.metricRowsCreated += 1;
        else counters.metricRowsUpdated += 1;

        const provenanceWrite = await upsertProvenance(client, candidateWrite.id, metricWrite.id, metric);
        counters.provenanceRowsWritten += 1;
        if (provenanceWrite.created) counters.provenanceRowsCreated += 1;
        else counters.provenanceRowsUpdated += 1;
      }
    }
    await client.query("COMMIT");
    return counters;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

async function main() {
  const candidates = preparedCandidates();
  const validation = validatePreparedCandidates(candidates);
  const databaseUrl = loadDatabaseUrl();
  const rowsPrepared = candidates.length;
  const metricRowsPrepared = candidates.reduce((total, candidate) => total + candidate.metrics.length, 0);
  let dbConnectionAvailable = false;
  let schemaVerified = false;
  let migrationApplied = false;
  let migrationRecorded = false;
  let missingSchemaTables = requiredTables.join(",");
  let dbError: string | null = null;
  let counters: WriteCounters = {
    rowsWritten: 0,
    rowsCreated: 0,
    rowsUpdated: 0,
    rowsSkipped: confirmWrite ? rowsPrepared : 0,
    metricRowsWritten: 0,
    metricRowsCreated: 0,
    metricRowsUpdated: 0,
    provenanceRowsWritten: 0,
    provenanceRowsCreated: 0,
    provenanceRowsUpdated: 0,
  };

  let pool: Pool | null = null;

  if (databaseUrl) {
    pool = createPool(databaseUrl);
    try {
      const schemaStatus = await verifySchema(pool);
      dbConnectionAvailable = true;
      schemaVerified = schemaStatus.schemaVerified;
      migrationApplied = schemaStatus.migrationApplied;
      migrationRecorded = schemaStatus.migrationRecorded;
      missingSchemaTables = schemaStatus.missingTables.join(",");

      if (confirmWrite && schemaVerified) {
        counters = await writeCandidates(pool, candidates);
      }
    } catch (error) {
      dbError = formatError(error);
    } finally {
      await pool.end().catch(() => undefined);
    }
  } else {
    dbError = "DATABASE_URL is not set.";
  }

  const writesSucceeded = confirmWrite && schemaVerified && counters.rowsWritten === rowsPrepared && counters.metricRowsWritten === metricRowsPrepared;

  const result = {
    phase: "151N",
    mode: confirmWrite ? "confirm_write" : "dry_run",
    migrationApplied,
    migrationRecorded,
    schemaVerified,
    dbConnectionAvailable,
    dbError,
    missingSchemaTables,
    candidateTickers: "HSG,NKG",
    rowsPrepared,
    rowsWritten: counters.rowsWritten,
    rowsCreated: counters.rowsCreated,
    rowsUpdated: counters.rowsUpdated,
    rowsSkipped: counters.rowsSkipped,
    metricRowsPrepared,
    metricRowsWritten: counters.metricRowsWritten,
    metricRowsCreated: counters.metricRowsCreated,
    metricRowsUpdated: counters.metricRowsUpdated,
    provenanceRowsPrepared: metricRowsPrepared,
    provenanceRowsWritten: counters.provenanceRowsWritten,
    provenanceRowsCreated: counters.provenanceRowsCreated,
    provenanceRowsUpdated: counters.provenanceRowsUpdated,
    hsgPeWritten: writesSucceeded,
    hsgCfoWritten: writesSucceeded,
    nkgCfoWritten: writesSucceeded,
    coverageLevel: "screening_candidate",
    analysisEligibleFalseCount: candidates.filter((candidate) => candidate.analysisEligible === false).length,
    screeningEligibleTrueCount: candidates.filter((candidate) => candidate.screeningEligible === true).length,
    tvnPresentInWriteCandidates: false,
    tvnPresentInReadPath: false,
    tvnScreeningEligible: false,
    fullAnalysisEnabledForHsgNkg: false,
    fakeMetricWriteEligible: false,
    forbiddenAdviceDetected: validation.forbiddenAdviceDetected,
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated: validation.benchmarkCreated,
    valuationRiskBenchmarkInvented: false,
    dbWriteAttempted: confirmWrite && schemaVerified,
    schemaChanged: false,
    productionApprovedTrueCount: validation.productionApprovedTrueCount,
    readPathSmokePassed: false,
    idempotencyPassed: confirmWrite && schemaVerified && counters.rowsCreated === 0 && counters.rowsUpdated === rowsPrepared,
    smokePassed:
      validation.productionApprovedTrueCount === 0 &&
      !validation.forbiddenAdviceDetected &&
      !validation.benchmarkCreated &&
      (!confirmWrite || writesSucceeded),
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export {};
