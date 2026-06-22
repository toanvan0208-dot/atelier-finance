import { businessCompanyProfiles } from "../data/businessCompanyProfiles.data";
import type { BusinessCompanyProfile } from "../types";

export function normalizeBusinessTicker(ticker: string | null | undefined) {
  const normalized = ticker?.trim().toUpperCase();
  return normalized || null;
}

export function getBusinessTickerFromSearch(search: string) {
  return normalizeBusinessTicker(new URLSearchParams(search).get("ticker"));
}

export function findBusinessCompanyProfile(
  ticker: string | null | undefined
): BusinessCompanyProfile | null {
  const normalized = normalizeBusinessTicker(ticker);
  if (!normalized) return null;

  return businessCompanyProfiles[normalized as keyof typeof businessCompanyProfiles] ?? null;
}

export function formatBusinessProfileField(value: string | null | undefined) {
  return value?.trim() ? value : "Chưa đủ dữ liệu";
}
