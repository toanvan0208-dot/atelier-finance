import {
  normalizeVnstockFinancialsCandidate,
  type RawVnstockFinancialField,
  type VnstockFinancialsCandidateRow,
} from "./vnstock-financials-candidate";

export const VNSTOCK_FINANCIALS_PROBE_TICKERS = [
  "FPT",
  "MWG",
  "VNM",
  "HPG",
  "VCB",
  "MSN",
] as const;

export type VnstockFinancialsProbeTicker =
  (typeof VNSTOCK_FINANCIALS_PROBE_TICKERS)[number];

export type VnstockFinancialsApiShape = {
  provider: string;
  method: string;
  available: boolean;
  shape: [number, number] | null;
  columns: string[];
};

export type RawVnstockFinancialsProbeTickerResult = {
  ticker: string;
  apiShape: VnstockFinancialsApiShape[];
  fields: RawVnstockFinancialField[];
  errors: string[];
};

export type RawVnstockFinancialsProbePayload = {
  packageVersion: string | null;
  fiscalYear: number;
  tickers: RawVnstockFinancialsProbeTickerResult[];
};

export type VnstockFinancialsPreviewTickerResult =
  RawVnstockFinancialsProbeTickerResult & {
    candidates: VnstockFinancialsCandidateRow[];
  };

export type VnstockFinancialsPreviewReport = {
  mode: "preview_only";
  liveProbeExecuted: true;
  packageVersion: string | null;
  fiscalYear: number;
  sourceLabel: "vnstock_financials_candidate";
  dataMode: "research_only";
  productionApproved: false;
  databaseWriteAttempted: false;
  tickers: VnstockFinancialsPreviewTickerResult[];
};

const OUTPUT_MARKER = "ATELIER_VNSTOCK_FINANCIALS_JSON=";

const PYTHON_FINANCIALS_PROBE = String.raw`
import importlib.metadata
import json
import math
import sys

tickers = json.loads(sys.argv[1])
fiscal_year = str(sys.argv[2])

TARGET_KEYS = {
    "eps_basic_vnd",
    "earnings_per_share_vnd",
    "total_debt",
    "total_borrowings",
    "interest_bearing_debt",
    "short_term_borrowings",
    "long_term_borrowings",
    "liabilities",
    "total_liabilities",
}

def clean(value):
    if value is None:
        return None
    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            pass
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value)

payload = {
    "packageVersion": importlib.metadata.version("vnstock"),
    "fiscalYear": int(fiscal_year),
    "tickers": [],
}

try:
    from vnstock import Company, Finance
except Exception as error:
    print("${OUTPUT_MARKER}" + json.dumps({
        "packageVersion": payload["packageVersion"],
        "fiscalYear": int(fiscal_year),
        "tickers": [],
        "fatalError": type(error).__name__ + ": " + str(error),
    }, ensure_ascii=True))
    raise SystemExit(0)

for ticker in tickers:
    result = {"ticker": ticker, "apiShape": [], "fields": [], "errors": []}

    try:
        finance = Finance(
            source="VCI",
            symbol=ticker,
            period="year",
            get_all=True,
            show_log=False,
        )
        for method_name in ("income_statement", "balance_sheet"):
            method = getattr(finance, method_name, None)
            if not callable(method):
                result["apiShape"].append({
                    "provider": "VCI",
                    "method": method_name,
                    "available": False,
                    "shape": None,
                    "columns": [],
                })
                continue
            try:
                frame = method()
                columns = [str(column) for column in frame.columns]
                result["apiShape"].append({
                    "provider": "VCI",
                    "method": method_name,
                    "available": True,
                    "shape": [int(frame.shape[0]), int(frame.shape[1])],
                    "columns": columns,
                })
                if "item_id" not in columns or fiscal_year not in columns:
                    result["errors"].append(
                        method_name + ": item_id or requested fiscal-year column unavailable"
                    )
                    continue
                for _, row in frame.iterrows():
                    raw_key = str(row.get("item_id", "")).strip().lower()
                    if raw_key not in TARGET_KEYS:
                        continue
                    unit = "vnd_per_share" if raw_key in {
                        "eps_basic_vnd", "earnings_per_share_vnd"
                    } else "unknown"
                    result["fields"].append({
                        "provider": "VCI",
                        "method": method_name,
                        "rawKey": raw_key,
                        "value": clean(row.get(fiscal_year)),
                        "period": fiscal_year,
                        "asOf": None,
                        "unit": unit,
                        "label": clean(row.get("item_en") or row.get("item")),
                    })
            except Exception as error:
                result["errors"].append(
                    method_name + ": " + type(error).__name__ + ": " + str(error)
                )
    except Exception as error:
        result["errors"].append(
            "Finance: " + type(error).__name__ + ": " + str(error)
        )

    try:
        company = Company(source="KBS", symbol=ticker, show_log=False)
        overview_method = getattr(company, "overview", None)
        if not callable(overview_method):
            result["apiShape"].append({
                "provider": "KBS",
                "method": "overview",
                "available": False,
                "shape": None,
                "columns": [],
            })
        else:
            frame = overview_method()
            columns = [str(column) for column in frame.columns]
            result["apiShape"].append({
                "provider": "KBS",
                "method": "overview",
                "available": True,
                "shape": [int(frame.shape[0]), int(frame.shape[1])],
                "columns": columns,
            })
            if len(frame.index) > 0 and "outstanding_shares" in columns:
                row = frame.iloc[0]
                as_of = clean(row.get("as_of_date")) if "as_of_date" in columns else None
                result["fields"].append({
                    "provider": "KBS",
                    "method": "overview",
                    "rawKey": "outstanding_shares",
                    "value": clean(row.get("outstanding_shares")),
                    "period": str(as_of)[:4] if as_of else None,
                    "asOf": as_of,
                    "unit": "shares",
                    "label": "Outstanding shares",
                })
    except Exception as error:
        result["errors"].append(
            "overview: " + type(error).__name__ + ": " + str(error)
        )

    payload["tickers"].append(result)

print("${OUTPUT_MARKER}" + json.dumps(payload, ensure_ascii=True))
`;

