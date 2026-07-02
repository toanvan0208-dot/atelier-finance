import { execFile } from "node:child_process";

export type ProviderSnapshotMetricCode = "pe" | "pb" | "liquidity" | "closePrice";
export type ScreeningSnapshotTicker = "HSG" | "NKG";

export type ProviderSnapshotMetric = {
  ticker: ScreeningSnapshotTicker;
  metricCode: ProviderSnapshotMetricCode;
  value: number | null;
  unit: "ratio" | "vnd" | "shares" | "vnd_trading_value";
  periodType: "market_snapshot" | "provider_ratio_snapshot";
  providerPeriod?: string | null;
  snapshotDate: string | null;
  nearestTradingDate: string | null;
  sourceLabel: string;
  sourceUrl?: string | null;
  sourceType: "provider_snapshot";
  retrievedAt: string | null;
  providerDefinitionKnown: boolean;
  extractedQuote: string | null;
  reviewNote: string;
  warningCodes: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
  staleAfterDays: 1 | 7;
  refreshPolicy: "manual_or_provider_refresh";
};

export type ProviderSnapshotPackage = {
  ticker: ScreeningSnapshotTicker;
  coverageLevel: "screening_candidate";
  screeningEligible: true;
  analysisEligible: false;
  providerSnapshotSource: "VNStock";
  metrics: Record<ProviderSnapshotMetricCode, ProviderSnapshotMetric>;
};

export type ScreeningVnstockSnapshotFetchResult = {
  ticker: ScreeningSnapshotTicker;
  attempted: boolean;
  succeeded: boolean;
  sourceLabel: "VNStock";
  retrievedAt: string;
  warningCodes: string[];
  errorSummary: string | null;
  data: {
    pe: number | null;
    pb: number | null;
    liquidity: number | null;
    liquidityProxy: "volume" | "averageTradingValue" | "tradingValue" | "unknown";
    closePrice: number | null;
    snapshotDate: string | null;
    nearestTradingDate: string | null;
    providerDefinitionKnown: {
      pe: boolean;
      pb: boolean;
      liquidity: boolean;
      closePrice: boolean;
    };
  };
};

export type ScreeningVnstockFundamentalRatioFetchResult = {
  ticker: ScreeningSnapshotTicker;
  attempted: boolean;
  succeeded: boolean;
  sourceLabel: "VNStock Fundamental equity ratio";
  retrievedAt: string;
  warningCodes: string[];
  errorSummary: string | null;
  data: {
    pe: number | null;
    providerPeriod: string | null;
    providerColumn: string | null;
    itemLabel: string | null;
    extractedQuote: string | null;
    providerDefinitionKnown: boolean;
  };
};

export const SCREENING_VNSTOCK_FETCH_ENV_KEY = "ATELIER_SCREENING_VNSTOCK_FETCH_DRY_RUN";
export const SCREENING_VNSTOCK_RATIO_FETCH_ENV_KEY = "ATELIER_SCREENING_VNSTOCK_RATIO_FETCH_DRY_RUN";
const ALLOWED_SCREENING_SNAPSHOT_TICKERS = ["HSG", "NKG"] as const;
const FUNDAMENTAL_RATIO_TICKERS = ["HSG"] as const;
const TODAY = "2026-07-02";
const FETCH_FROM = "2026-06-25";
const FETCH_TO = TODAY;
const LIVE_OUTPUT_MARKER = "ATELIER_SCREENING_VNSTOCK_JSON=";
const RATIO_OUTPUT_MARKER = "ATELIER_SCREENING_VNSTOCK_RATIO_JSON=";
const PROVIDER_WARNING = "VNSTOCK_PROVIDER_SNAPSHOT_RESEARCH_ONLY";
const NOT_ATTEMPTED_WARNING = "PROVIDER_FETCH_NOT_ATTEMPTED";

type FundamentalRatioTicker = (typeof FUNDAMENTAL_RATIO_TICKERS)[number];

