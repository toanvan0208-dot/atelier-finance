export type ControlledValuationMetricStatus = "ready" | "insufficient_data" | "not_applicable" | "blocked";

export type ControlledValuationMetricResult = {
  status: ControlledValuationMetricStatus;
  value: number | null;
  reason: string;
  requiredInputs: string[];
  missingInputs: string[];
  sourceInputs: string[];
};

export type ControlledValuationBlockedMetricResult = ControlledValuationMetricResult & {
  status: "blocked";
};

export type ControlledValuationCalculationInput = {
  financials?: {
    revenue?: number | null;
    netIncome?: number | null;
    equity?: number | null;
    eps?: number | null;
    sharesOutstanding?: number | null;
  };
  market?: {
    marketPrice?: number | null;
    marketCap?: number | null;
  };
  source?: {
    financialsSourceMode?: string | null;
    marketSourceMode?: string | null;
    dataMode?: string | null;
    productionApproved?: boolean | null;
    mixedSource?: boolean | null;
    fallbackUsed?: boolean | null;
  };
};

export type ControlledValuationCalculationResult = {
  metrics: {
    pe: ControlledValuationMetricResult;
    bvps: ControlledValuationMetricResult;
    pb: ControlledValuationMetricResult;
    ps: ControlledValuationMetricResult;
    marketCap: ControlledValuationMetricResult;
  };
  blockedMetrics: {
    ev: ControlledValuationBlockedMetricResult;
    evToEbitda: ControlledValuationBlockedMetricResult;
    dcf: ControlledValuationBlockedMetricResult;
    fairValueRange: ControlledValuationBlockedMetricResult;
  };
  sourceBoundary: {
    canClaimValuationDbBacked: false;
    productionApproved: false;
    mixedSource: boolean;
    warnings: string[];
  };
  readinessSummary: {
    readyCount: number;
    blockedCount: number;
    insufficientDataCount: number;
    notApplicableCount: number;
  };
  forbiddenInterpretation: {
    hasRecommendation: false;
    hasCheapExpensiveClaim: false;
  };
};

const isFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isPositiveNumber = (value: number | null | undefined): value is number =>
  isFiniteNumber(value) && value > 0;

const metricResult = ({
  missingInputs = [],
  reason,
  requiredInputs,
  sourceInputs,
  status,
  value,
}: ControlledValuationMetricResult): ControlledValuationMetricResult => ({
  status,
  value,
  reason,
  requiredInputs,
  missingInputs,
  sourceInputs,
});

const blockedMetric = (
  reason: string,
  requiredInputs: string[],
): ControlledValuationBlockedMetricResult => ({
  status: "blocked",
  value: null,
  reason,
  requiredInputs,
  missingInputs: requiredInputs,
  sourceInputs: [],
});

const buildMarketCap = (input: ControlledValuationCalculationInput): ControlledValuationMetricResult => {
  const marketCap = input.market?.marketCap;
  const marketPrice = input.market?.marketPrice;
  const sharesOutstanding = input.financials?.sharesOutstanding;

  if (isPositiveNumber(marketCap)) {
    return metricResult({
      status: "ready",
      value: marketCap,
      reason: "ready_from_direct_market_cap",
      requiredInputs: ["marketCap"],
      missingInputs: [],
      sourceInputs: ["market.marketCap"],
    });
  }

  if (!isPositiveNumber(marketPrice) || !isPositiveNumber(sharesOutstanding)) {
    const missingInputs = [
      ...(!isPositiveNumber(marketPrice) ? ["marketPrice"] : []),
      ...(!isPositiveNumber(sharesOutstanding) ? ["sharesOutstanding"] : []),
    ];

    return metricResult({
      status: "insufficient_data",
      value: null,
      reason: "missing_valid_market_price_or_shares",
      requiredInputs: ["marketPrice", "sharesOutstanding"],
      missingInputs,
      sourceInputs: [],
    });
  }

  return metricResult({
    status: "ready",
    value: marketPrice * sharesOutstanding,
    reason: "ready_from_market_price_and_shares",
    requiredInputs: ["marketPrice", "sharesOutstanding"],
    missingInputs: [],
    sourceInputs: ["market.marketPrice", "financials.sharesOutstanding"],
  });
};

