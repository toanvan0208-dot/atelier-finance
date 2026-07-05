import "dotenv/config";

const POSTGRES_URL_PATTERN = /^postgres(?:ql)?:\/\//i;

export const requirePostgresDatabaseUrl = (context = "script"): string => {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(`${context}: DATABASE_URL is required. The workspace no longer falls back to file:./dev.db.`);
  }

  if (databaseUrl.startsWith("file:") || databaseUrl.includes("dev.db")) {
    throw new Error(`${context}: SQLite/dev.db DATABASE_URL is disabled. Use the Supabase/PostgreSQL DATABASE_URL.`);
  }

  if (!POSTGRES_URL_PATTERN.test(databaseUrl)) {
    throw new Error(`${context}: DATABASE_URL must be a PostgreSQL/Supabase connection string.`);
  }

  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
};