const PYTHON_SCREENING_SNAPSHOT_SCRIPT = String.raw`
import json
import math
import sys

ticker, start, end = sys.argv[1:4]
result = {
    "ticker": ticker,
    "pe": None,
    "pb": None,
    "liquidity": None,
    "liquidityProxy": "unknown",
    "closePrice": None,
    "snapshotDate": None,
    "nearestTradingDate": None,
    "providerDefinitionKnown": {
        "pe": False,
        "pb": False,
        "liquidity": False,
        "closePrice": False,
    },
    "warnings": [],
}

def clean(value):
    if value is None:
        return None
    if hasattr(value, "item"):
        value = value.item()
    if isinstance(value, float) and not math.isfinite(value):
        return None
    try:
        return float(value)
    except Exception:
        return None

try:
    from vnstock.api.quote import Quote
    frame = Quote(symbol=ticker, source="VCI", show_log=False).history(
        start=start,
        end=end,
        interval="1D",
    )
    rows = frame.to_dict(orient="records")
    usable = []
    for record in rows:
        raw_time = record.get("time")
        date = raw_time.isoformat()[:10] if hasattr(raw_time, "isoformat") else str(raw_time)[:10]
        if date < start or date > end:
            continue
        close = clean(record.get("close"))
        volume = clean(record.get("volume"))
        value = clean(record.get("value") or record.get("trading_value") or record.get("tradingValue"))
        usable.append({"date": date, "close": close, "volume": volume, "tradingValue": value})
    usable = [row for row in usable if row["date"]]
    usable.sort(key=lambda row: row["date"])
    if usable:
        latest = usable[-1]
        result["snapshotDate"] = latest["date"]
        result["nearestTradingDate"] = latest["date"]
        result["closePrice"] = latest["close"] * 1000 if latest["close"] is not None else None
        result["providerDefinitionKnown"]["closePrice"] = latest["close"] is not None
        if latest["tradingValue"] is not None:
            result["liquidity"] = latest["tradingValue"]
            result["liquidityProxy"] = "tradingValue"
            result["providerDefinitionKnown"]["liquidity"] = True
        elif latest["volume"] is not None:
            result["liquidity"] = latest["volume"]
            result["liquidityProxy"] = "volume"
            result["providerDefinitionKnown"]["liquidity"] = True
        else:
            result["warnings"].append("VNSTOCK_LIQUIDITY_VALUE_MISSING")
    else:
        result["warnings"].append("VNSTOCK_HISTORY_EMPTY")
except Exception as exc:
    result["warnings"].append("VNSTOCK_HISTORY_FETCH_FAILED: " + str(exc).split("\n")[0][:180])

print("${LIVE_OUTPUT_MARKER}" + json.dumps(result, ensure_ascii=True))
`;

const PYTHON_FUNDAMENTAL_RATIO_SCRIPT = String.raw`
import json
import math
import sys

symbol = sys.argv[1]
result = {
    "ticker": symbol,
    "pe": None,
    "providerPeriod": None,
    "providerColumn": None,
    "itemLabel": None,
    "extractedQuote": None,
    "providerDefinitionKnown": False,
    "warnings": [],
}

def clean_number(value):
    if value is None:
        return None
    if hasattr(value, "item"):
        value = value.item()
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, str):
        value = value.replace(",", "").strip()
        if not value or value.lower() in ("nan", "none", "null", "na", "n/a"):
            return None
    try:
        parsed = float(value)
        if math.isfinite(parsed):
            return parsed
    except Exception:
        return None
    return None

def norm_text(value):
    return str(value).strip().lower()

def period_label(column):
    return str(column).strip().replace("-q", "-Q").replace("_", "-")

try:
    try:
        from vnstock_data import Fundamental
        import_source = "vnstock_data"
    except Exception:
        from vnstock import Fundamental
        import_source = "vnstock"

    fa = Fundamental()
    equity = fa.equity(symbol=symbol)
    df = equity.ratio()
    columns = [str(column).strip() for column in list(df.columns)]
    lowered = [column.lower() for column in columns]
    if "item" not in lowered:
        result["warnings"].append("VNSTOCK_RATIO_ITEM_COLUMN_MISSING")
    else:
        item_column = columns[lowered.index("item")]
        row = None
        needles = [
            "p/e",
            "price to earnings",
            "price/earnings",
            "chi so gia thi truong tren thu nhap",
            "chỉ số giá thị trường trên thu nhập",
        ]
        for _, record in df.iterrows():
            item = str(record.get(item_column, "")).strip()
            comparable = norm_text(item)
            if any(needle in comparable for needle in needles):
                row = record
                result["itemLabel"] = item
                break
        if row is None:
            result["warnings"].append("VNSTOCK_RATIO_PE_ROW_MISSING")
        else:
            period_columns = [
                column for column in columns
                if column.lower() not in ("item", "item_id")
            ]
            for column in period_columns:
                value = clean_number(row.get(column))
                if value is not None:
                    result["pe"] = value
                    result["providerColumn"] = column
                    result["providerPeriod"] = period_label(column)
                    result["providerDefinitionKnown"] = True
                    result["extractedQuote"] = f'{result["itemLabel"]} ... {result["providerPeriod"]} ... {value:g}'
                    break
            if result["pe"] is None:
                result["warnings"].append("VNSTOCK_RATIO_PE_VALUE_MISSING")
    result["warnings"].append("VNSTOCK_RATIO_IMPORT_SOURCE:" + import_source)
except Exception as exc:
    result["warnings"].append("VNSTOCK_RATIO_FETCH_FAILED: " + str(exc).split("\n")[0][:180])

print("${RATIO_OUTPUT_MARKER}" + json.dumps(result, ensure_ascii=True))
`;

