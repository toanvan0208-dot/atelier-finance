import type { FinancialStatementInput } from "../financial-logic";
import {
  calculateBvps,
  calculatePbRatio,
  calculatePeRatio,
  calculateRoe,
} from "../financial-logic";
import type {
  DataContractMetricResult,
  DataSourceMetadata,
  FinancialStatementRecord,
  MarketDataRecord,
  ReadinessStatus,
  ValuationInputRecord,
} from "./types";
import {
  collectMissingFields,
  deriveMetadataFromInputs,
  isMissingValue,
  isUsableNumber,
  safeRatio,
  validateEquityInterpretation,
  validatePeInterpretation,
} from "./validation";

export type BridgeMetadata = {
  statement: DataSourceMetadata;
  market?: DataSourceMetadata;
  valuation?: DataSourceMetadata;
  combined: DataSourceMetadata;
};

export type FinancialsBridgeOutput = {
  logicInput: FinancialStatementInput;
  metadata: BridgeMetadata;
  readiness: ReadinessStatus;
  missingFields: string[];
  warnings: DataSourceMetadata["warnings"];
  contractMetrics: {
    roa: DataContractMetricResult;
    cfoToAssets: DataContractMetricResult;
    roeInterpretation: DataContractMetricResult<null>;
  };
};

export type ValuationBridgeOutput = {
  logicInput: FinancialStatementInput;
  metadata: BridgeMetadata;
  readiness: ReadinessStatus;
  missingFields: string[];
  warnings: DataSourceMetadata["warnings"];
  contractMetrics: {
    peInterpretation: DataContractMetricResult<null>;
    equityInterpretation: DataContractMetricResult<null>;
  };
  moduleMetrics: {
    peRatio: ReturnType<typeof calculatePeRatio>;
    pbRatio: ReturnType<typeof calculatePbRatio>;
    bvps: ReturnType<typeof calculateBvps>;
    roe: ReturnType<typeof calculateRoe>;
  };
};

const toLogicPeriodType = (
  periodType: DataSourceMetadata["period"],
): FinancialStatementInput["periodType"] => {
  if (periodType?.type === "quarter") return "quarter";
  if (periodType?.type === "ttm") return "ttm";
  if (periodType?.type === "year") return "annual";
  return "unknown";
};

const readinessFromMissingAndMetadata = (
  missingFields: string[],
  metadata: DataSourceMetadata,
): ReadinessStatus => {
  if (missingFields.length > 0) return "insufficient_data";
  if (metadata.isStale || metadata.isDemoData) return "needs_review";
  return "ready";
};

const normalizeNumber = (value: number | null | undefined): number | null =>
  isUsableNumber(value) ? value : null;

export const bridgeFinancialsContract = ({
  statement,
  market,
}: {
  statement: FinancialStatementRecord;
  market?: MarketDataRecord;
}): FinancialsBridgeOutput => {
  const combinedMetadata = deriveMetadataFromInputs(
    market ? [statement.metadata, market.metadata] : [statement.metadata],
    {},
    "module-bridge-v1",
  );
  const missingFields = [
    ...collectMissingFields(statement, ["ticker", "netIncome", "totalAssets", "equity"]),
    ...combinedMetadata.missingFields,
  ];
  const logicInput: FinancialStatementInput = {
    ticker: statement.ticker ?? undefined,
    companyType: statement.companyType,
    period: statement.metadata.period?.value,
    periodType: toLogicPeriodType(statement.metadata.period),
    sourceName: statement.metadata.source,
    collectedAt: statement.metadata.collectedAt,
    revenue: normalizeNumber(statement.revenue),
    grossProfit: normalizeNumber(statement.grossProfit),
    netProfit: normalizeNumber(statement.netIncome),
    totalAssets: normalizeNumber(statement.totalAssets),
    totalEquity: normalizeNumber(statement.equity),
    totalDebt: normalizeNumber(statement.totalDebt),
    currentAssets: normalizeNumber(statement.currentAssets),
    currentLiabilities: normalizeNumber(statement.currentLiabilities),
    operatingCashFlow: normalizeNumber(statement.operatingCashFlow),
    closePrice: normalizeNumber(market?.closePrice),
    volume: normalizeNumber(market?.volume),
  };

  const roa = safeRatio(
    statement.netIncome,
    statement.totalAssets,
    combinedMetadata,
    "roa",
  );
  const cfoToAssets = safeRatio(
    statement.operatingCashFlow,
    statement.totalAssets,
    combinedMetadata,
    "cfoToAssets",
  );
  const roeInterpretation = validateEquityInterpretation({
    equity: statement.equity,
    metadata: combinedMetadata,
  });

  return {
    logicInput,
    metadata: {
      statement: statement.metadata,
      market: market?.metadata,
      combined: combinedMetadata,
    },
    readiness: readinessFromMissingAndMetadata(missingFields, combinedMetadata),
    missingFields,
    warnings: combinedMetadata.warnings,
    contractMetrics: {
      roa,
      cfoToAssets,
      roeInterpretation,
    },
  };
};