const buildPe = (input: ControlledValuationCalculationInput): ControlledValuationMetricResult => {
  const eps = input.financials?.eps;
  const marketPrice = input.market?.marketPrice;

  if (eps === null || eps === undefined) {
    return metricResult({
      status: "insufficient_data",
      value: null,
      reason: "missing_eps",
      requiredInputs: ["marketPrice", "eps"],
      missingInputs: ["eps"],
      sourceInputs: [],
    });
  }

  if (!isPositiveNumber(eps)) {
    return metricResult({
      status: "not_applicable",
      value: null,
      reason: "eps_non_positive",
      requiredInputs: ["marketPrice", "eps"],
      missingInputs: [],
      sourceInputs: ["financials.eps"],
    });
  }

  if (!isPositiveNumber(marketPrice)) {
    return metricResult({
      status: "insufficient_data",
      value: null,
      reason: "missing_valid_market_price",
      requiredInputs: ["marketPrice", "eps"],
      missingInputs: ["marketPrice"],
      sourceInputs: ["financials.eps"],
    });
  }

  return metricResult({
    status: "ready",
    value: marketPrice / eps,
    reason: "ready",
    requiredInputs: ["marketPrice", "eps"],
    missingInputs: [],
    sourceInputs: ["market.marketPrice", "financials.eps"],
  });
};

const buildBvps = (input: ControlledValuationCalculationInput): ControlledValuationMetricResult => {
  const equity = input.financials?.equity;
  const sharesOutstanding = input.financials?.sharesOutstanding;

  if (equity === null || equity === undefined) {
    return metricResult({
      status: "insufficient_data",
      value: null,
      reason: "missing_equity",
      requiredInputs: ["equity", "sharesOutstanding"],
      missingInputs: ["equity"],
      sourceInputs: [],
    });
  }

  if (!isPositiveNumber(equity)) {
    return metricResult({
      status: "not_applicable",
      value: null,
      reason: "equity_non_positive",
      requiredInputs: ["equity", "sharesOutstanding"],
      missingInputs: [],
      sourceInputs: ["financials.equity"],
    });
  }

  if (!isPositiveNumber(sharesOutstanding)) {
    return metricResult({
      status: "insufficient_data",
      value: null,
      reason: "missing_valid_shares",
      requiredInputs: ["equity", "sharesOutstanding"],
      missingInputs: ["sharesOutstanding"],
      sourceInputs: ["financials.equity"],
    });
  }

  return metricResult({
    status: "ready",
    value: equity / sharesOutstanding,
    reason: "ready",
    requiredInputs: ["equity", "sharesOutstanding"],
    missingInputs: [],
    sourceInputs: ["financials.equity", "financials.sharesOutstanding"],
  });
};

const buildPb = (
  input: ControlledValuationCalculationInput,
  bvps: ControlledValuationMetricResult,
): ControlledValuationMetricResult => {
  const marketPrice = input.market?.marketPrice;

  if (bvps.status === "not_applicable") {
    return metricResult({
      status: "not_applicable",
      value: null,
      reason: bvps.reason,
      requiredInputs: ["marketPrice", "bvps"],
      missingInputs: [],
      sourceInputs: bvps.sourceInputs,
    });
  }

  if (bvps.status !== "ready" || !isPositiveNumber(bvps.value)) {
    return metricResult({
      status: "insufficient_data",
      value: null,
      reason: "bvps_not_ready",
      requiredInputs: ["marketPrice", "bvps"],
      missingInputs: bvps.missingInputs.length ? bvps.missingInputs : ["bvps"],
      sourceInputs: bvps.sourceInputs,
    });
  }

  if (!isPositiveNumber(marketPrice)) {
    return metricResult({
      status: "insufficient_data",
      value: null,
      reason: "missing_valid_market_price",
      requiredInputs: ["marketPrice", "bvps"],
      missingInputs: ["marketPrice"],
      sourceInputs: bvps.sourceInputs,
    });
  }

  return metricResult({
    status: "ready",
    value: marketPrice / bvps.value,
    reason: "ready",
    requiredInputs: ["marketPrice", "bvps"],
    missingInputs: [],
    sourceInputs: ["market.marketPrice", ...bvps.sourceInputs],
  });
};

