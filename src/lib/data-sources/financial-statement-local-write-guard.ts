export type FinancialStatementLocalDatabaseMode = "local_sqlite_dev" | "unknown" | "rejected";

export type FinancialStatementLocalWriteGuardResult =
  | {
      accepted: true;
      databaseMode: "local_sqlite_dev";
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

const REMOTE_DATABASE_PREFIXES = ["postgres://", "postgresql://", "mysql://", "sqlserver://"];
const PRODUCTION_KEYWORDS = ["production", "prod"];

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
      errors: ["DATABASE_URL is required before a local financial statement write trial."],
    };
  }

  const lower = trimmed.toLowerCase();
  if (REMOTE_DATABASE_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return {
      accepted: false,
      databaseMode: "rejected",
      safeDatabaseUrlDisplay,
      warnings: [],
      errors: ["Remote database URLs are rejected for financial statement local write trials."],
    };
  }

  if (hasProductionKeyword(trimmed)) {
    return {
      accepted: false,
      databaseMode: "rejected",
      safeDatabaseUrlDisplay,
      warnings: [],
      errors: ["DATABASE_URL contains production-like wording and is rejected for local write trials."],
    };
  }

  if (!lower.startsWith("file:")) {
    return {
      accepted: false,
      databaseMode: "unknown",
      safeDatabaseUrlDisplay,
      warnings: [],
      errors: ["Only local SQLite file: DATABASE_URL values are accepted for this write trial."],
    };
  }

  return {
    accepted: true,
    databaseMode: "local_sqlite_dev",
    safeDatabaseUrlDisplay,
    warnings: ["DATABASE_URL accepted as a local SQLite/dev database for controlled research write trial."],
    errors: [],
  };
};
