import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import pg from "pg";

type ImportRow = {
  ticker: string;
  fiscalYear: number;
  eps: number | null;
  epsUnit: string;
  sharesOutstanding: number | null;
  sharesOutstandingUnit: string;
  totalDebt: number | null;
  totalDebtUnit: string;
};

type WriteTouchedRow = {
  ticker: string;
  financialStatementId: string;
  action: "inserted" | "skipped_existing";
  companyId: string;
  sourceId: string;
  unitMetadataIds: string[];
};

const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"] as const;
const REJECTED_TICKERS = ["VCB"] as const;
const SOURCE_LABEL = "annual_report_2025_pdf_reviewed_preview";
const DATA_MODE = "research_only";
const ALLOWED_FIELDS = ["eps", "sharesOutstanding", "totalDebt"] as const;
const REJECTED_FIELDS = [
  "revenue",
  "netIncome",
  "totalAssets",
  "equity",
  "cashAndEquivalents",
  "capitalExpenditure",
  "operatingCashFlow",
] as const;

const STATIC_CANDIDATES: ImportRow[] = [
  {
    ticker: "FPT",
    fiscalYear: 2025,
    eps: 5216,
    epsUnit: "vnd_per_share",
    sharesOutstanding: 1460,
    sharesOutstandingUnit: "million_shares",
    totalDebt: 33306,
    totalDebtUnit: "billion_vnd",
  },
  {
    ticker: "HPG",
    fiscalYear: 2025,
    eps: 1332,
    epsUnit: "vnd_per_share",
    sharesOutstanding: 6396,
    sharesOutstandingUnit: "million_shares",
    totalDebt: 88924,
    totalDebtUnit: "billion_vnd",
  },
  {
    ticker: "VNM",
    fiscalYear: 2025,
    eps: 4212,
    epsUnit: "vnd_per_share",
    sharesOutstanding: 2089,
    sharesOutstandingUnit: "million_shares",
    totalDebt: 18671,
    totalDebtUnit: "billion_vnd",
  },
  {
    ticker: "MWG",
    fiscalYear: 2025,
    eps: 2661,
    epsUnit: "vnd_per_share",
    sharesOutstanding: 1462,
    sharesOutstandingUnit: "million_shares",
    totalDebt: 23514,
    totalDebtUnit: "billion_vnd",
  },
  {
    ticker: "MSN",
    fiscalYear: 2025,
    eps: 2710,
    epsUnit: "vnd_per_share",
    sharesOutstanding: 1520491927,
    sharesOutstandingUnit: "shares",
    totalDebt: 64877.178,
    totalDebtUnit: "billion_vnd",
  },
];

const readStagingDatabaseUrl = (): string => {
  const envPath = path.join(process.cwd(), ".env.staging.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.staging.local not found. Cannot determine staging database.");
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  const dbUrl = match?.[1]?.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "") ?? "";
  if (!dbUrl) throw new Error("DATABASE_URL not found in .env.staging.local");
  return dbUrl;
};

const maskUrl = (dbUrl: string): string =>
  dbUrl.replace(/\/\/([^:@/]+):([^@/]+)@/, "//***:***@");

const assertSafeStagingUrl = (dbUrl: string): void => {
  const lowerUrl = dbUrl.toLowerCase();

  if (lowerUrl.includes("localhost") || lowerUrl.includes("127.0.0.1")) {
    throw new Error("DATABASE_URL points to localhost. Staging script requires remote staging DB.");
  }
  if (/(^|[^a-z])(production|prod)([^a-z]|$)/i.test(dbUrl)) {
    throw new Error("DATABASE_URL contains production-like wording. Rejected.");
  }
  if (lowerUrl.startsWith("file:") || lowerUrl.includes("dev.db")) {
    throw new Error("DATABASE_URL is SQLite/local dev. Rejected.");
  }
  if (!lowerUrl.startsWith("postgres://") && !lowerUrl.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL must be PostgreSQL. Rejected.");
  }
  const hostname = new URL(dbUrl).hostname.toLowerCase();
  if (!hostname.includes("supabase")) {
    throw new Error("DATABASE_URL must point to the approved Supabase staging host.");
  }
};