const controlledTickers = (tickers: string[]): VnstockFinancialsProbeTicker[] => {
  const normalized = Array.from(
    new Set(tickers.map((ticker) => ticker.trim().toUpperCase())),
  );
  if (normalized.length === 0) throw new Error("vnstock_financials_ticker_required");
  if (
    normalized.some(
      (ticker) =>
        !VNSTOCK_FINANCIALS_PROBE_TICKERS.includes(
          ticker as VnstockFinancialsProbeTicker,
        ),
    )
  ) {
    throw new Error("vnstock_financials_ticker_not_allowed");
  }
  return normalized as VnstockFinancialsProbeTicker[];
};

export const fetchLocalPythonVnstockFinancials = async ({
  tickers,
  fiscalYear,
}: {
  tickers: string[];
  fiscalYear: number;
}): Promise<RawVnstockFinancialsProbePayload> => {
  const { execFile } = await import("node:child_process");
  const pythonExecutable = process.env.ATELIER_VNSTOCK_PYTHON?.trim() || "python";
  const stdout = await new Promise<string>((resolve, reject) => {
    execFile(
      pythonExecutable,
      ["-c", PYTHON_FINANCIALS_PROBE, JSON.stringify(tickers), String(fiscalYear)],
      { maxBuffer: 5_000_000, timeout: 300_000, windowsHide: true },
      (error, output) => {
        if (error) reject(error);
        else resolve(output);
      },
    );
  });
  const payloadLine = stdout
    .split(/\r?\n/)
    .find((line) => line.startsWith(OUTPUT_MARKER));
  if (!payloadLine) throw new Error("vnstock_financials_probe_output_missing");

  const parsed = JSON.parse(payloadLine.slice(OUTPUT_MARKER.length)) as
    | (RawVnstockFinancialsProbePayload & { fatalError?: string })
    | null;
  if (!parsed || !Array.isArray(parsed.tickers)) {
    throw new Error("vnstock_financials_probe_output_invalid");
  }
  if (parsed.fatalError) {
    throw new Error(`vnstock_financials_probe_failed: ${parsed.fatalError}`);
  }
  return parsed;
};

export const runVnstockFinancialsPreview = async ({
  tickers,
  fiscalYear,
  allowNetwork = false,
  fetchProbe = fetchLocalPythonVnstockFinancials,
}: {
  tickers: string[];
  fiscalYear: number;
  allowNetwork?: boolean;
  fetchProbe?: (input: {
    tickers: string[];
    fiscalYear: number;
  }) => Promise<RawVnstockFinancialsProbePayload>;
}): Promise<VnstockFinancialsPreviewReport> => {
  if (!allowNetwork) throw new Error("vnstock_financials_network_not_enabled");
  if (!Number.isInteger(fiscalYear) || fiscalYear < 2000 || fiscalYear > 2100) {
    throw new Error("vnstock_financials_fiscal_year_invalid");
  }

  const allowedTickers = controlledTickers(tickers);
  const raw = await fetchProbe({ tickers: allowedTickers, fiscalYear });

  return {
    mode: "preview_only",
    liveProbeExecuted: true,
    packageVersion: raw.packageVersion,
    fiscalYear,
    sourceLabel: "vnstock_financials_candidate",
    dataMode: "research_only",
    productionApproved: false,
    databaseWriteAttempted: false,
    tickers: raw.tickers.map((tickerResult) => ({
      ...tickerResult,
      candidates: normalizeVnstockFinancialsCandidate({
        ticker: tickerResult.ticker,
        fields: tickerResult.fields,
      }),
    })),
  };
};
