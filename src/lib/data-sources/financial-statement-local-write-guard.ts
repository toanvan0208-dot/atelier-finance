export type FinancialStatementLocalDatabaseMode = "postgres_dev" | "postgres_supabase" | "unknown" | "rejected";

export type FinancialStatementLocalWriteGuardResult =
  | {
      accepted: true;
      databaseMode: "postgres_dev" | "postgres_supabase";
      safeDatabaseUrlDisplay: string;
      warnings: string[];
      errors: [];
    }
  | {
      accepted: false;
      databaseMode: "unknown" | "rejected";
      safeDatabaseUrlDisplay: string;
      warnings: string[];
      errors: string[];
    };

const REMOTE_DATABASE_PREFIXES = ["mysql://", "sqlserver://"];
const PRODUCTION_KEYWORDS = ["production", "prod"];
const LOCAL_HOST_KEYWORDS = ["localhost", "127.0.0.1"];
const SUPABASE_HOST_KEYWORDS = ["supabase.co", "supabase.com", "pooler.supabase.com"];

const redactUrl = (databaseUrl: string | undefined): string => {
  if (!databaseUrl) return "<missing>";
  const trimmed = databaseUrl.trim();
  if (trimmed.startsWith("file:")) {
    const [pathPart] = trimmed.split("?");
    return pathPart;
  }

  return trimmed.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:<redacted>@");
};

const hasProductionKeyword = (value: string): boolean => {
  const lower = value.toLowerCase();
  return PRODUCTION_KEYWORDS.some((keyword) => new RegExp(`(^|[^a-z])${keyword}([^a-z]|$)`).test(lower));
};

const isLocalHostUrl = (value: string): boolean => {
  const lower = value.toLowerCase();
  return LOCAL_HOST_KEYWORDS.some((keyword) => lower.includes(keyword));
};

export const assessFinancialStatementLocalWriteDatabaseUrl = (
  databaseUrl: string | undefined,
): FinancialStatementLocalWriteGuardResult => {
  const safeDatabaseUrlDisplay = redactUrl(databaseUrl);
  const trimmed = databaseUrl?.trim();

  if (!trimmed) {
    return {
      accepted: false,
      databaseMode: "unknown",
      safeDatabaseUrlDisplay,
      warnings: [],
      errors: ["DATABASE_URL is required before a confirmed financial statement write."],
    };
  }

  const lower = trimmed.toLowerCase();

  if (hasProductionKeyword(trimmed)) {
    return {
      accepted: false,
      databaseMode: "rejected",
      safeDatabaseUrlDisplay,
      warnings: [],
      errors: ["DATABASE_URL contains production-like wording and is rejected for confirmed research writes."],
    };
  }

  const isPostgres = lower.startsWith("postgresql://") || lower.startsWith("postgres://");
  
  if (isPostgres) {
    const isSupabase = SUPABASE_HOST_KEYWORDS.some((keyword) => lower.includes(keyword));

    return {
      accepted: true,
      databaseMode: isLocalHostUrl(trimmed) ? "postgres_dev" : "postgres_supabase",
      safeDatabaseUrlDisplay,
      warnings: [
        isSupabase
          ? "DATABASE_URL accepted as Supabase/PostgreSQL for confirmed research write."
          : "DATABASE_URL accepted as PostgreSQL for confirmed research write. Confirm this is the intended Supabase/research database.",
      ],
      errors: [],
    };
  }

  if (REMOTE_DATABASE_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return {
      accepted: false,
      databaseMode: "rejected",
      safeDatabaseUrlDisplay,
      warnings: [],
      errors: ["Only PostgreSQL/Supabase DATABASE_URL values are accepted for confirmed financial statement writes."],
    };
  }

  if (lower.startsWith("file:")) {
    return {
      accepted: false,
      databaseMode: "rejected",
      safeDatabaseUrlDisplay,
      warnings: [],
      errors: ["SQLite/file DATABASE_URL values are disabled. Use the Supabase/PostgreSQL DATABASE_URL."],
    };
  }

  return {
    accepted: false,
    databaseMode: "unknown",
    safeDatabaseUrlDisplay,
    warnings: [],
    errors: ["Only PostgreSQL/Supabase DATABASE_URL values are accepted for confirmed financial statement writes."],
  };
};