const isScreeningSnapshotTicker = (ticker: string): ticker is ScreeningSnapshotTicker =>
  ALLOWED_SCREENING_SNAPSHOT_TICKERS.includes(ticker.trim().toUpperCase() as ScreeningSnapshotTicker);

const nowIso = (): string => new Date().toISOString();

const nullableNumber = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
};

const compactWarning = (value: string): string => value.replace(/\s+/g, " ").slice(0, 220);

const missingFetchResult = ({
  ticker,
  attempted,
  retrievedAt,
  warningCodes,
  errorSummary,
}: {
  ticker: ScreeningSnapshotTicker;
  attempted: boolean;
  retrievedAt: string;
  warningCodes: string[];
  errorSummary: string | null;
}): ScreeningVnstockSnapshotFetchResult => ({
  ticker,
  attempted,
  succeeded: false,
  sourceLabel: "VNStock",
  retrievedAt,
  warningCodes,
  errorSummary,
  data: {
    pe: null,
    pb: null,
    liquidity: null,
    liquidityProxy: "unknown",
    closePrice: null,
    snapshotDate: null,
    nearestTradingDate: null,
    providerDefinitionKnown: {
      pe: false,
      pb: false,
      liquidity: false,
      closePrice: false,
    },
  },
});

export const shouldAttemptScreeningVnstockFetch = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean => env[SCREENING_VNSTOCK_FETCH_ENV_KEY] === "true";

export const shouldAttemptScreeningVnstockRatioFetch = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean => env[SCREENING_VNSTOCK_RATIO_FETCH_ENV_KEY] === "true";

