import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { buildRiskFinancialsRuntimeReadiness } from "@/features/risk/lib/risk-financials-runtime-readiness";
import { buildValuationFinancialsRuntimeReadiness } from "@/features/valuation/lib/valuation-financials-runtime-readiness";
import {
  collectAllowedNumericValues,
  createAssistantContextPacket,
} from "@/lib/ai-rag/context";
import type { AssistantContextPacket } from "@/lib/ai-rag/context";

const FINANCIAL_CONTEXT_MODULES = new Set(["financials", "valuation", "risk"]);
const TICKER_CONTEXT_MODULES = new Set([
  "business",
  "financials",
  "valuation",
  "risk",
  "technical",
  "industry",
  "screening",
  "checklist",
]);

const DEFAULT_CONSTRAINTS = [
  "Only explain facts included in this packet or eligible retrieved RAG chunks.",
  "Do not infer missing values and do not replace missing data with zero.",
  "Do not provide buy, sell, or hold recommendations.",
  "Do not provide fair value, target price, upside, downside, or price predictions.",
  "Do not call a stock good, bad, attractive, promising, or worth buying.",
];

const normalizeTicker = (ticker: string | null | undefined): string | null => {
  const normalized = ticker?.trim().toUpperCase();
  return normalized || null;
};

const periodFromRuntime = (runtimeData: FinancialsRuntimeData): string | null =>
  runtimeData.statementSnapshot?.period ??
  (runtimeData.source.fiscalYear ? String(runtimeData.source.fiscalYear) : null);

const missingNumericFields = (values: Record<string, number | null>): string[] =>
  Object.entries(values)
    .filter(([, value]) => value === null)
    .map(([field]) => field);

export const readAssistantTickerFromSearch = (search: string): string | null =>
  normalizeTicker(new URLSearchParams(search).get("ticker"));