const assertPayloadScope = (): void => {
  const tickers = STATIC_CANDIDATES.map((row) => row.ticker);
  const sortedExpected = [...APPROVED_TICKERS].sort().join(",");
  const sortedActual = [...tickers].sort().join(",");
  if (sortedActual !== sortedExpected) {
    throw new Error(`Approved ticker scope mismatch: ${sortedActual}`);
  }
  if (tickers.some((ticker) => (REJECTED_TICKERS as readonly string[]).includes(ticker))) {
    throw new Error("VCB or another rejected ticker appeared in the corporate import payload.");
  }
  for (const row of STATIC_CANDIDATES) {
    const values = [row.eps, row.sharesOutstanding, row.totalDebt];
    if (values.some((value) => value === 0)) {
      throw new Error(`${row.ticker} contains a zero value in an approved field; missing-to-zero is rejected.`);
    }
  }
};

const pgConnectionString = (dbUrl: string): string => {
  const url = new URL(dbUrl);
  url.searchParams.delete("sslmode");
  return url.toString();
};

const makeClient = (dbUrl: string): pg.Client =>
  new pg.Client({ connectionString: pgConnectionString(dbUrl), ssl: { rejectUnauthorized: false } });

const findOrCreateDataSource = async (client: pg.Client): Promise<{ id: string; action: "created" | "reused" }> => {
  const existing = await client.query<{ id: string }>(
    `select "id" from "DataSource" where "name" = $1 and "sourceType" = 'user_input' limit 1`,
    [SOURCE_LABEL],
  );
  if (existing.rowCount && existing.rows[0]) return { id: existing.rows[0].id, action: "reused" };

  const created = await client.query<{ id: string }>(
    `insert into "DataSource" (
      "id", "name", "sourceType", "supportedDataGroups", "usageStatus",
      "licenseStatus", "tosStatus", "accessMethod", "cachingAllowed",
      "redistributionAllowed", "runtimeDisplayAllowed", "derivedDataAllowed",
      "notes", "createdAt", "updatedAt"
    ) values (
      $2, $1, 'user_input', '["financial_statement"]', 'research_only',
      'needs_review', 'needs_review', 'manual_upload', 'unknown',
      'unknown', 'unknown', 'unknown',
      'Staging-specific guarded import path for reviewed-preview research-only financial statement rows.',
      now(), now()
    ) returning "id"`,
    [SOURCE_LABEL, randomUUID()],
  );
  return { id: created.rows[0].id, action: "created" };
};

const findOrCreateCompany = async (
  client: pg.Client,
  row: ImportRow,
  sourceId: string,
): Promise<{ id: string; action: "created" | "reused" }> => {
  const existing = await client.query<{ id: string }>(
    `select "id" from "Company" where "ticker" = $1 order by "createdAt" asc limit 1`,
    [row.ticker],
  );
  if (existing.rowCount && existing.rows[0]) return { id: existing.rows[0].id, action: "reused" };

  const created = await client.query<{ id: string }>(
    `insert into "Company" (
      "id", "ticker", "exchange", "companyName", "companyType", "country",
      "currency", "dataMode", "profileSourceId", "profileAsOf", "createdAt", "updatedAt"
    ) values (
      $6, $1, null, $2, 'non_financial', 'VN',
      'VND', $3, $4, make_date($5, 12, 31), now(), now()
    ) returning "id"`,
    [row.ticker, `${row.ticker} research company`, DATA_MODE, sourceId, row.fiscalYear, randomUUID()],
  );
  return { id: created.rows[0].id, action: "created" };
};

const readMetadataIds = async (client: pg.Client, financialStatementId: string): Promise<string[]> => {
  const result = await client.query<{ id: string }>(
    `select "id" from "FinancialStatementUnitMetadata"
     where "financialStatementId" = $1
       and "field" = any($2::text[])
     order by "field"`,
    [financialStatementId, ALLOWED_FIELDS],
  );
  return result.rows.map((row) => row.id);
};