export const fetchLocalPythonVnstockScreeningSnapshot = async (
  ticker: ScreeningSnapshotTicker,
  {
    pythonExecutable = process.env.ATELIER_VNSTOCK_PYTHON?.trim() || "python",
    retrievedAt = nowIso(),
  }: {
    pythonExecutable?: string;
    retrievedAt?: string;
  } = {},
): Promise<ScreeningVnstockSnapshotFetchResult> => {
  if (!isScreeningSnapshotTicker(ticker)) {
    throw new Error("screening_vnstock_snapshot_ticker_not_allowed");
  }

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      execFile(
        pythonExecutable,
        ["-c", PYTHON_SCREENING_SNAPSHOT_SCRIPT, ticker, FETCH_FROM, FETCH_TO],
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
    if (!payloadLine) throw new Error("screening_vnstock_output_missing");

    const parsed = JSON.parse(payloadLine.slice(LIVE_OUTPUT_MARKER.length)) as {
      pe?: unknown;
      pb?: unknown;
      liquidity?: unknown;
      liquidityProxy?: unknown;
      closePrice?: unknown;
      snapshotDate?: unknown;
      nearestTradingDate?: unknown;
      providerDefinitionKnown?: Partial<Record<ProviderSnapshotMetricCode, boolean>>;
      warnings?: unknown;
    };
    const warnings = Array.isArray(parsed.warnings)
      ? parsed.warnings.map((warning) => `VNSTOCK_FETCH_WARNING:${compactWarning(String(warning))}`)
      : [];
    const snapshotDate = typeof parsed.snapshotDate === "string" ? parsed.snapshotDate : null;
    const nearestTradingDate = typeof parsed.nearestTradingDate === "string" ? parsed.nearestTradingDate : null;
    const liquidityProxy =
      parsed.liquidityProxy === "volume" ||
      parsed.liquidityProxy === "averageTradingValue" ||
      parsed.liquidityProxy === "tradingValue"
        ? parsed.liquidityProxy
        : "unknown";
    const providerDefinitionKnown = parsed.providerDefinitionKnown ?? {};
    const closePrice = nullableNumber(parsed.closePrice);
    const liquidity = nullableNumber(parsed.liquidity);
    const pe = nullableNumber(parsed.pe);
    const pb = nullableNumber(parsed.pb);
    const succeeded = Boolean(snapshotDate ?? nearestTradingDate) && (closePrice !== null || liquidity !== null || pe !== null || pb !== null);

    return {
      ticker,
      attempted: true,
      succeeded,
      sourceLabel: "VNStock",
      retrievedAt,
      warningCodes: [
        PROVIDER_WARNING,
        "PROVIDER_FETCH_ATTEMPTED",
        "NEEDS_MANUAL_REVIEW",
        ...warnings,
        ...(succeeded ? [] : ["VNSTOCK_PROVIDER_SNAPSHOT_UNAVAILABLE"]),
      ],
      errorSummary: succeeded ? null : "VNStock fetch returned no eligible screening snapshot metric.",
      data: {
        pe,
        pb,
        liquidity,
        liquidityProxy,
        closePrice,
        snapshotDate,
        nearestTradingDate,
        providerDefinitionKnown: {
          pe: providerDefinitionKnown.pe === true,
          pb: providerDefinitionKnown.pb === true,
          liquidity: providerDefinitionKnown.liquidity === true,
          closePrice: providerDefinitionKnown.closePrice === true,
        },
      },
    };
  } catch (error) {
    return missingFetchResult({
      ticker,
      attempted: true,
      retrievedAt,
      warningCodes: [
        PROVIDER_WARNING,
        "PROVIDER_FETCH_ATTEMPTED",
        "VNSTOCK_PROVIDER_FETCH_FAILED",
        "NEEDS_MANUAL_REVIEW",
      ],
      errorSummary: compactWarning(error instanceof Error ? error.message : String(error)),
    });
  }
};

const isFundamentalRatioTicker = (ticker: string): ticker is FundamentalRatioTicker =>
  FUNDAMENTAL_RATIO_TICKERS.includes(ticker.trim().toUpperCase() as FundamentalRatioTicker);

const missingRatioFetchResult = ({
  ticker,
  attempted,
  retrievedAt,
  warningCodes,
  errorSummary,
}: {
  ticker: FundamentalRatioTicker;
  attempted: boolean;
  retrievedAt: string;
  warningCodes: string[];
  errorSummary: string | null;
}): ScreeningVnstockFundamentalRatioFetchResult => ({
  ticker,
  attempted,
  succeeded: false,
  sourceLabel: "VNStock Fundamental equity ratio",
  retrievedAt,
  warningCodes,
  errorSummary,
  data: {
    pe: null,
    providerPeriod: null,
    providerColumn: null,
    itemLabel: null,
    extractedQuote: null,
    providerDefinitionKnown: false,
  },
});

