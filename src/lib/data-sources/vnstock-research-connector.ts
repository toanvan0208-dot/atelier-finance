export const VNSTOCK_RESEARCH_SOURCE_POLICY = {
  sourceCandidateId: "vnstock-academic-research-connector",
  provider: "vnstock",
  sourceType: "third_party_tool",
  usageScope: "academic_non_commercial",
  reviewStatus: "research_connector_candidate",
  legalStatus: "needs_review",
  productionApproved: false,
  attributionRequired: true,
  runtimeUse: "not_configured",
  implementationStatus: "skeleton_only",
  originalDataRights: "upstream_providers_may_apply",
} as const;

export type VnstockResearchConnectorMode =
  | "disabled"
  | "metadata_only"
  | "local_research";

export type VnstockResearchConnectorConfig = {
  enabled?: boolean;
  allowNetwork?: boolean;
  mode?: VnstockResearchConnectorMode;
  now?: Date;
};

export type VnstockResearchConnectorStatus =
  | "disabled"
  | "not_configured"
  | "network_not_allowed"
  | "fetcher_not_configured"
  | "fetched";

export type VnstockResearchConnectorResult = {
  ok: false;
  status: Exclude<VnstockResearchConnectorStatus, "fetched">;
  data: null;
  metadata: typeof VNSTOCK_RESEARCH_SOURCE_POLICY;
  warnings: string[];
};

export type VnstockResearchMarketPriceRequest = {
  ticker: string;
  startDate?: string | null;
  endDate?: string | null;
};

export type RawVnstockMarketPrice = {
  ticker?: string | null;
  date?: string | null;
  open?: string | number | null;
  high?: string | number | null;
  low?: string | number | null;
  close?: string | number | null;
  volume?: string | number | null;
  tradingValue?: string | number | null;
};

export type VnstockResearchMarketPriceRecord = {
  ticker: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  tradingValue: number | null;
  sourceProvider: "vnstock";
  sourceTool: "vnstock";
  sourceType: "third_party_tool";
  usageScope: "academic_non_commercial";
  productionApproved: false;
  asOf: string | null;
  retrievedAt: string;
  attribution: string;
  warnings: string[];
};

export type VnstockResearchMarketPriceFetcher = (
  request: VnstockResearchMarketPriceRequest,
) => Promise<RawVnstockMarketPrice[]>;

export type VnstockResearchMarketPriceConfig =
  VnstockResearchConnectorConfig & {
    fetchMarketPrices?: VnstockResearchMarketPriceFetcher;
  };

export type VnstockResearchMarketPriceResult =
  | {
      ok: false;
      status: Exclude<VnstockResearchConnectorStatus, "fetched">;
      data: null;
      metadata: typeof VNSTOCK_RESEARCH_SOURCE_POLICY;
      warnings: string[];
    }
  | {
      ok: true;
      status: "fetched";
      data: VnstockResearchMarketPriceRecord[];
      metadata: typeof VNSTOCK_RESEARCH_SOURCE_POLICY;
      warnings: string[];
    };

export const DEFAULT_VNSTOCK_RESEARCH_CONNECTOR_CONFIG = {
  enabled: false,
  allowNetwork: false,
  mode: "disabled",
} as const satisfies Required<Omit<VnstockResearchConnectorConfig, "now">>;

const baseWarnings = [
  "Vnstock is an academic/local research connector candidate only.",
  "Vnstock research connector is not production-approved.",
  "No network or data fetch is enabled unless explicit local research config and injected fetcher are provided.",
  "Original data rights may belong to upstream providers.",
] as const;

export const VNSTOCK_RESEARCH_ATTRIBUTION =
  "Data access supported by Vnstock for academic/local research validation. Original data ownership may belong to the respective source providers.";

const buildResult = (
  status: Exclude<VnstockResearchConnectorStatus, "fetched">,
  warnings: string[] = [],
): VnstockResearchConnectorResult => ({
  ok: false,
  status,
  data: null,
  metadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
  warnings: [...baseWarnings, ...warnings],
});

