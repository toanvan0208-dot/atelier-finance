import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

const version = await client.query('select current_database(), current_user, version()');
console.log(version.rows[0]);

const tablesCount = await client.query(`select count(*) as public_table_count from information_schema.tables where table_schema='public'`);
console.log("Table count:", tablesCount.rows[0]);

const tables = await client.query(`select table_name from information_schema.tables where table_schema='public' order by table_name`);
console.log("Tables:", tables.rows.map(r => r.table_name));

const types = await client.query(`select typname from pg_type where typnamespace = 'public'::regnamespace order by typname`);
console.log("Types (Enums):", types.rows.map(r => r.typname));

await client.end();
