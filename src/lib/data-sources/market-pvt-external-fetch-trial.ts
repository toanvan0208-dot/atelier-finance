import {
  runMarketPvtSafeImportMvp,
  type MarketPvtSafeImportResult,
} from "./market-pvt-safe-import-mvp";

/**
 * The explicit candidate shape expected from the external source.
 * This represents exactly one controlled endpoint/candidate format.
 */
export type ExternalMarketCandidateRow = {
  symbol: string;         // mapped to ticker
  timestamp: string;      // mapped to tradingDate
  close_price: number;    // mapped to closePrice
  volume_shares: number;  // mapped to volume
};

/**
 * An injectable fetcher for the external candidate endpoint.
 * In a real production crawler, this would call the actual URL.
 * Here, we use it for controlled dry-run trials.
 */
export type ExternalMarketCandidateFetcher = (
  ticker: string,
) => Promise<ExternalMarketCandidateRow[]>;

export type MarketPvtExternalFetchTrialOptions = {
  ticker: string;
  fetcher: ExternalMarketCandidateFetcher;
  /** Explicit source label to preserve provenance. */
  sourceLabel?: string;
  /** The currency of the fetched close_price. */
  currency?: string;
  /** The unit of the fetched close_price (e.g., VND). */
  priceUnit?: string;
  /** The unit of the fetched volume (e.g., share). */
  volumeUnit?: string;
};

/**
 * Phase 100: Controlled Market/PVT External Fetch Trial.
 *
 * 1. Fetches candidate data via injectable fetcher.
 * 2. Normalizes it into the Phase 96 Market/PVT CSV format.
 * 3. Pipes it through the existing safe import MVP.
 * 4. STRICTLY dry-run only. Writes zero DB rows.
 * 5. Returns the Phase 97 audit result.
 */
export const runMarketPvtExternalFetchTrial = async ({
  ticker,
  fetcher,
  sourceLabel = "external_trial_candidate",
  currency = "VND",
  priceUnit = "vnd_per_share",
  volumeUnit = "shares",
}: MarketPvtExternalFetchTrialOptions): Promise<MarketPvtSafeImportResult> => {
  // 1. Fetch raw data from the controlled external candidate
  const rawData = await fetcher(ticker);

  // 2. Normalize to the existing Market/PVT import-compatible CSV text.
  // We explicitly map the candidate fields to the required import fields.
  // We explicitly include source and unit metadata to ensure the import
  // pipeline preserves them and subjects them to its unit validation rules.
  const headers = [
    "ticker",
    "tradingDate",
    "closePrice",
    "volume",
    "currency",
    "priceUnit",
    "volumeUnit",
    "source",
    "asOf",
  ];

  const nowAsOf = new Date().toISOString().slice(0, 10);

  const csvRows = rawData.map((row) => {
    return [
      row.symbol,
      row.timestamp,
      row.close_price,
      row.volume_shares,
      currency,
      priceUnit,
      volumeUnit,
      sourceLabel,
      nowAsOf,
    ].join(",");
  });

  const csvText = [headers.join(","), ...csvRows].join("\n");

  // 3. Pipe through the existing Phase 96 import pipeline.
  // Hardcoded to dry-run only, confirmWrite is strictly false.
  // This guarantees zero DB writes while running full validation and generating the audit result.
  return runMarketPvtSafeImportMvp({
    csvText,
    dryRun: true,
    confirmWrite: false,
  });
};
