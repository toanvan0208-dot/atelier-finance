import type { DataMode } from "../../../generated/prisma/client";

export type ServiceOptions = {
  dataMode?: DataMode;
  includeBlocked?: boolean;
  limit?: number;
};

export const normalizeTicker = (ticker: string): string => ticker.trim().toUpperCase();

export const safeLimit = (limit: number | undefined, fallback: number): number => {
  if (!limit || !Number.isInteger(limit) || limit <= 0) return fallback;
  return Math.min(limit, 250);
};
