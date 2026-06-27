import pg from 'pg';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) process.exit(1);

const cleanUrl = dbUrl.replace(/\?sslmode=[^&]+/, '');
const client = new pg.Client({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false }
});

client.connect().then(() => {
  return client.query('SELECT COUNT(*) FROM "MarketPriceUnitMetadata"');
}).then(res => {
  console.log('UnitMetadata Count:', res.rows[0].count);
  return client.query('SELECT ticker, COUNT(*) FROM "MarketPrice" GROUP BY ticker');
}).then(res => {
  console.log('MarketPrice:', res.rows);
  client.end();
});
