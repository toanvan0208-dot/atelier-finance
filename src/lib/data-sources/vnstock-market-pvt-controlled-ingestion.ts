import {
  runControlledMarketPvtProviderImport,
  type ControlledMarketPvtProviderRequest,
  type ControlledMarketPvtProviderResponse,
  type RunControlledMarketPvtProviderOptions,
} from "./market-pvt-controlled-provider-adapter";
import type { MarketPvtSafeImportResult } from "./market-pvt-safe-import-mvp";

export const CONTROLLED_VNSTOCK_TICKERS = ["FPT", "MWG", "VNM"] as const;
export const VNSTOCK_RESEARCH_SOURCE_LABEL = "vnstock_research_candidate";
export const VNSTOCK_INSECURE_SSL_BYPASS_ENV_KEY = "ATELIER_ALLOW_INSECURE_VNSTOCK_SSL_BYPASS";

export type ControlledVnstockTicker = (typeof CONTROLLED_VNSTOCK_TICKERS)[number];

export type RawVnstockHistoryRow = {
  ticker?: string | null;
  time?: string | null;
  close?: string | number | null;
  volume?: string | number | null;
};

export type ControlledVnstockHistoryFetcher = (
  request: ControlledMarketPvtProviderRequest,
) => Promise<RawVnstockHistoryRow[]>;

export type ControlledVnstockUnitMetadata = {
  currency: string;
  priceUnit: string;
  volumeUnit: string;
};

export type RunControlledVnstockMarketPvtOptions = ControlledMarketPvtProviderRequest &
  Pick<
    RunControlledMarketPvtProviderOptions,
    "confirmWrite" | "databaseUrl" | "db" | "importRunner"
  > & {
    fetchHistory?: ControlledVnstockHistoryFetcher;
    allowNetwork?: boolean;
    unitMetadata?: ControlledVnstockUnitMetadata;
  };

export type ControlledVnstockMarketPvtBatchResult = {
  ticker: ControlledVnstockTicker;
  result: MarketPvtSafeImportResult;
};

export type RunControlledVnstockMarketPvtBatchOptions = Omit<
  RunControlledVnstockMarketPvtOptions,
  "ticker"
> & {
  tickers: string[];
};

const VNSTOCK_QUOTED_PRICE_TO_VND = 1_000;
const LIVE_OUTPUT_MARKER = "ATELIER_VNSTOCK_JSON=";
const DEFAULT_VNSTOCK_UNITS: ControlledVnstockUnitMetadata = {
  currency: "VND",
  priceUnit: "vnd_per_share",
  volumeUnit: "shares",
};

export const shouldAllowInsecureVnstockSslBypass = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean => env[VNSTOCK_INSECURE_SSL_BYPASS_ENV_KEY] === "true";

const nullableNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const controlledTicker = (ticker: string): ControlledVnstockTicker => {
  const normalized = ticker.trim().toUpperCase();
  if (!CONTROLLED_VNSTOCK_TICKERS.includes(normalized as ControlledVnstockTicker)) {
    throw new Error("controlled_vnstock_ticker_not_allowed");
  }
  return normalized as ControlledVnstockTicker;
};

export const normalizeVnstockHistoryResponse = (
  request: ControlledMarketPvtProviderRequest,
  rows: RawVnstockHistoryRow[],
  unitMetadata: ControlledVnstockUnitMetadata = DEFAULT_VNSTOCK_UNITS,
): ControlledMarketPvtProviderResponse => {
  const ticker = controlledTicker(request.ticker);

  return {
    ticker,
    asOf: request.to,
    sourceLabel: VNSTOCK_RESEARCH_SOURCE_LABEL,
    currency: unitMetadata.currency,
    priceUnit: unitMetadata.priceUnit,
    volumeUnit: unitMetadata.volumeUnit,
    observations: rows.map((row) => {
      const close = nullableNumber(row.close);
      return {
        ticker: (row.ticker ?? ticker).trim().toUpperCase(),
        tradingDate: row.time?.slice(0, 10) ?? "",
        // Vnstock's Vietnam equity history contract quotes price in thousand VND.
        // Conversion is explicit provider metadata, never inferred from magnitude.
        closePrice: close === null ? null : close * VNSTOCK_QUOTED_PRICE_TO_VND,
        volume: nullableNumber(row.volume),
      };
    }),
  };
};

