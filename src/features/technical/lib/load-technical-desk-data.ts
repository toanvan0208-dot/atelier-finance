import {
  getIssuerMetadata,
  getMarketPriceSeries,
  type IssuerMetadataRecord,
  type MarketPriceSeriesResult,
} from "../../../lib/data-sources";
import { pvtDataQuality, pvtObservationData } from "../data/pvtObservation.data";
import type { PVTObservationData, TechnicalIssuerMetadata, TechnicalMarketDataSource } from "../types";
import {
  buildTechnicalFromMarketPriceSeries,
  type TechnicalPvtFromMarketPriceSeriesResult,
} from "./build-technical-from-market-price-series";
import { buildUnknownMarketPvtUnitMetadata } from "./market-pvt-unit-metadata-capture";
import type { MarketPvtUnitMetadataMap } from "./market-pvt-unit-metadata-contract";

export type TechnicalDeskDataSourceType =
  | "local_db_manual_import"
  | "sample_static_fallback";

export type LoadTechnicalDeskDataInput = {
  ticker: string;
  from: string;
  to: string;
  preferDb?: boolean;
  allowFallback?: boolean;
};

export type TechnicalDeskDataQuality = typeof pvtDataQuality;

export type LoadTechnicalDeskDataResult = {
  ok: boolean;
  data: PVTObservationData | null;
  dataQuality: TechnicalDeskDataQuality;
  source: {
    sourceType: TechnicalDeskDataSourceType;
    provider: "vnstock" | "sample_static";
    sourceLabel: string;
    dataMode: string;
    productionApproved: false;
  };
  marketDataSource: TechnicalMarketDataSource;
  marketUnitMetadata: MarketPvtUnitMetadataMap;
  issuerMetadata: TechnicalIssuerMetadata;
  fallbackUsed: boolean;
  warnings: string[];
  errors: string[];
};

export type LoadTechnicalDeskDataDependencies = {
  readMarketPriceSeries?: typeof getMarketPriceSeries;
  readIssuerMetadata?: typeof getIssuerMetadata;
  buildFromMarketPriceSeries?: (
    baseData: PVTObservationData,
    series: MarketPriceSeriesResult,
  ) => TechnicalPvtFromMarketPriceSeriesResult;
  fallbackData?: PVTObservationData;
  fallbackDataQuality?: TechnicalDeskDataQuality;
};

const STATIC_FALLBACK_WARNING =
  "Technical/PVT data uses the static sample fallback; no local DB market price data was used.";

const LOCAL_RESEARCH_WARNING =
  "Technical/PVT DB-backed data is local academic/research only; production approval remains false.";

const stringOrNull = (value: string | Date | null | undefined): string | null => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
};

const fallbackIssuerMetadata = (fallbackData: PVTObservationData): TechnicalIssuerMetadata =>
  fallbackData.issuerMetadata ?? {
    ticker: fallbackData.ticker,
    displayName: fallbackData.companyName,
    issuerName: fallbackData.companyName,
    industry: fallbackData.industry,
    sector: null,
    sourceLabel: "sample_static_fallback",
    dataMode: "sample",
    productionApproved: false,
    verificationStatus: "static_sample",
    limitations: [
      "Static sample issuer metadata is for local product behavior checks only.",
      "It is not verified production issuer metadata.",
    ],
    warnings: ["Sample/static issuer metadata is not production approved."],
  };

const unavailableIssuerMetadata = (ticker: string): TechnicalIssuerMetadata => ({
  ticker,
  displayName: null,
  issuerName: null,
  industry: null,
  sector: null,
  sourceLabel: "unavailable",
  dataMode: "unknown",
  productionApproved: false,
  verificationStatus: "unavailable",
  limitations: [
    "Company/issuer metadata is unavailable for this DB-backed ticker.",
    "Sample company, industry, and sector metadata were not reused because the ticker differs from the sample base ticker.",
  ],
  warnings: ["Issuer metadata has not been verified for this market price ticker."],
});