export const fetchLocalPythonVnstockFundamentalRatio = async (
  ticker: FundamentalRatioTicker,
  {
    pythonExecutable = process.env.ATELIER_VNSTOCK_PYTHON?.trim() || "python",
    retrievedAt = TODAY,
  }: {
    pythonExecutable?: string;
    retrievedAt?: string;
  } = {},
): Promise<ScreeningVnstockFundamentalRatioFetchResult> => {
  if (!isScreeningSnapshotTicker(ticker) || !isFundamentalRatioTicker(ticker)) {
    throw new Error("screening_vnstock_fundamental_ratio_ticker_not_allowed");
  }

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      execFile(
        pythonExecutable,
        ["-c", PYTHON_FUNDAMENTAL_RATIO_SCRIPT, ticker],
        { maxBuffer: 1_000_000, timeout: 60_000, windowsHide: true },
        (error, output) => {
          if (error) reject(error);
          else resolve(output);
        },
      );
    });

    const payloadLine = stdout
      .split(/\r?\n/)
      .find((line) => line.startsWith(RATIO_OUTPUT_MARKER));
    if (!payloadLine) throw new Error("screening_vnstock_ratio_output_missing");

    const parsed = JSON.parse(payloadLine.slice(RATIO_OUTPUT_MARKER.length)) as {
      pe?: unknown;
      providerPeriod?: unknown;
      providerColumn?: unknown;
      itemLabel?: unknown;
      extractedQuote?: unknown;
      providerDefinitionKnown?: unknown;
      warnings?: unknown;
    };
    const pe = nullableNumber(parsed.pe);
    const providerPeriod = typeof parsed.providerPeriod === "string" ? parsed.providerPeriod : null;
    const providerColumn = typeof parsed.providerColumn === "string" ? parsed.providerColumn : null;
    const itemLabel = typeof parsed.itemLabel === "string" ? parsed.itemLabel : null;
    const extractedQuote = typeof parsed.extractedQuote === "string" ? parsed.extractedQuote : null;
    const providerDefinitionKnown = parsed.providerDefinitionKnown === true;
    const warnings = Array.isArray(parsed.warnings)
      ? parsed.warnings.map((warning) => `VNSTOCK_RATIO_WARNING:${compactWarning(String(warning))}`)
      : [];
    const succeeded = pe !== null && pe > 0 && Boolean(providerPeriod) && providerDefinitionKnown;

    return {
      ticker,
      attempted: true,
      succeeded,
      sourceLabel: "VNStock Fundamental equity ratio",
      retrievedAt,
      warningCodes: [
        "PROVIDER_SNAPSHOT",
        "NEEDS_REVIEW",
        "RESEARCH_ONLY",
        "MARKET_RATIO_NOT_AUDITED",
        "STALE_SNAPSHOT_CHECK_REQUIRED",
        ...warnings,
        ...(succeeded ? [] : ["VNSTOCK_RATIO_PE_UNAVAILABLE"]),
      ],
      errorSummary: succeeded ? null : "VNStock Fundamental ratio did not return an eligible positive P/E value.",
      data: {
        pe,
        providerPeriod,
        providerColumn,
        itemLabel,
        extractedQuote,
        providerDefinitionKnown,
      },
    };
  } catch (error) {
    return missingRatioFetchResult({
      ticker,
      attempted: true,
      retrievedAt,
      warningCodes: [
        "PROVIDER_SNAPSHOT",
        "NEEDS_REVIEW",
        "RESEARCH_ONLY",
        "MARKET_RATIO_NOT_AUDITED",
        "STALE_SNAPSHOT_CHECK_REQUIRED",
        "VNSTOCK_RATIO_FETCH_FAILED",
      ],
      errorSummary: compactWarning(error instanceof Error ? error.message : String(error)),
    });
  }
};

export const fetchScreeningVnstockFundamentalRatios = async ({
  attemptFetch = shouldAttemptScreeningVnstockRatioFetch(),
  retrievedAt = TODAY,
}: {
  attemptFetch?: boolean;
  retrievedAt?: string;
} = {}): Promise<ScreeningVnstockFundamentalRatioFetchResult[]> => {
  if (!attemptFetch) {
    return FUNDAMENTAL_RATIO_TICKERS.map((ticker) =>
      missingRatioFetchResult({
        ticker,
        attempted: false,
        retrievedAt,
        warningCodes: [
          "PROVIDER_SNAPSHOT",
          "NEEDS_REVIEW",
          "RESEARCH_ONLY",
          "MARKET_RATIO_NOT_AUDITED",
          "STALE_SNAPSHOT_CHECK_REQUIRED",
          "PROVIDER_FETCH_NOT_ATTEMPTED",
        ],
        errorSummary: `Set ${SCREENING_VNSTOCK_RATIO_FETCH_ENV_KEY}=true to attempt dry-run Fundamental ratio fetch.`,
      }),
    );
  }

  const results: ScreeningVnstockFundamentalRatioFetchResult[] = [];
  for (const ticker of FUNDAMENTAL_RATIO_TICKERS) {
    results.push(await fetchLocalPythonVnstockFundamentalRatio(ticker, { retrievedAt }));
  }
  return results;
};

