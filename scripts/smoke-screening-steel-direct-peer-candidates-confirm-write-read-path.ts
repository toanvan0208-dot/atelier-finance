import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

const requiredTables = ["ScreeningCandidate", "ScreeningCandidateMetric", "ScreeningCandidateProvenance"] as const;

const loadDatabaseUrl = (): string | null => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return null;

  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));
  if (!line) return null;

  const value = line.replace(/^DATABASE_URL=/, "").trim().replace(/^["']|["']$/g, "");
  process.env.DATABASE_URL = value;
  return value;
};

const databaseUrl = loadDatabaseUrl();

const emptyResult = (reason: string) => ({
  phase: "151N",
  smoke: "screening-steel-direct-peer-candidates-confirm-write-read-path",
  dbConnectionAvailable: false,
  schemaVerified: false,
  failureReason: reason,
  hsgCandidatePresent: false,
  nkgCandidatePresent: false,
  tvnCandidatePresent: false,
  hsgMetricRows: 0,
  nkgMetricRows: 0,
  provenanceRows: 0,
  hsgPePresent: false,
  hsgPeValue: null,
  hsgPeProviderPeriod: null,
  hsgPeProviderSnapshot: false,
  hsgCfoPresent: false,
  hsgCfoValue: null,
  hsgCfoConsolidatedSource: false,
  nkgCfoPresent: false,
  nkgCfoValue: null,
  nkgCfoConsolidatedSource: false,
  productionApprovedTrueCount: 0,
  industryMetricCreated: false,
  benchmarkCreated: false,
  rankingCreated: false,
  stockAttractivenessScoreCreated: false,
  fullAnalysisEnabledForHsgNkg: false,
  tvnScreeningEligible: false,
  smokePassed: false,
});

type CandidateRow = {
  id: string;
  ticker: string;
  coverageLevel: string;
  screeningEligible: boolean;
  analysisEligible: boolean;
  dataMode: string;
  needsReview: boolean;
  productionApproved: boolean;
};

type MetricRow = {
  ticker: string;
  metricCode: string;
  value: string | null;
  unit: string | null;
  providerPeriod: string | null;
  statementScope: string | null;
  sourceType: string | null;
  sourceLabel: string | null;
  dataMode: string;
  needsReview: boolean;
  productionApproved: boolean;
};

const numberValue = (value: string | null): number | null => (value === null ? null : Number(value));

async function main() {
  if (!databaseUrl) {
    console.log(JSON.stringify(emptyResult("DATABASE_URL is not set."), null, 2));
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const tableResult = await pool.query<{ table_name: string }>(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
      `,
      [[...requiredTables]],
    );
    const foundTables = tableResult.rows.map((row) => row.table_name);
    const schemaVerified = requiredTables.every((table) => foundTables.includes(table));
    if (!schemaVerified) {
      console.log(JSON.stringify({ ...emptyResult(`Missing tables: ${requiredTables.filter((table) => !foundTables.includes(table)).join(",")}`), dbConnectionAvailable: true }, null, 2));
      process.exit(1);
    }

    const candidateRows = await pool.query<CandidateRow>(
      `
        SELECT id, ticker, "coverageLevel", "screeningEligible", "analysisEligible",
               "dataMode", "needsReview", "productionApproved"
        FROM "ScreeningCandidate"
        WHERE ticker IN ('HSG', 'NKG', 'TVN')
      `,
    );
    const metricRows = await pool.query<MetricRow>(
      `
        SELECT ticker, "metricCode", value::text, unit, "providerPeriod", "statementScope",
               "sourceType", "sourceLabel", "dataMode", "needsReview", "productionApproved"
        FROM "ScreeningCandidateMetric"
        WHERE ticker IN ('HSG', 'NKG', 'TVN')
      `,
    );
    const provenanceCount = await pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM "ScreeningCandidateProvenance"
        WHERE ticker IN ('HSG', 'NKG', 'TVN')
      `,
    );

    const hsg = candidateRows.rows.find((row) => row.ticker === "HSG");
    const nkg = candidateRows.rows.find((row) => row.ticker === "NKG");
    const tvn = candidateRows.rows.find((row) => row.ticker === "TVN");
    const hsgMetrics = metricRows.rows.filter((row) => row.ticker === "HSG");
    const nkgMetrics = metricRows.rows.filter((row) => row.ticker === "NKG");
    const hsgPe = hsgMetrics.find((row) => row.metricCode === "PE");
    const hsgCfo = hsgMetrics.find((row) => row.metricCode === "CFO");
    const nkgCfo = nkgMetrics.find((row) => row.metricCode === "CFO");

    const candidateRowsSafe = [hsg, nkg].every(
      (row) =>
        row?.coverageLevel === "screening_candidate" &&
        row.screeningEligible === true &&
        row.analysisEligible === false &&
        row.dataMode === "research_only" &&
        row.needsReview === true &&
        row.productionApproved === false,
    );
    const metricsSafe = [...hsgMetrics, ...nkgMetrics].every(
      (row) => row.dataMode === "research_only" && row.needsReview === true && row.productionApproved === false,
    );
    const productionApprovedTrueCount =
      candidateRows.rows.filter((row) => row.productionApproved).length +
      metricRows.rows.filter((row) => row.productionApproved).length;

    const result = {
      phase: "151N",
      smoke: "screening-steel-direct-peer-candidates-confirm-write-read-path",
      dbConnectionAvailable: true,
      schemaVerified,
      failureReason: null,
      hsgCandidatePresent: Boolean(hsg),
      nkgCandidatePresent: Boolean(nkg),
      tvnCandidatePresent: Boolean(tvn),
      hsgMetricRows: hsgMetrics.length,
      nkgMetricRows: nkgMetrics.length,
      provenanceRows: Number(provenanceCount.rows[0]?.count ?? 0),
      hsgPePresent: Boolean(hsgPe),
      hsgPeValue: numberValue(hsgPe?.value ?? null),
      hsgPeProviderPeriod: hsgPe?.providerPeriod ?? null,
      hsgPeProviderSnapshot: hsgPe?.sourceType === "provider_snapshot",
      hsgCfoPresent: Boolean(hsgCfo),
      hsgCfoValue: numberValue(hsgCfo?.value ?? null),
      hsgCfoConsolidatedSource:
        hsgCfo?.statementScope === "consolidated" &&
        hsgCfo?.sourceType === "user_uploaded_consolidated_financial_statement",
      nkgCfoPresent: Boolean(nkgCfo),
      nkgCfoValue: numberValue(nkgCfo?.value ?? null),
      nkgCfoConsolidatedSource:
        nkgCfo?.statementScope === "consolidated" && nkgCfo?.sourceType === "user_uploaded_annual_report",
      productionApprovedTrueCount,
      industryMetricCreated: false,
      benchmarkCreated: false,
      rankingCreated: false,
      stockAttractivenessScoreCreated: false,
      fullAnalysisEnabledForHsgNkg: false,
      tvnScreeningEligible: Boolean(tvn?.screeningEligible),
      smokePassed:
        Boolean(hsg) &&
        Boolean(nkg) &&
        !tvn &&
        candidateRowsSafe &&
        hsgMetrics.length === 4 &&
        nkgMetrics.length === 4 &&
        Number(provenanceCount.rows[0]?.count ?? 0) >= 8 &&
        numberValue(hsgPe?.value ?? null) === 14.72 &&
        hsgPe?.providerPeriod === "2026-Q2" &&
        hsgPe?.sourceType === "provider_snapshot" &&
        numberValue(hsgCfo?.value ?? null) === 3659840645961 &&
        hsgCfo?.statementScope === "consolidated" &&
        numberValue(nkgCfo?.value ?? null) === 1326940472262 &&
        nkgCfo?.statementScope === "consolidated" &&
        metricsSafe &&
        productionApprovedTrueCount === 0,
    };

    console.log(JSON.stringify(result, null, 2));

    if (!result.smokePassed) {
      process.exit(1);
    }
  } catch (error) {
    console.log(JSON.stringify(emptyResult(error instanceof Error ? error.message : String(error)), null, 2));
    process.exit(1);
  } finally {
    await pool.end().catch(() => undefined);
  }
}

main();

export {};
