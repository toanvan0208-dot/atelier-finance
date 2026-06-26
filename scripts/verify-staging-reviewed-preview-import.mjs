import fs from "fs";
import path from "path";
import pg from "pg";

const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"];
const SOURCE_LABEL = "annual_report_2025_pdf_reviewed_preview";
const DATA_MODE = "research_only";
const ALLOWED_FIELDS = ["eps", "sharesOutstanding", "totalDebt"];
const REJECTED_DB_FIELDS = ["revenue", "netIncome", "totalAssets", "equity", "operatingCashFlow"];
const REJECTED_SCHEMA_ABSENT_FIELDS = ["cashAndEquivalents", "capitalExpenditure"];

const envPath = path.join(process.cwd(), ".env.staging.local");
const envContent = fs.readFileSync(envPath, "utf8");
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
const dbUrl = match?.[1]?.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");

if (!dbUrl) {
  console.error("DATABASE_URL not found in .env.staging.local");
  process.exit(1);
}

const lowerUrl = dbUrl.toLowerCase();
if (
  lowerUrl.startsWith("file:") ||
  lowerUrl.includes("dev.db") ||
  lowerUrl.includes("localhost") ||
  lowerUrl.includes("127.0.0.1") ||
  /(^|[^a-z])(production|prod)([^a-z]|$)/i.test(dbUrl) ||
  !lowerUrl.startsWith("postgres")
) {
  console.error("Staging safety check failed.");
  process.exit(1);
}

const fail = (message, details = undefined) => {
  console.error(`[FAIL] ${message}`);
  if (details !== undefined) console.error(JSON.stringify(details, null, 2));
  process.exitCode = 1;
};

const url = new URL(dbUrl);
url.searchParams.delete("sslmode");
const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  const migrationsBefore = await client.query(`select count(*)::int as count from "_prisma_migrations"`);
  const scopedRows = await client.query(
    `select "id", "ticker", "fiscalYear", "sourceLabel", "dataMode",
            "eps", "sharesOutstanding", "totalDebt",
            "revenue", "netIncome", "totalAssets", "equity", "operatingCashFlow",
            "missingFields", "warningCodes"
     from "FinancialStatement"
     where "sourceLabel" = $1 and "dataMode" = $2
     order by "ticker"`,
    [SOURCE_LABEL, DATA_MODE],
  );

  const rows = scopedRows.rows;
  const tickers = rows.map((row) => row.ticker).sort();
  const expectedTickers = [...APPROVED_TICKERS].sort();

  if (rows.length !== APPROVED_TICKERS.length) {
    fail("Expected exactly one scoped FinancialStatement row per approved ticker.", {
      expected: APPROVED_TICKERS.length,
      actual: rows.length,
      tickers,
    });
  }

  const outsideTickers = tickers.filter((ticker) => !APPROVED_TICKERS.includes(ticker));
  if (outsideTickers.length > 0) {
    fail("Found outside ticker rows in reviewed-preview staging scope.", outsideTickers);
  }

  const missingTickers = expectedTickers.filter((ticker) => !tickers.includes(ticker));
  if (missingTickers.length > 0) {
    fail("Missing approved ticker rows in reviewed-preview staging scope.", missingTickers);
  }

  if (tickers.includes("VCB")) {
    fail("VCB appeared in corporate reviewed-preview staging scope.");
  }

  const rejectedFieldViolations = [];
  for (const row of rows) {
    for (const field of REJECTED_DB_FIELDS) {
      if (row[field] !== null) {
        rejectedFieldViolations.push({ ticker: row.ticker, id: row.id, field, value: row[field] });
      }
    }
  }
  if (rejectedFieldViolations.length > 0) {
    fail("Rejected DB fields were non-null on rows in this reviewed-preview scope.", rejectedFieldViolations);
  }

  const metadata = await client.query(
    `select m."id", fs."ticker", m."financialStatementId", m."field", m."unit",
            m."status", m."sourceLabel", m."dataMode", m."productionApproved"
     from "FinancialStatementUnitMetadata" m
     join "FinancialStatement" fs on fs."id" = m."financialStatementId"
     where fs."sourceLabel" = $1 and fs."dataMode" = $2
     order by fs."ticker", m."field"`,
    [SOURCE_LABEL, DATA_MODE],
  );

  const metadataViolations = metadata.rows.filter(
    (row) =>
      row.productionApproved !== false ||
      row.sourceLabel !== SOURCE_LABEL ||
      row.dataMode !== DATA_MODE ||
      row.status !== "explicit" ||
      !ALLOWED_FIELDS.includes(row.field),
  );
  if (metadataViolations.length > 0) {
    fail("Unit metadata guardrail violation in reviewed-preview staging scope.", metadataViolations);
  }

  for (const ticker of APPROVED_TICKERS) {
    const tickerMetadata = metadata.rows.filter((row) => row.ticker === ticker);
    const fields = tickerMetadata.map((row) => row.field).sort();
    if (fields.join(",") !== [...ALLOWED_FIELDS].sort().join(",")) {
      fail(`Unit metadata fields mismatch for ${ticker}.`, { fields });
    }
  }

  const vcb = await client.query(
    `select count(*)::int as count from "FinancialStatement"
     where "sourceLabel" = $1 and "dataMode" = $2 and "ticker" = 'VCB'`,
    [SOURCE_LABEL, DATA_MODE],
  );
  if (vcb.rows[0].count !== 0) {
    fail("VCB count is not zero for corporate reviewed-preview source.", vcb.rows[0]);
  }

  const migrationsAfter = await client.query(`select count(*)::int as count from "_prisma_migrations"`);
  if (migrationsBefore.rows[0].count !== migrationsAfter.rows[0].count) {
    fail("_prisma_migrations count changed during read-only verification.", {
      before: migrationsBefore.rows[0].count,
      after: migrationsAfter.rows[0].count,
    });
  }

  const summary = {
    status: process.exitCode ? "failed" : "passed",
    sourceLabel: SOURCE_LABEL,
    dataMode: DATA_MODE,
    expectedRowCount: APPROVED_TICKERS.length,
    actualRowCount: rows.length,
    financialStatementIds: rows.map((row) => ({ ticker: row.ticker, id: row.id })),
    unitMetadataIds: metadata.rows.map((row) => ({
      ticker: row.ticker,
      field: row.field,
      id: row.id,
      productionApproved: row.productionApproved,
    })),
    vcbCount: vcb.rows[0].count,
    rejectedDbFieldsChecked: REJECTED_DB_FIELDS,
    rejectedFieldsAbsentFromSchema: REJECTED_SCHEMA_ABSENT_FIELDS,
    prismaMigrationCount: migrationsAfter.rows[0].count,
  };

  console.log(JSON.stringify(summary, null, 2));
} finally {
  await client.end();
}