export const getVnstockResearchConnectorStatus = (
  config: VnstockResearchConnectorConfig = {},
): VnstockResearchConnectorResult => {
  const resolved = {
    ...DEFAULT_VNSTOCK_RESEARCH_CONNECTOR_CONFIG,
    ...config,
  };

  if (!resolved.enabled || resolved.mode === "disabled") {
    return buildResult("disabled");
  }

  if (resolved.mode === "local_research" && !resolved.allowNetwork) {
    return buildResult("network_not_allowed", [
      "Local research mode requested, but network access is disabled by policy.",
    ]);
  }

  return buildResult("not_configured", [
    "Vnstock connector remains metadata-only until a later approved phase.",
  ]);
};

export const createVnstockResearchConnector = getVnstockResearchConnectorStatus;

export const isVnstockResearchConnectorProductionApproved = (): false =>
  VNSTOCK_RESEARCH_SOURCE_POLICY.productionApproved;

const isValidDateText = (value: string): boolean => {
  const time = Date.parse(value);
  return Number.isFinite(time);
};

const parseOptionalNumber = (
  value: string | number | null | undefined,
  field: string,
  warnings: string[],
): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return value;
    }

    warnings.push(`${field} number is not finite; value was kept as null.`);
    return null;
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  warnings.push(`${field} could not be parsed as a number; value was kept as null.`);
  return null;
};

const normalizeMarketPriceRecord = ({
  raw,
  fallbackTicker,
  retrievedAt,
}: {
  raw: RawVnstockMarketPrice;
  fallbackTicker: string;
  retrievedAt: string;
}): { record: VnstockResearchMarketPriceRecord | null; warnings: string[] } => {
  const warnings: string[] = [];
  const ticker = (raw.ticker ?? fallbackTicker).trim().toUpperCase();
  const date = raw.date?.trim() ?? "";

  if (ticker.length === 0) {
    return {
      record: null,
      warnings: ["Market price record rejected because ticker is missing."],
    };
  }

  if (date.length === 0 || !isValidDateText(date)) {
    return {
      record: null,
      warnings: [`Market price record for ${ticker} rejected because date is invalid.`],
    };
  }

  const record: VnstockResearchMarketPriceRecord = {
    ticker,
    date,
    open: parseOptionalNumber(raw.open, "open", warnings),
    high: parseOptionalNumber(raw.high, "high", warnings),
    low: parseOptionalNumber(raw.low, "low", warnings),
    close: parseOptionalNumber(raw.close, "close", warnings),
    volume: parseOptionalNumber(raw.volume, "volume", warnings),
    tradingValue: parseOptionalNumber(raw.tradingValue, "tradingValue", warnings),
    sourceProvider: "vnstock",
    sourceTool: "vnstock",
    sourceType: "third_party_tool",
    usageScope: "academic_non_commercial",
    productionApproved: false,
    asOf: date,
    retrievedAt,
    attribution: VNSTOCK_RESEARCH_ATTRIBUTION,
    warnings,
  };

  return { record, warnings };
};

export const fetchVnstockResearchMarketPrices = async (
  request: VnstockResearchMarketPriceRequest,
  config: VnstockResearchMarketPriceConfig = {},
): Promise<VnstockResearchMarketPriceResult> => {
  const resolved = {
    ...DEFAULT_VNSTOCK_RESEARCH_CONNECTOR_CONFIG,
    ...config,
  };

  if (!resolved.enabled || resolved.mode === "disabled") {
    return buildResult("disabled");
  }

  if (resolved.mode !== "local_research") {
    return buildResult("not_configured", [
      "Market price fetch requires local_research mode.",
    ]);
  }

  if (!resolved.allowNetwork) {
    return buildResult("network_not_allowed", [
      "Local research market price fetch requested, but network access is disabled by policy.",
    ]);
  }

  if (!resolved.fetchMarketPrices) {
    return buildResult("fetcher_not_configured", [
      "No injected Vnstock market price fetcher was provided.",
    ]);
  }

  const retrievedAt = (resolved.now ?? new Date()).toISOString();
  const rawRecords = await resolved.fetchMarketPrices(request);
  const warnings: string[] = [];
  const data = rawRecords.flatMap((raw) => {
    const normalized = normalizeMarketPriceRecord({
      raw,
      fallbackTicker: request.ticker,
      retrievedAt,
    });
    warnings.push(...normalized.warnings);
    return normalized.record ? [normalized.record] : [];
  });

  return {
    ok: true,
    status: "fetched",
    data,
    metadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
    warnings: [...baseWarnings, ...warnings],
  };
};
