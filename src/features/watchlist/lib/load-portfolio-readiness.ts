import { getIssuerMetadata, type IssuerMetadataRecord } from "@/lib/data-sources/issuer-metadata-service";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import {
  buildFinancialStatementCoverage,
  type FinancialStatementCoverage,
} from "@/features/financials/lib/financial-statement-coverage";
import { loadFinancialsRuntimeData, type LoadFinancialsRuntimeDataDeps } from "@/features/financials/lib/load-financials-runtime-data";
import { buildRiskFinancialsRuntimeConsumption } from "@/features/risk/lib/risk-financials-runtime-consumption";
import type { TechnicalPageRuntimeData } from "@/features/technical";
import { loadTechnicalRuntimeData, type LoadTechnicalRuntimeDataDependencies } from "@/features/technical/lib/load-technical-runtime-data";
import { buildValuationFinancialsRuntimeReadiness } from "@/features/valuation/lib/valuation-financials-runtime-readiness";
import { readReviewedSourceRecordCandidates } from "@/lib/data-sources/reviewed-source-records-import";
import {
  buildTraceableInputSourceDecisions,
  type TraceableInputCandidate,
  type TraceableInputField,
  type TraceableInputSourceDecisions,
} from "./traceable-input-source-decisions";

export const PORTFOLIO_READINESS_TICKERS = ["FPT", "MWG", "VNM"] as const;
export const PORTFOLIO_READINESS_TECHNICAL_FROM = "2025-06-02" as const;
export const PORTFOLIO_READINESS_TECHNICAL_TO = "2025-06-30" as const;
export const PORTFOLIO_READINESS_TECHNICAL_SOURCE_LABEL = "vnstock_research_candidate" as const;

export type PortfolioReadinessTicker = (typeof PORTFOLIO_READINESS_TICKERS)[number];
export type PortfolioReadinessStatus = "available" | "partial" | "insufficient_data" | "unavailable";

export type PortfolioReadinessItem = {
  ticker: PortfolioReadinessTicker;
  companyName: string | null;
  exchange: string | null;
  industry: string | null;
  companyMetadata: {
    status: PortfolioReadinessStatus;
    sourceLabel: string;
    dataMode: string;
    verificationStatus: string;
    productionApproved: false;
  };
  technical: {
    status: PortfolioReadinessStatus;
    provider: string;
    sourceLabel: string;
    dataMode: string;
    readPath: string;
    fallbackUsed: boolean;
    productionApproved: false;
  };
  marketPrice: {
    status: "available" | "unavailable";
    value: number | null;
    sourceLabel: string;
  };
  financials: {
    status: PortfolioReadinessStatus;
    runtimeStatus: string;
    readPath: string;
    sourceLabel: string;
    dataMode: string;
    fallbackUsed: boolean;
    productionApproved: false;
    coverage: FinancialStatementCoverage;
  };
  sharesOutstanding: {
    status: "available" | "unavailable";
    value: number | null;
    unit: string | null;
  };
  eps: {
    status: "available" | "unavailable";
    value: number | null;
  };
  sourceDecisions: TraceableInputSourceDecisions;
  valuation: {
    status: PortfolioReadinessStatus;
    canClaimValuationDbBacked: false;
    pe: string;
    marketCap: string;
    bvps: string;
    pb: string;
    ps: string;
  };
  risk: {
    status: PortfolioReadinessStatus;
    canClaimRiskDbBacked: false;
    sourceMode: string;
    cashFlowQuality: string;
    leverageRisk: string;
    liquidityRisk: string;
  };
  missingInputs: string[];
  blockedMetrics: string[];
  dataWarnings: string[];
};

export type PortfolioReadinessResult = {
  sourceLabel: "portfolio_readiness_backbone";
  productionApproved: false;
  tickers: PortfolioReadinessItem[];
  warnings: string[];
};

export type LoadPortfolioReadinessDeps = {
  readIssuerMetadata?: typeof getIssuerMetadata;
  loadTechnical?: typeof loadTechnicalRuntimeData;
  technicalDeps?: LoadTechnicalRuntimeDataDependencies;
  loadFinancials?: typeof loadFinancialsRuntimeData;
  financialsDeps?: LoadFinancialsRuntimeDataDeps;
  readTraceableInputCandidates?: typeof readReviewedSourceRecordCandidates;
  traceableInputCandidates?: Partial<
    Record<PortfolioReadinessTicker, Partial<Record<TraceableInputField, TraceableInputCandidate | null>>>
  >;
};