const toTechnicalIssuerMetadata = (metadata: IssuerMetadataRecord): TechnicalIssuerMetadata => ({
  ticker: metadata.ticker,
  displayName: metadata.displayName,
  issuerName: metadata.issuerName ?? metadata.companyName,
  industry: metadata.industry,
  sector: metadata.sector,
  sourceLabel: metadata.sourceLabel,
  dataMode: metadata.dataMode,
  productionApproved: false,
  verificationStatus: metadata.verificationStatus,
  limitations: metadata.limitations,
  warnings: metadata.warnings,
});

const fallbackMarketDataSource = (
  ticker: string | null,
  asOf: string | null,
): TechnicalMarketDataSource => ({
  sourceType: "sample_static_fallback",
  provider: "sample_static",
  sourceLabel: "sample_static_fallback",
  dataMode: "sample",
  productionApproved: false,
  fallbackUsed: true,
  ticker,
  asOf,
  dateSpan: {
    from: null,
    to: null,
  },
});

const dbMarketDataSource = (
  series: MarketPriceSeriesResult,
): TechnicalMarketDataSource => ({
  sourceType: "local_db_manual_import",
  provider: "vnstock",
  sourceLabel: series.sourceLabel,
  dataMode: series.dataMode,
  productionApproved: false,
  fallbackUsed: false,
  ticker: series.ticker,
  asOf: series.rows.at(-1)?.date ?? series.to ?? null,
  dateSpan: {
    from: series.from,
    to: series.to,
  },
});

const fallbackResult = ({
  fallbackData,
  fallbackDataQuality,
  warnings = [],
  errors = [],
}: {
  fallbackData: PVTObservationData;
  fallbackDataQuality: TechnicalDeskDataQuality;
  warnings?: string[];
  errors?: string[];
}): LoadTechnicalDeskDataResult => ({
  ok: true,
  data: fallbackData,
  dataQuality: {
    ...fallbackDataQuality,
    isDemoData: true,
  },
  source: {
    sourceType: "sample_static_fallback",
    provider: "sample_static",
    sourceLabel: "sample_static_fallback",
    dataMode: "sample",
    productionApproved: false,
  },
  marketDataSource: fallbackMarketDataSource(fallbackData.ticker, stringOrNull(fallbackDataQuality.asOf)),
  marketUnitMetadata: buildUnknownMarketPvtUnitMetadata(
    {},
    {
      asOf: stringOrNull(fallbackDataQuality.asOf),
      dataMode: "sample",
      source: "sample_fallback",
      sourceLabel: "sample_static_fallback",
    },
  ),
  issuerMetadata: fallbackIssuerMetadata(fallbackData),
  fallbackUsed: true,
  warnings: [STATIC_FALLBACK_WARNING, ...warnings],
  errors,
});

const safeErrorResult = ({
  fallbackDataQuality,
  warnings = [],
  errors = [],
}: {
  fallbackDataQuality: TechnicalDeskDataQuality;
  warnings?: string[];
  errors?: string[];
}): LoadTechnicalDeskDataResult => ({
  ok: false,
  data: null,
  dataQuality: {
    ...fallbackDataQuality,
    isDemoData: true,
  },
  source: {
    sourceType: "sample_static_fallback",
    provider: "sample_static",
    sourceLabel: "sample_static_fallback",
    dataMode: "sample",
    productionApproved: false,
  },
  marketDataSource: fallbackMarketDataSource(null, stringOrNull(fallbackDataQuality.asOf)),
  marketUnitMetadata: buildUnknownMarketPvtUnitMetadata(
    {},
    {
      asOf: stringOrNull(fallbackDataQuality.asOf),
      dataMode: "sample",
      source: "sample_fallback",
      sourceLabel: "sample_static_fallback",
    },
  ),
  issuerMetadata: unavailableIssuerMetadata("UNKNOWN"),
  fallbackUsed: false,
  warnings,
  errors,
});

const invalidInputErrors = (input: LoadTechnicalDeskDataInput): string[] => {
  const errors: string[] = [];
  const ticker = input.ticker?.trim();
  const from = Date.parse(input.from);
  const to = Date.parse(input.to);

  if (!ticker) errors.push("Ticker is required.");
  if (!Number.isFinite(from)) errors.push("A valid from date is required.");
  if (!Number.isFinite(to)) errors.push("A valid to date is required.");
  if (Number.isFinite(from) && Number.isFinite(to) && from > to) {
    errors.push("From date must be earlier than or equal to to date.");
  }

  return errors;
};

