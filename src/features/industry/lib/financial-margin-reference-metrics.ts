export type MarginReferenceTicker = "HPG" | "HSG" | "MWG" | "NKG" | "VNM";

export type FinancialMarginReferenceSourceType = "local_financial_statement" | "local_pdf_reviewed_mapping";

export type FinancialMarginReferenceInput = {
  ticker: MarginReferenceTicker;
  fiscalYear: number;
  revenue: number;
  grossProfit: number;
  netIncome: number;
  sourceLabel: string;
  sourceType?: FinancialMarginReferenceSourceType;
};

export type FinancialMarginReferenceMetric = {
  industryCode: string;
  metricCode: "GROSS_MARGIN_COMPANY_REFERENCE" | "NET_MARGIN_COMPANY_REFERENCE";
  metricName: string;
  metricLabelVi: string;
  metricGroup: "financial_margin_reference";
  value: number;
  unit: "percent";
  periodType: "year";
  periodLabel: string;
  observationDate: string;
  sourceLabel: string;
  sourceKey: string;
  sourceType: FinancialMarginReferenceSourceType;
  evidenceNotes: string;
  warningCodes: string[];
};

const industryCodeByTicker: Record<MarginReferenceTicker, string> = {
  HPG: "STEEL_MATERIALS",
  HSG: "STEEL_MATERIALS",
  MWG: "RETAIL",
  NKG: "STEEL_MATERIALS",
  VNM: "CONSUMER_STAPLES_DAIRY",
};

const industryLabelByTicker: Record<MarginReferenceTicker, string> = {
  HPG: "steel",
  HSG: "steel",
  MWG: "retail",
  NKG: "steel",
  VNM: "consumer staples/dairy",
};

const warningCodes = [
  "RESEARCH_ONLY",
  "NEEDS_REVIEW",
  "SINGLE_COMPANY_REFERENCE_NOT_INDUSTRY_BENCHMARK",
  "NOT_AUTO_COMPARISON",
  "NOT_INVESTMENT_CONCLUSION",
  "DERIVED_FROM_FINANCIAL_STATEMENT",
] as const;

const percent = (numerator: number, denominator: number): number =>
  Number(((numerator / denominator) * 100).toFixed(2));

export const buildFinancialMarginReferenceMetrics = (
  input: FinancialMarginReferenceInput,
): FinancialMarginReferenceMetric[] => {
  const industryCode = industryCodeByTicker[input.ticker];
  const industryLabel = industryLabelByTicker[input.ticker];
  const periodLabel = `FY${input.fiscalYear}`;
  const observationDate = `${input.fiscalYear}-12-31T00:00:00.000Z`;
  const sourceType = input.sourceType ?? "local_financial_statement";
  const base = {
    industryCode,
    metricGroup: "financial_margin_reference" as const,
    observationDate,
    periodLabel,
    periodType: "year" as const,
    sourceLabel: input.sourceLabel,
    sourceType,
    unit: "percent" as const,
    warningCodes: [...warningCodes],
  };

  return [
    {
      ...base,
      evidenceNotes: `${input.ticker} ${periodLabel} gross margin derived from grossProfit / net revenue. This is a single-company reference for ${industryLabel}, not an industry benchmark.`,
      metricCode: "GROSS_MARGIN_COMPANY_REFERENCE",
      metricLabelVi: `Biên gộp tham chiếu ${input.ticker} ${periodLabel}`,
      metricName: `${input.ticker} ${periodLabel} gross margin reference`,
      sourceKey: `${industryCode}:GROSS_MARGIN_COMPANY_REFERENCE:${input.ticker}:${periodLabel}`,
      value: percent(input.grossProfit, input.revenue),
    },
    {
      ...base,
      evidenceNotes: `${input.ticker} ${periodLabel} net margin derived from netIncome / net revenue. This is a single-company reference for ${industryLabel}, not an industry benchmark.`,
      metricCode: "NET_MARGIN_COMPANY_REFERENCE",
      metricLabelVi: `Biên ròng tham chiếu ${input.ticker} ${periodLabel}`,
      metricName: `${input.ticker} ${periodLabel} net margin reference`,
      sourceKey: `${industryCode}:NET_MARGIN_COMPANY_REFERENCE:${input.ticker}:${periodLabel}`,
      value: percent(input.netIncome, input.revenue),
    },
  ];
};
