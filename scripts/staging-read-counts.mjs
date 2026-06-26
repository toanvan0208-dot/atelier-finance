import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Parse .env.staging.local
const envPath = path.join(process.cwd(), '.env.staging.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=')[1].replace(/"/g, '').trim();
  }
}

if (!dbUrl) {
  console.error("No DATABASE_URL found in .env.staging.local");
  process.exit(1);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

const tables = await client.query(`select table_name from information_schema.tables where table_schema='public' order by table_name`);
console.log("Tables:", tables.rows.map(r => r.table_name).join(', '));

const companyCount = await client.query(`select count(*) as c from "Company"`);
const fsCount = await client.query(`select count(*) as c from "FinancialStatement"`);
const fsMetaCount = await client.query(`select count(*) as c from "FinancialStatementUnitMetadata"`);
const mpCount = await client.query(`select count(*) as c from "MarketPrice"`);

console.log("Company count:", companyCount.rows[0].c);
console.log("FinancialStatement count:", fsCount.rows[0].c);
console.log("FinancialStatementUnitMetadata count:", fsMetaCount.rows[0].c);
console.log("MarketPrice count:", mpCount.rows[0].c);

await client.end();
