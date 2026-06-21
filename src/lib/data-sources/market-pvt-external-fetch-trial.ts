import {
  runMarketPvtSafeImportMvp,
  type MarketPvtSafeImportDb,
  type MarketPvtSafeImportResult,
} from "./market-pvt-safe-import-mvp";
import { isLocalImportsEnabled } from "../config/local-imports-access";
import { buildLocalImportAuditResult } from "./local-import-audit-trail";

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
  /** Explicit as-of date for the normalized import metadata. */
  asOf?: string;
  /** Phase 101: write only when explicitly confirmed and the Phase 99 guard is enabled. */
  confirmWrite?: boolean;
  /** Optional local/dev DB URL and DB dependency used by the existing safe import pipeline. */
  databaseUrl?: string;
  db?: MarketPvtSafeImportDb;
  /** Injectable only to verify delegation to the existing Phase 96 pipeline. */
  importRunner?: typeof runMarketPvtSafeImportMvp;
};

/**
 * Phase 100/101: Controlled Market/PVT External Fetch Trial.
 *
 * 1. Fetches candidate data via injectable fetcher.
 * 2. Normalizes it into the Phase 96 Market/PVT CSV format.
 * 3. Pipes it through the existing safe import MVP.
 * 4. Defaults to dry-run. A write requires explicit confirmation plus the Phase 99 guard.
 * 5. Returns the Phase 97 audit result.
 */
export const runMarketPvtExternalFetchTrial = async ({
  ticker,
  fetcher,
  sourceLabel = "external_trial_candidate",
  currency = "VND",
  priceUnit = "vnd_per_share",
  volumeUnit = "shares",
  asOf,
  confirmWrite = false,
  databaseUrl,
  db,
  importRunner = runMarketPvtSafeImportMvp,
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

  const normalizedAsOf = asOf ?? new Date().toISOString().slice(0, 10);

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
      normalizedAsOf,
    ].join(",");
  });

  const csvText = [headers.join(","), ...csvRows].join("\n");

  // 3. Always validate through the existing Phase 96 import pipeline.
  // Default and guard-disabled calls remain no-write dry runs.
  if (!confirmWrite || !isLocalImportsEnabled()) {
    const preview = await importRunner({
      csvText,
      dryRun: true,
      confirmWrite: false,
    });

    if (!confirmWrite) return preview;

    const guardError = "local_imports_disabled";
    const blockedSummary = {
      ...preview.summary,
      dryRun: false,
      errors: [...preview.summary.errors, guardError],
      warnings: [
        ...preview.summary.warnings,
        "Confirmed external Market/PVT local write was blocked by the local import access guard.",
      ],
    };

    return {
      ...preview,
      audit: buildLocalImportAuditResult({
        blocked: true,
        confirmWrite: true,
        dryRun: false,
        importType: "market_pvt",
        sourceKind: "local_research",
        sourceLabel,
        summary: {
          ...blockedSummary,
          duplicateRows: preview.audit.duplicateSkippedRows,
        },
        tickers: preview.acceptedRows.map((row) => row.ticker),
      }),
      dryRun: false,
      status: "import_rejected",
      summary: blockedSummary,
    };
  }

  return importRunner({
    csvText,
    confirmWrite: true,
    databaseUrl,
    db,
  });
};