const statusFromBoolean = (available: boolean): PortfolioReadinessStatus => (available ? "available" : "unavailable");

const companyStatus = (metadata: IssuerMetadataRecord): PortfolioReadinessStatus =>
  metadata.verificationStatus === "controlled_local_research" && metadata.sourceLabel !== "unavailable"
    ? "available"
    : "unavailable";

const technicalStatus = (technical: TechnicalPageRuntimeData): PortfolioReadinessStatus => {
  if (!technical.fallbackUsed && technical.source?.sourceLabel === PORTFOLIO_READINESS_TECHNICAL_SOURCE_LABEL) {
    return "available";
  }
  if (!technical.fallbackUsed && technical.source?.sourceType === "local_db_manual_import") return "partial";
  return "unavailable";
};

const financialsStatus = (financials: FinancialsRuntimeData): PortfolioReadinessStatus => {
  if (
    financials.runtimeStatus === "db_backed" &&
    financials.source.readPath === "local_db" &&
    financials.source.fallbackUsed === false
  ) {
    return financials.dataQuality.status === "available" ? "available" : "partial";
  }

  return financials.source.fallbackUsed ? "unavailable" : "insufficient_data";
};

const valuationStatus = (blockedMetrics: string[]): PortfolioReadinessStatus =>
  blockedMetrics.length > 0 ? "insufficient_data" : "partial";

const riskStatus = (risk: ReturnType<typeof buildRiskFinancialsRuntimeConsumption>): PortfolioReadinessStatus =>
  risk.unavailableFields.length > 0 || risk.riskSourceMode !== "financials_runtime_partial"
    ? "partial"
    : "available";

const unique = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)));

const missingInputsFrom = ({
  technical,
  risk,
  sourceDecisions,
}: {
  technical: TechnicalPageRuntimeData;
  risk: ReturnType<typeof buildRiskFinancialsRuntimeConsumption>;
  sourceDecisions: TraceableInputSourceDecisions;
}): string[] =>
  unique([
    sourceDecisions.sharesOutstanding.status !== "available" ? "sharesOutstanding" : "",
    sourceDecisions.eps.status !== "available" ? "eps" : "",
    technical.fallbackUsed ? "technical_db_backed_vnstock_rows" : "",
    ...risk.unavailableFields,
  ]);

const blockedMetricsFrom = ({
  eps,
  equity,
  marketPrice,
  revenue,
  sharesOutstanding,
}: {
  eps: number | null | undefined;
  equity: number | null | undefined;
  marketPrice: number | null | undefined;
  revenue: number | null | undefined;
  sharesOutstanding: number | null | undefined;
}): string[] =>
  unique([
    eps === null || eps === undefined ? "pe:eps_unavailable" : "",
    sharesOutstanding === null || sharesOutstanding === undefined ? "marketCap:sharesOutstanding_unavailable" : "",
    marketPrice === null || marketPrice === undefined ? "marketCap:marketPrice_unavailable" : "",
    sharesOutstanding === null || sharesOutstanding === undefined ? "bvps:sharesOutstanding_unavailable" : "",
    equity === null || equity === undefined ? "bvps:equity_unavailable" : "",
    sharesOutstanding === null || sharesOutstanding === undefined ? "pb:sharesOutstanding_unavailable" : "",
    marketPrice === null || marketPrice === undefined ? "pb:marketPrice_unavailable" : "",
    equity === null || equity === undefined ? "pb:equity_unavailable" : "",
    sharesOutstanding === null || sharesOutstanding === undefined || marketPrice === null || marketPrice === undefined
      ? "ps:marketCap_unavailable"
      : "",
    revenue === null || revenue === undefined ? "ps:revenue_unavailable" : "",
  ]);