const buildPs = (
  input: ControlledValuationCalculationInput,
  marketCap: ControlledValuationMetricResult,
): ControlledValuationMetricResult => {
  const revenue = input.financials?.revenue;

  if (revenue === null || revenue === undefined) {
    return metricResult({
      status: "insufficient_data",
      value: null,
      reason: "missing_revenue",
      requiredInputs: ["marketCap", "revenue"],
      missingInputs: ["revenue"],
      sourceInputs: marketCap.sourceInputs,
    });
  }

  if (!isPositiveNumber(revenue)) {
    return metricResult({
      status: "not_applicable",
      value: null,
      reason: "revenue_non_positive",
      requiredInputs: ["marketCap", "revenue"],
      missingInputs: [],
      sourceInputs: ["financials.revenue", ...marketCap.sourceInputs],
    });
  }

  if (marketCap.status !== "ready" || !isPositiveNumber(marketCap.value)) {
    return metricResult({
      status: "insufficient_data",
      value: null,
      reason: "market_cap_not_ready",
      requiredInputs: ["marketCap", "revenue"],
      missingInputs: marketCap.missingInputs.length ? marketCap.missingInputs : ["marketCap"],
      sourceInputs: ["financials.revenue", ...marketCap.sourceInputs],
    });
  }

  return metricResult({
    status: "ready",
    value: marketCap.value / revenue,
    reason: "ready",
    requiredInputs: ["marketCap", "revenue"],
    missingInputs: [],
    sourceInputs: ["financials.revenue", ...marketCap.sourceInputs],
  });
};

const sourceBoundary = (
  source: ControlledValuationCalculationInput["source"],
): ControlledValuationCalculationResult["sourceBoundary"] => {
  const dataMode = source?.dataMode ?? "";
  const sourceModes = [source?.financialsSourceMode, source?.marketSourceMode].filter(Boolean);
  const sourceModesDiffer = new Set(sourceModes).size > 1;
  const mixedSource = Boolean(source?.mixedSource) || sourceModesDiffer;
  const warnings = [
    ...(mixedSource ? ["valuation_remains_mixed_source"] : []),
    ...(dataMode === "research_only" || dataMode === "sample" || dataMode === "local"
      ? ["local_research_data_not_production_approved"]
      : []),
    ...(source?.fallbackUsed ? ["fallback_data_not_production_approved"] : []),
    ...(source?.productionApproved === true ? [] : ["source_not_approved_for_runtime_claim"]),
  ];

  return {
    canClaimValuationDbBacked: false,
    productionApproved: false,
    mixedSource,
    warnings: Array.from(new Set(warnings)),
  };
};

export const buildControlledValuationCalculation = (
  input: ControlledValuationCalculationInput = {},
): ControlledValuationCalculationResult => {
  const marketCap = buildMarketCap(input);
  const pe = buildPe(input);
  const bvps = buildBvps(input);
  const pb = buildPb(input, bvps);
  const ps = buildPs(input, marketCap);
  const metrics = { pe, bvps, pb, ps, marketCap };
  const blockedMetrics = {
    ev: blockedMetric("blocked_until_explicit_ev_inputs", ["marketCap", "totalDebt", "cashAndEquivalents"]),
    evToEbitda: blockedMetric("blocked_until_ebitda_source_is_explicit", ["enterpriseValue", "ebitda"]),
    dcf: blockedMetric("blocked_no_dcf_wacc_in_phase_59", ["cashFlowSeries", "wacc", "terminalGrowth"]),
    fairValueRange: blockedMetric("blocked_no_intrinsic_value_band_in_phase_59", ["intrinsicValueModel"]),
  };
  const metricValues = Object.values(metrics);

  return {
    metrics,
    blockedMetrics,
    sourceBoundary: sourceBoundary(input.source),
    readinessSummary: {
      readyCount: metricValues.filter((metric) => metric.status === "ready").length,
      blockedCount: Object.keys(blockedMetrics).length,
      insufficientDataCount: metricValues.filter((metric) => metric.status === "insufficient_data").length,
      notApplicableCount: metricValues.filter((metric) => metric.status === "not_applicable").length,
    },
    forbiddenInterpretation: {
      hasRecommendation: false,
      hasCheapExpensiveClaim: false,
    },
  };
};