const insertUnitMetadata = async (
  client: pg.Client,
  financialStatementId: string,
  row: ImportRow,
): Promise<string[]> => {
  const metadataRows = [
    { field: "eps", unit: row.epsUnit },
    { field: "sharesOutstanding", unit: row.sharesOutstandingUnit },
    { field: "totalDebt", unit: row.totalDebtUnit },
  ];
  const ids: string[] = [];

  for (const metadata of metadataRows) {
    const created = await client.query<{ id: string }>(
      `insert into "FinancialStatementUnitMetadata" (
        "id", "financialStatementId", "field", "unit", "status", "sourceLabel",
        "dataMode", "warningCodes", "productionApproved", "createdAt", "updatedAt"
      ) values (
        $6, $1, $2, $3, 'explicit', $4,
        $5, '[]', false, now(), now()
      ) returning "id"`,
      [financialStatementId, metadata.field, metadata.unit, SOURCE_LABEL, DATA_MODE, randomUUID()],
    );
    ids.push(created.rows[0].id);
  }

  return ids;
};

const writeRows = async (dbUrl: string): Promise<{
  dataSource: { id: string; action: "created" | "reused" };
  companies: Array<{ ticker: string; id: string; action: "created" | "reused" }>;
  rows: WriteTouchedRow[];
}> => {
  const client = makeClient(dbUrl);
  await client.connect();

  try {
    await client.query("begin");
    const dataSource = await findOrCreateDataSource(client);
    const companies: Array<{ ticker: string; id: string; action: "created" | "reused" }> = [];
    const rows: WriteTouchedRow[] = [];

    for (const row of STATIC_CANDIDATES) {
      const company = await findOrCreateCompany(client, row, dataSource.id);
      companies.push({ ticker: row.ticker, id: company.id, action: company.action });

      const existing = await client.query<{ id: string }>(
        `select "id" from "FinancialStatement"
         where "ticker" = $1
           and "fiscalYear" = $2
           and "periodType" = 'year'
           and "sourceId" = $3
           and "sourceLabel" = $4
           and "dataMode" = $5
         limit 1`,
        [row.ticker, row.fiscalYear, dataSource.id, SOURCE_LABEL, DATA_MODE],
      );

      if (existing.rowCount && existing.rows[0]) {
        rows.push({
          ticker: row.ticker,
          financialStatementId: existing.rows[0].id,
          action: "skipped_existing",
          companyId: company.id,
          sourceId: dataSource.id,
          unitMetadataIds: await readMetadataIds(client, existing.rows[0].id),
        });
        continue;
      }

      const created = await client.query<{ id: string }>(
        `insert into "FinancialStatement" (
          "id", "companyId", "ticker", "companyType", "periodType", "period",
          "fiscalYear", "fiscalQuarter", "reportDate", "publishedDate", "currency", "unit",
          "revenue", "grossProfit", "netIncome", "operatingCashFlow", "totalAssets",
          "equity", "totalDebt", "currentAssets", "currentLiabilities", "eps", "bvps",
          "sharesOutstanding", "marketCap", "enterpriseValue", "sourceId", "sourceLabel",
          "sourceType", "dataMode", "asOf", "collectedAt", "qualityStatus", "readiness",
          "missingFields", "warningCodes", "errorCodes", "createdAt", "updatedAt"
        ) values (
          $13, $1, $2, 'non_financial', 'year', $3,
          $4, null, null, null, 'VND', null,
          null, null, null, null, null,
          null, $5, null, null, $6, null,
          $7, null, null, $8, $9,
          'user_input', $10, make_date($4, 12, 31), now(), 'partial', 'needs_review',
          $11, $12, '[]', now(), now()
        ) returning "id"`,
        [
          company.id,
          row.ticker,
          String(row.fiscalYear),
          row.fiscalYear,
          row.totalDebt,
          row.eps,
          row.sharesOutstanding,
          dataSource.id,
          SOURCE_LABEL,
          DATA_MODE,
          JSON.stringify(REJECTED_FIELDS),
          JSON.stringify(["STAGING_REVIEWED_PREVIEW_LIMITED_FIELD_IMPORT"]),
          randomUUID(),
        ],
      );
      const financialStatementId = created.rows[0].id;
      rows.push({
        ticker: row.ticker,
        financialStatementId,
        action: "inserted",
        companyId: company.id,
        sourceId: dataSource.id,
        unitMetadataIds: await insertUnitMetadata(client, financialStatementId, row),
      });
    }

    await client.query("commit");
    return { dataSource, companies, rows };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
};

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  const confirmWrite = argv.includes("--confirm-write");
  const dbUrl = readStagingDatabaseUrl();
  assertSafeStagingUrl(dbUrl);
  assertPayloadScope();

  console.log("=== Phase 142H-S-A/V: Staging Reviewed-Preview Import ===");
  console.log(`Mode: ${confirmWrite ? "CONFIRM-WRITE" : "DRY-RUN"}`);
  console.log(`[OK] Staging database recognized. URL: ${maskUrl(dbUrl)}`);

  console.log("\n=== SCOPE ===");
  console.log(`writeEnabled: ${confirmWrite}`);
  console.log(`confirmWrite: ${confirmWrite}`);
  console.log(`DB write: ${confirmWrite ? "Yes, staging only" : "No"}`);
  console.log(`tickers: ${APPROVED_TICKERS.join(", ")}`);
  console.log(`VCB excluded: true`);
  console.log(`fields: ${ALLOWED_FIELDS.join(", ")}`);
  console.log(`rejectedFields: ${REJECTED_FIELDS.join(", ")}`);
  console.log(`sourceLabel: ${SOURCE_LABEL}`);
  console.log(`dataMode: ${DATA_MODE}`);
  console.log(`productionApproved: false`);
  console.log(`connection string: masked only`);

  console.log("\nCandidate Rows to Import:");
  for (const row of STATIC_CANDIDATES) {
    console.log(
      `- ${row.ticker} (FY ${row.fiscalYear}): EPS=${row.eps} ${row.epsUnit}, Shares=${row.sharesOutstanding} ${row.sharesOutstandingUnit}, TotalDebt=${row.totalDebt} ${row.totalDebtUnit}`,
    );
  }
  console.log(`Total rows projected: ${STATIC_CANDIDATES.length}`);

  console.log("\nRollback Criteria:");
  console.log(`Preferred rollback uses exact captured FinancialStatement IDs from this phase.`);
  console.log(`Fallback rollback requires explicit review before execution and must remain scoped by sourceLabel, ticker, and dataMode.`);

  if (!confirmWrite) {
    console.log("\n[SUCCESS] Dry run finished safely.");
    return;
  }

  const result = await writeRows(dbUrl);
  const inserted = result.rows.filter((row) => row.action === "inserted");
  const skipped = result.rows.filter((row) => row.action === "skipped_existing");

  console.log("\n=== CONFIRM WRITE RESULT ===");
  console.log(
    JSON.stringify(
      {
        status: "write_completed",
        writeExecuted: inserted.length > 0,
        insertedCount: inserted.length,
        skippedExistingCount: skipped.length,
        updatedCount: 0,
        rejectedCount: 0,
        dataSource: result.dataSource,
        companies: result.companies,
        financialStatementIds: result.rows.map((row) => ({
          ticker: row.ticker,
          action: row.action,
          id: row.financialStatementId,
        })),
        unitMetadataIds: result.rows.map((row) => ({
          ticker: row.ticker,
          action: row.action,
          ids: row.unitMetadataIds,
        })),
        sourceLabel: SOURCE_LABEL,
        dataMode: DATA_MODE,
        productionApproved: false,
      },
      null,
      2,
    ),
  );
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
