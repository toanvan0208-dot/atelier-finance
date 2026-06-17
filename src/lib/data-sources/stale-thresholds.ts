import type { DataGroup } from "./types";

export type StaleThreshold = {
  maxAgeDays: number;
  note: string;
};

export type StaleCheckResult = {
  isStale: boolean;
  ageDays: number | null;
  threshold: StaleThreshold;
  reason: string | null;
};

export const DEFAULT_STALE_THRESHOLDS: Record<DataGroup, StaleThreshold> = {
  market: {
    maxAgeDays: 3,
    note: "Internal default for daily/session market validation, not a realtime claim.",
  },
  financial_statement: {
    maxAgeDays: 150,
    note: "Internal default for quarterly statement freshness.",
  },
  valuation: {
    maxAgeDays: 30,
    note: "Internal default because valuation inputs depend on market price and financial inputs.",
  },
  macro: {
    maxAgeDays: 120,
    note: "Internal default across monthly/quarterly macro indicators.",
  },
  industry: {
    maxAgeDays: 365,
    note: "Internal default for taxonomy and industry metrics.",
  },
  company_profile: {
    maxAgeDays: 180,
    note: "Internal default for profile review cadence.",
  },
  risk: {
    maxAgeDays: 30,
    note: "Internal default for derived risk assessment inputs.",
  },
};

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export const checkStaleByDataGroup = (
  asOf: string | null | undefined,
  dataGroup: DataGroup,
  now = new Date(),
): StaleCheckResult => {
  const threshold = DEFAULT_STALE_THRESHOLDS[dataGroup];

  if (!asOf) {
    return {
      isStale: true,
      ageDays: null,
      threshold,
      reason: "Missing asOf cannot be silently replaced with the current date.",
    };
  }

  const asOfDate = new Date(asOf);
  if (Number.isNaN(asOfDate.getTime())) {
    return {
      isStale: true,
      ageDays: null,
      threshold,
      reason: "Invalid asOf date cannot be used for freshness checks.",
    };
  }

  const ageDays = Math.floor((now.getTime() - asOfDate.getTime()) / millisecondsPerDay);

  return {
    isStale: ageDays > threshold.maxAgeDays,
    ageDays,
    threshold,
    reason: ageDays > threshold.maxAgeDays ? `Data is older than ${threshold.maxAgeDays} days.` : null,
  };
};