export const fetchScreeningVnstockSnapshots = async ({
  attemptFetch = shouldAttemptScreeningVnstockFetch(),
  retrievedAt = nowIso(),
}: {
  attemptFetch?: boolean;
  retrievedAt?: string;
} = {}): Promise<ScreeningVnstockSnapshotFetchResult[]> => {
  if (!attemptFetch) {
    return ALLOWED_SCREENING_SNAPSHOT_TICKERS.map((ticker) =>
      missingFetchResult({
        ticker,
        attempted: false,
        retrievedAt,
        warningCodes: [
          PROVIDER_WARNING,
          NOT_ATTEMPTED_WARNING,
          "SNAPSHOT_VALUE_MISSING",
          "NEEDS_MANUAL_REVIEW",
        ],
        errorSummary: `Set ${SCREENING_VNSTOCK_FETCH_ENV_KEY}=true to attempt dry-run provider fetch.`,
      }),
    );
  }

  const results: ScreeningVnstockSnapshotFetchResult[] = [];
  for (const ticker of ALLOWED_SCREENING_SNAPSHOT_TICKERS) {
    results.push(await fetchLocalPythonVnstockScreeningSnapshot(ticker, { retrievedAt }));
  }
  return results;
};

const metricFromFetchResult = ({
  result,
  metricCode,
}: {
  result: ScreeningVnstockSnapshotFetchResult;
  metricCode: ProviderSnapshotMetricCode;
}): ProviderSnapshotMetric => {
  const value = result.data[metricCode];
  const liquidityUnit =
    result.data.liquidityProxy === "tradingValue" || result.data.liquidityProxy === "averageTradingValue"
      ? "vnd_trading_value"
      : "shares";
  const unit = metricCode === "pe" || metricCode === "pb" ? "ratio" : metricCode === "closePrice" ? "vnd" : liquidityUnit;
  const valueMissing = value === null;
  const warningCodes = Array.from(
    new Set([
      ...result.warningCodes,
      ...(valueMissing ? ["SNAPSHOT_VALUE_MISSING"] : []),
      ...(metricCode === "liquidity" ? [`LIQUIDITY_PROXY_${result.data.liquidityProxy.toUpperCase()}`] : []),
    ]),
  );

  return {
    ticker: result.ticker,
    metricCode,
    value,
    unit,
    periodType: "market_snapshot",
    snapshotDate: result.data.snapshotDate,
    nearestTradingDate: result.data.nearestTradingDate,
    sourceLabel: "VNStock",
    sourceType: "provider_snapshot",
    retrievedAt: result.attempted ? result.retrievedAt : null,
    providerDefinitionKnown: result.data.providerDefinitionKnown[metricCode],
    extractedQuote: null,
    reviewNote:
      valueMissing
        ? `${metricCode} remains null for ${result.ticker}; ${result.errorSummary ?? "provider snapshot value unavailable"}.`
        : `${metricCode} was captured as a VNStock market snapshot for ${result.ticker}; it is research_only and needs review.`,
    warningCodes,
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
    staleAfterDays: metricCode === "liquidity" || metricCode === "closePrice" ? 1 : 7,
    refreshPolicy: "manual_or_provider_refresh",
  };
};

const peMetricFromFundamentalRatio = (
  result: ScreeningVnstockFundamentalRatioFetchResult,
): ProviderSnapshotMetric => ({
  ticker: result.ticker,
  metricCode: "pe",
  value: result.data.pe,
  unit: "ratio",
  periodType: "provider_ratio_snapshot",
  providerPeriod: result.data.providerPeriod,
  snapshotDate: result.retrievedAt,
  nearestTradingDate: null,
  sourceLabel: result.sourceLabel,
  sourceUrl: null,
  sourceType: "provider_snapshot",
  retrievedAt: result.attempted ? result.retrievedAt : null,
  providerDefinitionKnown: result.data.providerDefinitionKnown,
  extractedQuote: result.data.extractedQuote,
  reviewNote:
    result.data.pe === null
      ? `HSG P/E remains null; ${result.errorSummary ?? "VNStock Fundamental ratio value unavailable"}.`
      : "P/E lay truc tiep tu VNStock Fundamental equity ratio API, khong tu tinh.",
  warningCodes: result.warningCodes,
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
  staleAfterDays: 7,
  refreshPolicy: "manual_or_provider_refresh",
});