const readyMarketPriceFrom = (technical: TechnicalPageRuntimeData): number | null => {
  const marketPriceMetadata = technical.marketUnitMetadata?.marketPrice;
  const price = technical.data?.currentPrice ?? null;
  if (technical.fallbackUsed || marketPriceMetadata?.status !== "ready") return null;
  return typeof price === "number" && Number.isFinite(price) && price > 0 ? price : null;
};

const readyMarketPriceFromFinancials = (financials: FinancialsRuntimeData): number | null => {
  const price = financials.statementSnapshot?.closePrice ?? null;
  return typeof price === "number" && Number.isFinite(price) && price > 0 ? price : null;
};

const buildItem = ({
  financials,
  metadata,
  technical,
  traceableInputCandidates,
}: {
  financials: FinancialsRuntimeData;
  metadata: IssuerMetadataRecord;
  technical: TechnicalPageRuntimeData;
  traceableInputCandidates?: Partial<Record<TraceableInputField, TraceableInputCandidate | null>>;
}): PortfolioReadinessItem => {
  const sourceDecisions = buildTraceableInputSourceDecisions({
    candidates: traceableInputCandidates,
    financials,
    ticker: metadata.ticker,
  });
  const traceableTotalDebt = sourceDecisions.totalDebt.status === "available" ? sourceDecisions.totalDebt.value : null;
  const eps = sourceDecisions.eps.status === "available" ? sourceDecisions.eps.value : null;
  const sharesOutstanding =
    sourceDecisions.sharesOutstanding.status === "available" ? sourceDecisions.sharesOutstanding.value : null;
  const technicalMarketPrice = readyMarketPriceFrom(technical);
  const financialsMarketPrice = readyMarketPriceFromFinancials(financials);
  const marketPrice = technicalMarketPrice ?? financialsMarketPrice;
  const marketPriceSourceLabel =
    technicalMarketPrice !== null
      ? technical.source?.sourceLabel ?? "technical_runtime"
      : financialsMarketPrice !== null
        ? financials.source.sourceLabel
        : "unavailable";
  const financialsForValuation: FinancialsRuntimeData = financials.statementSnapshot
    ? {
        ...financials,
        statementSnapshot: { ...financials.statementSnapshot, eps, sharesOutstanding },
      }
    : financials;
  const valuation = buildValuationFinancialsRuntimeReadiness({
    financialsRuntimeData: financialsForValuation,
    inputs: { marketPrice },
    valuationConsumesFinancialsRuntime: true,
  });
  const risk = buildRiskFinancialsRuntimeConsumption({ financialsRuntimeData: financials, traceableTotalDebt });
  const blockedMetrics = blockedMetricsFrom({
    eps,
    equity: financials.statementSnapshot?.totalEquity,
    marketPrice,
    revenue: financials.statementSnapshot?.revenue,
    sharesOutstanding,
  });
  const missingInputs = missingInputsFrom({ risk, sourceDecisions, technical });
  const financialCoverage = buildFinancialStatementCoverage(financials);

  return {
    ticker: metadata.ticker as PortfolioReadinessTicker,
    companyName: metadata.companyName,
    exchange: metadata.exchange,
    industry: metadata.industry,
    companyMetadata: {
      dataMode: metadata.dataMode,
      productionApproved: false,
      sourceLabel: metadata.sourceLabel,
      status: companyStatus(metadata),
      verificationStatus: metadata.verificationStatus,
    },
    technical: {
      dataMode: technical.source?.dataMode ?? "unknown",
      fallbackUsed: technical.fallbackUsed ?? true,
      productionApproved: false,
      provider: technical.source?.provider ?? "unknown",
      readPath: technical.source?.sourceType ?? "unavailable",
      sourceLabel: technical.source?.sourceLabel ?? "unavailable",
      status: technicalStatus(technical),
    },
    marketPrice: {
      sourceLabel: marketPriceSourceLabel,
      status: statusFromBoolean(marketPrice !== null && marketPrice !== undefined) as "available" | "unavailable",
      value: marketPrice,
    },
    financials: {
      dataMode: financials.source.dataMode,
      fallbackUsed: financials.source.fallbackUsed,
      productionApproved: false,
      readPath: financials.source.readPath,
      runtimeStatus: financials.runtimeStatus,
      sourceLabel: financials.source.sourceLabel,
      status: financialsStatus(financials),
      coverage: financialCoverage,
    },
    sharesOutstanding: {
      status: statusFromBoolean(sharesOutstanding !== null && sharesOutstanding !== undefined) as "available" | "unavailable",
      unit: metadata.sharesUnit,
      value: sharesOutstanding,
    },
    eps: {
      status: statusFromBoolean(eps !== null && eps !== undefined) as "available" | "unavailable",
      value: eps,
    },
    sourceDecisions,
    valuation: {
      bvps: valuation.calculationReadiness.bvps,
      canClaimValuationDbBacked: false,
      marketCap: valuation.calculationReadiness.marketCap,
      pb: blockedMetrics.includes("pb:sharesOutstanding_unavailable")
        || blockedMetrics.includes("pb:marketPrice_unavailable")
        || blockedMetrics.includes("pb:equity_unavailable")
        ? "insufficient_data"
        : valuation.calculationReadiness.pb,
      pe: valuation.calculationReadiness.pe,
      ps: blockedMetrics.includes("ps:marketCap_unavailable") || blockedMetrics.includes("ps:revenue_unavailable")
        ? "insufficient_data"
        : "partial",
      status: valuationStatus(blockedMetrics),
    },
    risk: {
      canClaimRiskDbBacked: false,
      cashFlowQuality: risk.calculationReadiness.cashFlowQuality,
      leverageRisk: risk.calculationReadiness.leverageRisk,
      liquidityRisk: risk.calculationReadiness.liquidityRisk,
      sourceMode: risk.riskSourceMode,
      status: riskStatus(risk),
    },
    missingInputs,
    blockedMetrics,
    dataWarnings: unique([
      "Technical/PVT uses VNStock research candidate rows when DB-backed.",
      "Financials uses controlled local/research rows when DB-backed.",
      "Liabilities and debt remain separate: available liabilities do not unlock debt-based leverage readiness.",
      "Local DB-backed data remains productionApproved:false.",
      ...metadata.warnings,
      ...(technical.warnings ?? []),
      ...financials.dataQuality.warnings,
      ...valuation.warnings,
      ...risk.warnings,
    ]),
  };
};