export const loadTechnicalDeskData = async (
  input: LoadTechnicalDeskDataInput,
  dependencies: LoadTechnicalDeskDataDependencies = {},
): Promise<LoadTechnicalDeskDataResult> => {
  const allowFallback = input.allowFallback ?? true;
  const preferDb = input.preferDb ?? false;
  const fallbackData = dependencies.fallbackData ?? pvtObservationData;
  const fallbackDataQuality = dependencies.fallbackDataQuality ?? pvtDataQuality;

  const invalidErrors = invalidInputErrors(input);
  if (invalidErrors.length > 0) {
    if (allowFallback) {
      return fallbackResult({
        fallbackData,
        fallbackDataQuality,
        warnings: ["Invalid Technical/PVT DB input; static fallback was used."],
        errors: invalidErrors,
      });
    }

    return safeErrorResult({
      fallbackDataQuality,
      warnings: ["Invalid Technical/PVT DB input; fallback is disabled."],
      errors: invalidErrors,
    });
  }

  if (!preferDb) {
    if (allowFallback) {
      return fallbackResult({
        fallbackData,
        fallbackDataQuality,
        warnings: ["DB-backed Technical/PVT path is not preferred for this call."],
      });
    }

    return safeErrorResult({
      fallbackDataQuality,
      warnings: ["DB-backed Technical/PVT path is not enabled and fallback is disabled."],
    });
  }

  const readMarketPriceSeries = dependencies.readMarketPriceSeries ?? getMarketPriceSeries;
  const readIssuerMetadata = dependencies.readIssuerMetadata ?? getIssuerMetadata;
  const buildFromMarketPriceSeries =
    dependencies.buildFromMarketPriceSeries ?? buildTechnicalFromMarketPriceSeries;
  const series = await readMarketPriceSeries({
    ticker: input.ticker,
    from: input.from,
    to: input.to,
  });

  if (!series.ok || series.count === 0) {
    if (allowFallback) {
      return fallbackResult({
        fallbackData,
        fallbackDataQuality,
        warnings: [
          "Technical/PVT DB read did not return usable rows; static fallback was used.",
          ...series.warnings,
        ],
        errors: series.errors,
      });
    }

    return safeErrorResult({
      fallbackDataQuality,
      warnings: ["Technical/PVT DB read did not return usable rows and fallback is disabled.", ...series.warnings],
      errors: series.errors,
    });
  }

  const built = buildFromMarketPriceSeries(fallbackData, series);
  if (!built.ok || !built.data) {
    if (allowFallback) {
      return fallbackResult({
        fallbackData,
        fallbackDataQuality,
        warnings: [
          "Technical/PVT builder could not create DB-backed data; static fallback was used.",
          ...built.adapter.warnings,
        ],
        errors: built.adapter.errors,
      });
    }

    return safeErrorResult({
      fallbackDataQuality,
      warnings: [
        "Technical/PVT builder could not create DB-backed data and fallback is disabled.",
        ...built.adapter.warnings,
      ],
      errors: built.adapter.errors,
    });
  }

  const issuerMetadata = toTechnicalIssuerMetadata(readIssuerMetadata(series.ticker ?? input.ticker));

  return {
    ok: true,
    data: built.data,
    dataQuality: {
      ...fallbackDataQuality,
      source: series.sourceLabel,
      isDemoData: false,
      missingFields: built.adapter.warnings,
    },
    source: {
      sourceType: "local_db_manual_import",
      provider: "vnstock",
      sourceLabel: series.sourceLabel,
      dataMode: series.dataMode,
      productionApproved: false,
    },
    marketDataSource: dbMarketDataSource(series),
    marketUnitMetadata: built.marketUnitMetadata,
    issuerMetadata,
    fallbackUsed: false,
    warnings: [
      LOCAL_RESEARCH_WARNING,
      ...series.warnings,
      ...built.adapter.warnings,
      ...issuerMetadata.warnings,
    ],
    errors: built.adapter.errors,
  };
};