export const buildAssistantScreenContextPacket = ({
  activeModule,
  ticker,
  financialsRuntimeData,
}: {
  activeModule: string;
  ticker: string | null;
  financialsRuntimeData?: FinancialsRuntimeData;
}): AssistantContextPacket => {
  const moduleUsesTicker = TICKER_CONTEXT_MODULES.has(activeModule);
  const normalizedTicker = moduleUsesTicker ? normalizeTicker(ticker) : null;
  const runtimeTicker = normalizeTicker(financialsRuntimeData?.source.ticker);
  const canUseFinancialsContext = Boolean(
    financialsRuntimeData &&
      FINANCIAL_CONTEXT_MODULES.has(activeModule) &&
      normalizedTicker &&
      normalizedTicker === runtimeTicker &&
      financialsRuntimeData.statementSnapshot &&
      !financialsRuntimeData.source.fallbackUsed &&
      financialsRuntimeData.source.readPath !== "sample_static",
  );

  if (!canUseFinancialsContext || !financialsRuntimeData?.statementSnapshot) {
    const missingFields = ["moduleContext", "source", "asOf", "period"];
    if (!normalizedTicker) missingFields.unshift("ticker");

    return createAssistantContextPacket({
      ticker: normalizedTicker,
      activeModule,
      moduleContext: null,
      dataQuality: {
        dataMode: "unavailable",
        status: "insufficient_data",
        productionApproved: false,
        sourceName: null,
        sourceLabel: null,
        asOf: null,
        period: null,
        missingFields,
        warnings: [
          "Screen data context is not available for this module. The assistant must state that context is insufficient.",
        ],
      },
      missingFields,
      allowedNumericValues: [],
      visibleFacts: [
        `Active module: ${activeModule}`,
        normalizedTicker ? `Ticker in workspace URL: ${normalizedTicker}` : "Ticker: not_available",
      ],
      constraints: DEFAULT_CONSTRAINTS,
    });
  }

  const snapshot = financialsRuntimeData.statementSnapshot;
  const period = periodFromRuntime(financialsRuntimeData);
  const missingFields = financialsRuntimeData.dataQuality.missingFields;
  const valuationReadiness = buildValuationFinancialsRuntimeReadiness({
    financialsRuntimeData,
    hasPersistedLocalInputBridge: false,
    valuationConsumesFinancialsRuntime: true,
  });
  const riskReadiness = buildRiskFinancialsRuntimeReadiness({
    financialsRuntimeData,
    hasStaticRiskPath: false,
    riskConsumesFinancialsRuntime: true,
  });
  const financialsEvidence = {
    revenue: snapshot.revenue ?? null,
    netIncome: snapshot.netProfit ?? null,
    operatingCashFlow: snapshot.operatingCashFlow ?? null,
    totalAssets: snapshot.totalAssets ?? null,
    totalEquity: snapshot.totalEquity ?? null,
    totalLiabilities: snapshot.totalLiabilities ?? null,
    totalDebt: riskReadiness.inputSnapshot.totalDebt,
    eps: snapshot.eps ?? null,
    sharesOutstanding: snapshot.sharesOutstanding ?? null,
    closePrice: snapshot.closePrice ?? null,
    missingFields,
  };
  const valuationInputs = {
    marketPrice: valuationReadiness.inputSnapshot.marketPrice,
    eps: valuationReadiness.inputSnapshot.eps,
    sharesOutstanding: valuationReadiness.inputSnapshot.sharesOutstanding,
  };
  const valuationEvidence = {
    ...valuationInputs,
    peStatus: valuationReadiness.calculationReadiness.pe,
    pbStatus: valuationReadiness.calculationReadiness.pb,
    marketCapStatus: valuationReadiness.calculationReadiness.marketCap,
    missingFields: missingNumericFields(valuationInputs),
  };
  const riskInputs = {
    totalDebt: riskReadiness.inputSnapshot.totalDebt,
    totalLiabilities: snapshot.totalLiabilities ?? null,
  };
  const riskEvidence = {
    ...riskInputs,
    totalDebtSource:
      riskReadiness.inputSnapshot.totalDebt === null ? null : "statementSnapshot.totalDebt",
    leverageRiskStatus: riskReadiness.calculationReadiness.leverageRisk,
    missingFields: missingNumericFields(riskInputs),
  };
  const isBank = normalizedTicker === "VCB";

  const moduleContext = {
    moduleKey: activeModule,
    moduleName: activeModule,
    ticker: normalizedTicker,
    companyType: snapshot.companyType ?? null,
    industry: snapshot.industry ?? null,
    period,
    isMockData: false,
    source: snapshot.sourceName ?? financialsRuntimeData.source.sourceLabel,
    timestamp: financialsRuntimeData.source.asOf,
    metrics: financialsEvidence,
    financials: financialsEvidence,
    valuation: valuationEvidence,
    risk: riskEvidence,
    missingFields,
    warnings: [
      ...financialsRuntimeData.dataQuality.warnings,
      ...(isBank ? ["VCB is a bank; corporate debt/leverage interpretation is not applicable. Do not use total liabilities or customer deposits as totalDebt."] : []),
    ],
    ...(isBank && {
      entityType: "bank",
      bankingCaveat: true,
      debtMappingStatus: "needs_bank_mapping",
    }),
  };
  const visibleFacts = [
    `Active module: ${activeModule}`,
    `Ticker in workspace URL: ${normalizedTicker}`,
    `Financial data status: ${financialsRuntimeData.dataQuality.status}`,
    `Source label: ${financialsRuntimeData.source.sourceLabel}`,
    period ? `Financial statement period: ${period}` : "Financial statement period: not_available",
    financialsRuntimeData.source.asOf
      ? `Data as of: ${financialsRuntimeData.source.asOf}`
      : "Data as of: not_available",
    missingFields.length > 0
      ? `Missing financial fields: ${missingFields.join(", ")}`
      : "Missing financial fields: none reported",
    ...(isBank ? ["Entity type: bank. Corporate debt/leverage interpretation is not applicable. Do not use total liabilities or customer deposits as totalDebt."] : []),
  ];

  return createAssistantContextPacket({
    ticker: normalizedTicker,
    activeModule,
    moduleContext,
    dataQuality: {
      dataMode: financialsRuntimeData.source.dataMode,
      status: financialsRuntimeData.dataQuality.status,
      productionApproved: financialsRuntimeData.source.productionApproved,
      sourceName: snapshot.sourceName ?? null,
      sourceLabel: financialsRuntimeData.source.sourceLabel,
      asOf: financialsRuntimeData.source.asOf,
      period,
      missingFields,
      warnings: [
        ...financialsRuntimeData.dataQuality.warnings,
        ...financialsRuntimeData.dataQuality.errors,
      ],
    },
    missingFields,
    allowedNumericValues: collectAllowedNumericValues({
      financials: financialsEvidence,
      valuation: valuationEvidence,
      risk: riskEvidence,
    }),
    visibleFacts,
    constraints: DEFAULT_CONSTRAINTS,
  });
};
