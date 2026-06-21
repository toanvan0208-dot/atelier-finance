import {
  runMarketPvtExternalFetchTrial,
  type ExternalMarketCandidateRow,
  type MarketPvtExternalFetchTrialOptions,
} from "./market-pvt-external-fetch-trial";
import type { MarketPvtSafeImportResult } from "./market-pvt-safe-import-mvp";

export type ControlledMarketPvtProviderRequest = {
  ticker: string;
  from: string;
  to: string;
};

export type ControlledMarketPvtProviderObservation = {
  ticker: string;
  tradingDate: string;
  closePrice: number | null;
  volume: number | null;
};

export type ControlledMarketPvtProviderResponse = {
  ticker: string;
  asOf: string;
  sourceLabel: string;
  currency: string;
  priceUnit: string;
  volumeUnit: string;
  observations: ControlledMarketPvtProviderObservation[];
};

export type ControlledMarketPvtProviderFetcher = (
  request: ControlledMarketPvtProviderRequest,
) => Promise<ControlledMarketPvtProviderResponse>;

export type ControlledMarketPvtProviderNormalization = {
  request: ControlledMarketPvtProviderRequest;
  candidateRows: ExternalMarketCandidateRow[];
  asOf: string;
  sourceLabel: string;
  currency: string;
  priceUnit: string;
  volumeUnit: string;
  productionApproved: false;
  errors: string[];
};

export type RunControlledMarketPvtProviderOptions = ControlledMarketPvtProviderRequest &
  Pick<
    MarketPvtExternalFetchTrialOptions,
    "confirmWrite" | "databaseUrl" | "db" | "importRunner"
  > & {
    fetcher: ControlledMarketPvtProviderFetcher;
  };

const MAX_RANGE_DAYS = 31;
const MAX_PROVIDER_OBSERVATIONS = 31;
const SAFE_SOURCE_LABEL = /^(provider_candidate|research_external_candidate|local_external_candidate)(?:[_-][a-z0-9_-]+)?$/;

const dateOnly = (value: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === value ? value : null;
};

const validateRequest = (request: ControlledMarketPvtProviderRequest): ControlledMarketPvtProviderRequest => {
  const ticker = request.ticker.trim().toUpperCase();
  const from = dateOnly(request.from);
  const to = dateOnly(request.to);

  if (!ticker || !/^[A-Z0-9._-]{1,12}$/.test(ticker)) {
    throw new Error("controlled_provider_ticker_invalid");
  }
  if (!from || !to || from > to) {
    throw new Error("controlled_provider_date_range_invalid");
  }

  const rangeDays = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    throw new Error("controlled_provider_date_range_too_large");
  }

  return { ticker, from, to };
};

export const normalizeControlledMarketPvtProviderResponse = (
  requestInput: ControlledMarketPvtProviderRequest,
  response: ControlledMarketPvtProviderResponse,
): ControlledMarketPvtProviderNormalization => {
  const request = validateRequest(requestInput);
  const responseTicker = response.ticker.trim().toUpperCase();
  const errors: string[] = [];
  const asOf = dateOnly(response.asOf) ?? "";
  const sourceLabel = response.sourceLabel.trim();

  if (responseTicker !== request.ticker) errors.push("controlled_provider_response_ticker_mismatch");
  if (!asOf) errors.push("controlled_provider_as_of_invalid");
  if (!SAFE_SOURCE_LABEL.test(sourceLabel)) errors.push("controlled_provider_source_label_invalid");
  const observationCountAccepted = response.observations.length <= MAX_PROVIDER_OBSERVATIONS;
  if (!observationCountAccepted) errors.push("controlled_provider_observation_count_exceeded");

  const candidateRows = response.observations.map((observation) => {
    const observationTicker = observation.ticker.trim().toUpperCase();
    const tradingDate = dateOnly(observation.tradingDate);
    const tickerMatches = observationTicker === request.ticker && responseTicker === request.ticker;
    const dateInRange = tradingDate !== null && tradingDate >= request.from && tradingDate <= request.to;

    if (!tickerMatches) errors.push("controlled_provider_observation_ticker_mismatch");
    if (!dateInRange) errors.push("controlled_provider_observation_date_out_of_range");

    return {
      symbol: tickerMatches ? observationTicker : "",
      timestamp: dateInRange ? tradingDate : "",
      close_price: observationCountAccepted ? observation.closePrice : null,
      volume_shares: observation.volume,
    };
  });

  return {
    request,
    candidateRows,
    asOf,
    sourceLabel: SAFE_SOURCE_LABEL.test(sourceLabel) ? sourceLabel : "",
    currency: response.currency.trim(),
    priceUnit: asOf ? response.priceUnit.trim() : "",
    volumeUnit: response.volumeUnit.trim(),
    productionApproved: false,
    errors: Array.from(new Set(errors)),
  };
};

/**
 * Controlled single-ticker provider boundary. The injected fetcher may later call
 * one reviewed endpoint, but this adapter itself has no network or DB write path.
 */
export const runControlledMarketPvtProviderImport = async ({
  ticker,
  from,
  to,
  fetcher,
  confirmWrite,
  databaseUrl,
  db,
  importRunner,
}: RunControlledMarketPvtProviderOptions): Promise<MarketPvtSafeImportResult> => {
  const request = validateRequest({ ticker, from, to });
  const response = await fetcher(request);
  const normalized = normalizeControlledMarketPvtProviderResponse(request, response);

  return runMarketPvtExternalFetchTrial({
    ticker: request.ticker,
    fetcher: async () => normalized.candidateRows,
    sourceLabel: normalized.sourceLabel,
    currency: normalized.currency,
    priceUnit: normalized.priceUnit,
    volumeUnit: normalized.volumeUnit,
    asOf: normalized.asOf,
    confirmWrite,
    databaseUrl,
    db,
    importRunner,
  });
};
