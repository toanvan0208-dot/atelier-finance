import { getIssuerMetadata, type IssuerMetadataRecord } from "@/lib/data-sources/issuer-metadata-service";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { loadFinancialsRuntimeData, type LoadFinancialsRuntimeDataDeps } from "@/features/financials/lib/load-financials-runtime-data";
import { buildRiskFinancialsRuntimeConsumption } from "@/features/risk/lib/risk-financials-runtime-consumption";
import type { TechnicalPageRuntimeData } from "@/features/technical";
import { loadTechnicalRuntimeData, type LoadTechnicalRuntimeDataDependencies } from "@/features/technical/lib/load-technical-runtime-data";
import { buildValuationFinancialsRuntimeReadiness } from "@/features/valuation/lib/valuation-financials-runtime-readiness";

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
  financials: {
    status: PortfolioReadinessStatus;
    runtimeStatus: string;
    readPath: string;
    sourceLabel: string;
    dataMode: string;
    fallbackUsed: boolean;
    productionApproved: false;
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
  metadata,
  financials,
  technical,
  risk,
}: {
  metadata: IssuerMetadataRecord;
  financials: FinancialsRuntimeData;
  technical: TechnicalPageRuntimeData;
  risk: ReturnType<typeof buildRiskFinancialsRuntimeConsumption>;
}): string[] =>
  unique([
    metadata.sharesOutstanding === null ? "sharesOutstanding" : "",
    financials.statementSnapshot?.eps === null || financials.statementSnapshot?.eps === undefined ? "eps" : "",
    technical.fallbackUsed ? "technical_db_backed_vnstock_rows" : "",
    ...risk.unavailableFields,
  ]);

const blockedMetricsFrom = ({
  eps,
  sharesOutstanding,
}: {
  eps: number | null | undefined;
  sharesOutstanding: number | null | undefined;
}): string[] =>
  unique([
    eps === null || eps === undefined ? "pe:eps_unavailable" : "",
    sharesOutstanding === null || sharesOutstanding === undefined ? "marketCap:sharesOutstanding_unavailable" : "",
    sharesOutstanding === null || sharesOutstanding === undefined ? "bvps:sharesOutstanding_unavailable" : "",
    sharesOutstanding === null || sharesOutstanding === undefined ? "pb:sharesOutstanding_unavailable" : "",
    sharesOutstanding === null || sharesOutstanding === undefined ? "ps:marketCap_unavailable" : "",
  ]);

const buildItem = ({
  financials,
  metadata,
  technical,
}: {
  financials: FinancialsRuntimeData;
  metadata: IssuerMetadataRecord;
  technical: TechnicalPageRuntimeData;
}): PortfolioReadinessItem => {
  const valuation = buildValuationFinancialsRuntimeReadiness({
    financialsRuntimeData: financials,
    valuationConsumesFinancialsRuntime: true,
  });
  const risk = buildRiskFinancialsRuntimeConsumption({ financialsRuntimeData: financials });
  const sharesOutstanding = metadata.sharesOutstanding;
  const eps = financials.statementSnapshot?.eps ?? null;
  const blockedMetrics = blockedMetricsFrom({ eps, sharesOutstanding });
  const missingInputs = missingInputsFrom({ financials, metadata, risk, technical });

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
    financials: {
      dataMode: financials.source.dataMode,
      fallbackUsed: financials.source.fallbackUsed,
      productionApproved: false,
      readPath: financials.source.readPath,
      runtimeStatus: financials.runtimeStatus,
      sourceLabel: financials.source.sourceLabel,
      status: financialsStatus(financials),
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
    valuation: {
      bvps: valuation.calculationReadiness.bvps,
      canClaimValuationDbBacked: false,
      marketCap: valuation.calculationReadiness.marketCap,
      pb: blockedMetrics.includes("pb:sharesOutstanding_unavailable")
        ? "insufficient_data"
        : valuation.calculationReadiness.pb,
      pe: valuation.calculationReadiness.pe,
      ps: blockedMetrics.includes("ps:marketCap_unavailable") ? "insufficient_data" : "partial",
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

  const tickers = await Promise.all(
    PORTFOLIO_READINESS_TICKERS.map(async (ticker) => {
      const [metadata, technical, financials] = await Promise.all([
        Promise.resolve(readIssuerMetadata(ticker)),
        loadTechnical(
          {
            from: PORTFOLIO_READINESS_TECHNICAL_FROM,
            preferDb: true,
            sourceLabel: PORTFOLIO_READINESS_TECHNICAL_SOURCE_LABEL,
            ticker,
            to: PORTFOLIO_READINESS_TECHNICAL_TO,
          },
          deps.technicalDeps,
        ),
        loadFinancials(
          {
            allowFallback: false,
            preferDb: true,
            ticker,
          },
          deps.financialsDeps,
        ),
      ]);

      return buildItem({ financials, metadata, technical });
    }),
  );

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