const PYTHON_HISTORY_SCRIPT = String.raw`
import json
import math
import sys

allow_insecure_ssl_bypass = sys.argv[4] == "true"
if allow_insecure_ssl_bypass:
    import requests
    original_request = requests.Session.request
    def patched_request(*args, **kwargs):
        kwargs["verify"] = False
        return original_request(*args, **kwargs)
    requests.Session.request = patched_request
    requests.packages.urllib3.disable_warnings()

from vnstock.api.quote import Quote


ticker, start, end = sys.argv[1:4]
frame = Quote(symbol=ticker, source="VCI", show_log=False).history(
    start=start,
    end=end,
    interval="1D",
)


def clean(value):
    if value is None:
        return None
    if hasattr(value, "item"):
        value = value.item()
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value

rows = []
for record in frame.to_dict(orient="records"):
    raw_time = record.get("time")
    date = raw_time.isoformat()[:10] if hasattr(raw_time, "isoformat") else str(raw_time)[:10]
    if date < start or date > end:
        continue
    rows.append({
        "ticker": ticker,
        "time": date,
        "close": clean(record.get("close")),
        "volume": clean(record.get("volume")),
    })

print("${LIVE_OUTPUT_MARKER}" + json.dumps(rows, ensure_ascii=True))
`;

/** Opt-in local client for the installed Python vnstock package. Never called by tests/build. */
export const fetchLocalPythonVnstockHistory: ControlledVnstockHistoryFetcher = async (request) => {
  const { execFile } = await import("node:child_process");
  const pythonExecutable = process.env.ATELIER_VNSTOCK_PYTHON?.trim() || "python";
  const allowInsecureSslBypass = shouldAllowInsecureVnstockSslBypass();

  if (allowInsecureSslBypass) {
    console.warn(
      `[security] VNStock SSL verification bypass enabled by ${VNSTOCK_INSECURE_SSL_BYPASS_ENV_KEY} for this local Python subprocess.`,
    );
  }

  const stdout = await new Promise<string>((resolve, reject) => {
    execFile(
      pythonExecutable,
      ["-c", PYTHON_HISTORY_SCRIPT, request.ticker, request.from, request.to, String(allowInsecureSslBypass)],
      { maxBuffer: 1_000_000, timeout: 60_000, windowsHide: true },
      (error, output) => {
        if (error) reject(error);
        else resolve(output);
      },
    );
  });

  const payloadLine = stdout
    .split(/\r?\n/)
    .find((line) => line.startsWith(LIVE_OUTPUT_MARKER));
  if (!payloadLine) throw new Error("vnstock_local_client_output_missing");

  const parsed = JSON.parse(payloadLine.slice(LIVE_OUTPUT_MARKER.length)) as unknown;
  if (!Array.isArray(parsed)) throw new Error("vnstock_local_client_output_invalid");
  return parsed as RawVnstockHistoryRow[];
};

export const runControlledVnstockMarketPvtIngestion = async ({
  ticker,
  from,
  to,
  fetchHistory = fetchLocalPythonVnstockHistory,
  allowNetwork = process.env.VNSTOCK_RESEARCH_ALLOW_NETWORK === "true",
  unitMetadata = DEFAULT_VNSTOCK_UNITS,
  confirmWrite,
  databaseUrl,
  db,
  importRunner,
}: RunControlledVnstockMarketPvtOptions): Promise<MarketPvtSafeImportResult> => {
  const allowedTicker = controlledTicker(ticker);
  if (!allowNetwork) throw new Error("controlled_vnstock_network_not_enabled");

  return runControlledMarketPvtProviderImport({
    ticker: allowedTicker,
    from,
    to,
    fetcher: async (request) =>
      normalizeVnstockHistoryResponse(request, await fetchHistory(request), unitMetadata),
    confirmWrite,
    databaseUrl,
    db,
    importRunner,
  });
};

export const runControlledVnstockMarketPvtIngestionBatch = async ({
  tickers,
  ...options
}: RunControlledVnstockMarketPvtBatchOptions): Promise<ControlledVnstockMarketPvtBatchResult[]> => {
  const normalizedTickers = Array.from(new Set(tickers.map(controlledTicker)));
  if (normalizedTickers.length === 0) throw new Error("controlled_vnstock_ticker_required");
  if (normalizedTickers.length > CONTROLLED_VNSTOCK_TICKERS.length) {
    throw new Error("controlled_vnstock_ticker_set_too_large");
  }

  const results: ControlledVnstockMarketPvtBatchResult[] = [];
  for (const ticker of normalizedTickers) {
    const result = await runControlledVnstockMarketPvtIngestion({
      ...options,
      ticker,
    });
    results.push({ ticker, result });
  }
  return results;
};