export const loadPortfolioReadiness = async (
  deps: LoadPortfolioReadinessDeps = {},
): Promise<PortfolioReadinessResult> => {
  const readIssuerMetadata = deps.readIssuerMetadata ?? getIssuerMetadata;
  const loadTechnical = deps.loadTechnical ?? loadTechnicalRuntimeData;
  const loadFinancials = deps.loadFinancials ?? loadFinancialsRuntimeData;
  const readTraceableInputCandidates = deps.readTraceableInputCandidates ?? readReviewedSourceRecordCandidates;

  const tickers: PortfolioReadinessItem[] = [];

  for (const ticker of PORTFOLIO_READINESS_TICKERS) {
    const metadata = readIssuerMetadata(ticker);
    const technical = await loadTechnical(
      {
        from: PORTFOLIO_READINESS_TECHNICAL_FROM,
        preferDb: true,
        sourceLabel: PORTFOLIO_READINESS_TECHNICAL_SOURCE_LABEL,
        ticker,
        to: PORTFOLIO_READINESS_TECHNICAL_TO,
      },
      deps.technicalDeps,
    );
    const financials = await loadFinancials(
      {
        allowFallback: false,
        preferDb: true,
        ticker,
      },
      deps.financialsDeps,
    );
    const reviewedCandidates = deps.traceableInputCandidates?.[ticker]
      ? {}
      : await readTraceableInputCandidates(ticker);

    tickers.push(buildItem({
      financials,
      metadata,
      technical,
      traceableInputCandidates: deps.traceableInputCandidates?.[ticker] ?? reviewedCandidates,
    }));
  }

  return {
    productionApproved: false,
    sourceLabel: "portfolio_readiness_backbone",
    tickers,
    warnings: [
      "Portfolio readiness derives status from existing module runtimes; it is not a new source of financial truth.",
      "Unavailable sharesOutstanding and EPS stay null/unavailable and must not be replaced with 0.",
      "Valuation and Risk remain guarded when required inputs are missing.",
    ],
  };
};
