import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;

const result = {
  databaseUrlSet: Boolean(databaseUrl),
  isPostgres: false,
  isFileUrl: false,
  isLocalhost: false,
  hostIsSupabase: false,
  sslMode: null,
};

if (databaseUrl) {
  result.isFileUrl = databaseUrl.startsWith("file:") || databaseUrl.includes("dev.db");

  try {
    const parsed = new URL(databaseUrl);
    result.isPostgres = parsed.protocol === "postgresql:" || parsed.protocol === "postgres:";
    result.isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
    result.hostIsSupabase = parsed.hostname.includes("supabase.com");
    result.sslMode = parsed.searchParams.get("sslmode");
  } catch {
    result.isPostgres = false;
  }
}

console.log(JSON.stringify(result, null, 2));

if (!result.databaseUrlSet || !result.isPostgres || result.isFileUrl) {
  console.error("DATABASE_URL must point to PostgreSQL/Supabase, not a local SQLite dev.db file.");
  process.exit(1);
}

if (!result.hostIsSupabase) {
  console.warn("DATABASE_URL is PostgreSQL, but the host is not recognized as Supabase.");
}
