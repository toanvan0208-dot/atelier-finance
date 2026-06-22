import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import {
  collectAllowedNumericValues,
  createAssistantContextPacket,
} from "@/lib/ai-rag/context";
import type { AssistantContextPacket } from "@/lib/ai-rag/context";

const FINANCIAL_CONTEXT_MODULES = new Set(["financials", "valuation", "risk"]);

const DEFAULT_CONSTRAINTS = [
  "Only explain facts included in this packet or eligible retrieved RAG chunks.",
  "Do not infer missing values and do not replace missing data with zero.",
  "Do not provide buy, sell, or hold recommendations.",
  "Do not create fair value, target price, upside, downside, or price predictions.",
];

const normalizeTicker = (ticker: string | null | undefined): string | null => {
  const normalized = ticker?.trim().toUpperCase();
  return normalized || null;
};

const periodFromRuntime = (runtimeData: FinancialsRuntimeData): string | null =>
  runtimeData.statementSnapshot?.period ??
  (runtimeData.source.fiscalYear ? String(runtimeData.source.fiscalYear) : null);

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
  const normalizedTicker = normalizeTicker(ticker);
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
    metrics: snapshot,
    missingFields,
    warnings: financialsRuntimeData.dataQuality.warnings,
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
      warnings: [
        ...financialsRuntimeData.dataQuality.warnings,
        ...financialsRuntimeData.dataQuality.errors,
      ],
    },
    missingFields,
    allowedNumericValues: collectAllowedNumericValues({ moduleContext, visibleFacts }),
    visibleFacts,
    constraints: DEFAULT_CONSTRAINTS,
  });
};