export const bridgeValuationContract = ({
  statement,
  market,
  valuation,
}: {
  statement: FinancialStatementRecord;
  market?: MarketDataRecord;
  valuation?: ValuationInputRecord;
}): ValuationBridgeOutput => {
  const inputMetadata = [
    statement.metadata,
    ...(market ? [market.metadata] : []),
    ...(valuation ? [valuation.metadata] : []),
  ];
  const combinedMetadata = deriveMetadataFromInputs(inputMetadata, {}, "module-bridge-v1");
  const closePrice = normalizeNumber(market?.closePrice);
  const eps = normalizeNumber(valuation?.eps ?? null);
  const bvps = normalizeNumber(valuation?.bvps ?? null);
  const sharesOutstanding = normalizeNumber(valuation?.sharesOutstanding ?? null);
  const missingFields = [
    ...(isMissingValue(closePrice) ? ["closePrice"] : []),
    ...(isMissingValue(eps) && isMissingValue(bvps) && isMissingValue(sharesOutstanding)
      ? ["eps", "bvps", "sharesOutstanding"]
      : []),
    ...combinedMetadata.missingFields,
  ];
  const equityNotConventional = isUsableNumber(statement.equity) && statement.equity <= 0;
  const safeBvps = equityNotConventional ? null : bvps;
  const logicInput: FinancialStatementInput = {
    ticker: statement.ticker ?? valuation?.ticker ?? market?.ticker ?? undefined,
    companyType: statement.companyType,
    period: valuation?.metadata.period?.value ?? statement.metadata.period?.value,
    periodType: toLogicPeriodType(valuation?.metadata.period ?? statement.metadata.period),
    sourceName: combinedMetadata.source,
    collectedAt: combinedMetadata.collectedAt,
    revenue: normalizeNumber(statement.revenue),
    netProfit: normalizeNumber(statement.netIncome),
    totalAssets: normalizeNumber(statement.totalAssets),
    totalEquity: normalizeNumber(statement.equity),
    totalDebt: normalizeNumber(statement.totalDebt),
    operatingCashFlow: normalizeNumber(statement.operatingCashFlow),
    sharesOutstanding,
    eps,
    bvps: safeBvps,
    closePrice,
  };
  const peInterpretation = validatePeInterpretation({
    eps,
    metadata: combinedMetadata,
  });
  const equityInterpretation = validateEquityInterpretation({
    equity: statement.equity,
    metadata: combinedMetadata,
  });
  const moduleMetrics = {
    peRatio: calculatePeRatio(logicInput),
    pbRatio: calculatePbRatio(logicInput),
    bvps: calculateBvps(logicInput),
    roe: calculateRoe(logicInput),
  };
  const status: ReadinessStatus =
    peInterpretation.status === "not_ready" || equityInterpretation.status === "needs_review"
      ? "needs_review"
      : readinessFromMissingAndMetadata(missingFields, combinedMetadata);

  return {
    logicInput,
    metadata: {
      statement: statement.metadata,
      market: market?.metadata,
      valuation: valuation?.metadata,
      combined: combinedMetadata,
    },
    readiness: missingFields.length > 0 ? "not_ready" : status,
    missingFields,
    warnings: [
      ...combinedMetadata.warnings,
      ...peInterpretation.warnings,
      ...equityInterpretation.warnings,
    ],
    contractMetrics: {
      peInterpretation,
      equityInterpretation,
    },
    moduleMetrics,
  };
};