export const buildSteelDirectPeerProviderSnapshotPackages = async ({
  attemptFetch = shouldAttemptScreeningVnstockFetch(),
  attemptRatioFetch = shouldAttemptScreeningVnstockRatioFetch(),
  retrievedAt,
}: {
  attemptFetch?: boolean;
  attemptRatioFetch?: boolean;
  retrievedAt?: string;
} = {}): Promise<{
  packages: ProviderSnapshotPackage[];
  fetchResults: ScreeningVnstockSnapshotFetchResult[];
  ratioFetchResults: ScreeningVnstockFundamentalRatioFetchResult[];
}> => {
  const fetchResults = await fetchScreeningVnstockSnapshots({ attemptFetch, retrievedAt });
  const ratioFetchResults = await fetchScreeningVnstockFundamentalRatios({ attemptFetch: attemptRatioFetch, retrievedAt });
  const packages = fetchResults.map((result): ProviderSnapshotPackage => ({
    ticker: result.ticker,
    coverageLevel: "screening_candidate",
    screeningEligible: true,
    analysisEligible: false,
    providerSnapshotSource: "VNStock",
    metrics: {
      pe: metricFromFetchResult({ result, metricCode: "pe" }),
      pb: metricFromFetchResult({ result, metricCode: "pb" }),
      liquidity: metricFromFetchResult({ result, metricCode: "liquidity" }),
      closePrice: metricFromFetchResult({ result, metricCode: "closePrice" }),
    },
  }));

  for (const ratioResult of ratioFetchResults) {
    if (ratioResult.ticker !== "HSG") continue;
    const hsgPackage = packages.find((pkg) => pkg.ticker === "HSG");
    if (hsgPackage) hsgPackage.metrics.pe = peMetricFromFundamentalRatio(ratioResult);
  }

  return { packages, fetchResults, ratioFetchResults };
};

export const steelDirectPeerProviderSnapshotPackages: ProviderSnapshotPackage[] = ALLOWED_SCREENING_SNAPSHOT_TICKERS.map(
  (ticker) => ({
    ticker,
    coverageLevel: "screening_candidate",
    screeningEligible: true,
    analysisEligible: false,
    providerSnapshotSource: "VNStock",
    metrics: {
      pe: metricFromFetchResult({
        result: missingFetchResult({
          ticker,
          attempted: false,
          retrievedAt: nowIso(),
          warningCodes: [PROVIDER_WARNING, NOT_ATTEMPTED_WARNING, "SNAPSHOT_VALUE_MISSING", "NEEDS_MANUAL_REVIEW"],
          errorSummary: `Set ${SCREENING_VNSTOCK_FETCH_ENV_KEY}=true to attempt dry-run provider fetch.`,
        }),
        metricCode: "pe",
      }),
      pb: metricFromFetchResult({
        result: missingFetchResult({
          ticker,
          attempted: false,
          retrievedAt: nowIso(),
          warningCodes: [PROVIDER_WARNING, NOT_ATTEMPTED_WARNING, "SNAPSHOT_VALUE_MISSING", "NEEDS_MANUAL_REVIEW"],
          errorSummary: `Set ${SCREENING_VNSTOCK_FETCH_ENV_KEY}=true to attempt dry-run provider fetch.`,
        }),
        metricCode: "pb",
      }),
      liquidity: metricFromFetchResult({
        result: missingFetchResult({
          ticker,
          attempted: false,
          retrievedAt: nowIso(),
          warningCodes: [PROVIDER_WARNING, NOT_ATTEMPTED_WARNING, "SNAPSHOT_VALUE_MISSING", "NEEDS_MANUAL_REVIEW"],
          errorSummary: `Set ${SCREENING_VNSTOCK_FETCH_ENV_KEY}=true to attempt dry-run provider fetch.`,
        }),
        metricCode: "liquidity",
      }),
      closePrice: metricFromFetchResult({
        result: missingFetchResult({
          ticker,
          attempted: false,
          retrievedAt: nowIso(),
          warningCodes: [PROVIDER_WARNING, NOT_ATTEMPTED_WARNING, "SNAPSHOT_VALUE_MISSING", "NEEDS_MANUAL_REVIEW"],
          errorSummary: `Set ${SCREENING_VNSTOCK_FETCH_ENV_KEY}=true to attempt dry-run provider fetch.`,
        }),
        metricCode: "closePrice",
      }),
    },
  }),
);
