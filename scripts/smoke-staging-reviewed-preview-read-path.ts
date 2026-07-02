const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"] as const;
const SOURCE_LABEL = "annual_report_2025_pdf_reviewed_preview";
const DATA_MODE = "research_only";
const FORBIDDEN_OUTPUT_PATTERNS = [
  /\b(should|must|recommend(?:ed)? to|recommendation to)\s+(buy|sell|hold)\b/i,
  /\b(buy|sell|hold)\s+(now|today|this stock|the stock)\b/i,
  /\btrading signal\b/i,
  /\btarget price\s+(is|of|:)\b/i,
  /\bfair value\s+(is|of|:)\b/i,
  /\b(upside|downside)\s+(is|of|:)\b/i,
  /\bproduction-approved\b/i,
  /\bofficial investment-grade\b/i,
];

type FinancialsApiResponse = {
  ok: boolean;
  data?: {
    id: string;
    ticker: string;
    sourceLabel: string;
    dataMode: string;
    eps: string | number | null;
    sharesOutstanding: string | number | null;
    totalDebt: string | number | null;
    revenue: string | number | null;
    netIncome: string | number | null;
    totalAssets: string | number | null;
    equity: string | number | null;
    operatingCashFlow: string | number | null;
  };
  error?: { code: string; message: string };
};

const normalizeDatabaseUrlForPg = (): void => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is required for staging smoke.");
  const url = new URL(dbUrl);
  url.searchParams.delete("sslmode");
  process.env.DATABASE_URL = url.toString();
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const assertNoForbiddenOutput = (label: string, text: string): void => {
  const pattern = FORBIDDEN_OUTPUT_PATTERNS.find((candidate) => candidate.test(text));
  if (pattern) throw new Error(`${label} contained forbidden output pattern: ${pattern}`);
};

const main = async (): Promise<void> => {
  normalizeDatabaseUrlForPg();

  const [{ GET: financialsGet }, { buildAssistantRuntime }, { loadFinancialsRuntimeData }, { buildBasicValuationSummary }, { buildMissingDataRiskSummary }] =
    await Promise.all([
      import("../src/app/api/companies/[ticker]/financials/route"),
      import("../src/lib/ai-rag/runtime"),
      import("../src/features/financials/lib/load-financials-runtime-data"),
      import("../src/lib/financial-logic"),
      import("../src/features/risk/lib/build-risk-desk-data"),
    ]);

  const readApiLatest = async (ticker: string): Promise<FinancialsApiResponse> => {
    const request = new Request(
      `http://localhost/api/companies/${ticker}/financials?latest=true&dataMode=${DATA_MODE}`,
    );
    const response = await financialsGet(request, { params: { ticker } });
    const body = (await response.json()) as FinancialsApiResponse;
    if (!response.ok || !body.ok || !body.data) {
      throw new Error(`${ticker} API read failed: ${body.error?.code ?? response.status}`);
    }
    return body;
  };

  const smokeTicker = async (ticker: string) => {
    const api = await readApiLatest(ticker);
    const data = api.data;
    if (!data) throw new Error(`${ticker} API returned no data.`);
    if (data.ticker !== ticker) throw new Error(`${ticker} API ticker mismatch: ${data.ticker}`);
    if (data.sourceLabel !== SOURCE_LABEL) throw new Error(`${ticker} sourceLabel mismatch: ${data.sourceLabel}`);
    if (data.dataMode !== DATA_MODE) throw new Error(`${ticker} dataMode mismatch: ${data.dataMode}`);

    for (const field of ["revenue", "netIncome", "totalAssets", "equity", "operatingCashFlow"] as const) {
      if (data[field] !== null) throw new Error(`${ticker} rejected field ${field} was non-null in API read path.`);
    }

    const values = {
      eps: toNumberOrNull(data.eps),
      sharesOutstanding: toNumberOrNull(data.sharesOutstanding),
      totalDebt: toNumberOrNull(data.totalDebt),
    };
    if (Object.entries(values).some(([, value]) => value === 0)) {
      throw new Error(`${ticker} API read path converted a missing value to zero.`);
    }

    const runtime = await loadFinancialsRuntimeData({
      ticker,
      preferDb: true,
      allowFallback: false,
      dataMode: DATA_MODE,
    });
    if (runtime.source.sourceLabel !== SOURCE_LABEL) {
      throw new Error(`${ticker} runtime sourceLabel mismatch: ${runtime.source.sourceLabel}`);
    }
    if (runtime.source.productionApproved !== false) {
      throw new Error(`${ticker} runtime productionApproved was not false.`);
    }
    if (runtime.source.fallbackUsed !== false || runtime.runtimeStatus !== "db_backed") {
      throw new Error(`${ticker} runtime did not use DB-backed reviewed-preview data.`);
    }
    if (runtime.statementSnapshot?.totalDebt !== values.totalDebt) {
      throw new Error(`${ticker} totalDebt mismatch between API and runtime.`);
    }
    if (runtime.statementSnapshot?.totalLiabilities !== null && runtime.statementSnapshot?.totalLiabilities !== undefined) {
      throw new Error(`${ticker} totalLiabilities appeared in runtime for reviewed-preview scope.`);
    }

    const valuation = buildBasicValuationSummary({
      ticker,
      eps: runtime.statementSnapshot?.eps ?? null,
      bvps: null,
      closePrice: runtime.statementSnapshot?.closePrice ?? null,
      sharesOutstanding: runtime.statementSnapshot?.sharesOutstanding ?? null,
      netProfit: runtime.statementSnapshot?.netProfit ?? null,
      revenue: runtime.statementSnapshot?.revenue ?? null,
      totalAssets: runtime.statementSnapshot?.totalAssets ?? null,
      totalEquity: runtime.statementSnapshot?.totalEquity ?? null,
      totalDebt: runtime.statementSnapshot?.totalDebt ?? null,
      cashAndEquivalents: runtime.statementSnapshot?.cashAndEquivalents ?? null,
      ebitda: null,
      operatingCashFlow: runtime.statementSnapshot?.operatingCashFlow ?? null,
      capitalExpenditure: runtime.statementSnapshot?.capitalExpenditure ?? null,
      sourceName: runtime.source.sourceLabel,
      period: runtime.statementSnapshot?.period ?? undefined,
      periodType: runtime.statementSnapshot?.periodType ?? undefined,
    });
    assertNoForbiddenOutput(`${ticker} valuation smoke`, JSON.stringify(valuation));

    const risk = buildMissingDataRiskSummary({
      ticker,
      sourceName: runtime.source.sourceLabel,
      collectedAt: runtime.source.asOf ?? undefined,
      period: runtime.statementSnapshot?.period ?? undefined,
      eps: runtime.statementSnapshot?.eps ?? null,
      totalDebt: runtime.statementSnapshot?.totalDebt ?? null,
      totalEquity: runtime.statementSnapshot?.totalEquity ?? null,
      sharesOutstanding: runtime.statementSnapshot?.sharesOutstanding ?? null,
      revenue: runtime.statementSnapshot?.revenue ?? null,
      closePrice: runtime.statementSnapshot?.closePrice ?? null,
      operatingCashFlow: runtime.statementSnapshot?.operatingCashFlow ?? null,
      netProfit: runtime.statementSnapshot?.netProfit ?? null,
    });
    if (risk.productionApproved !== false || risk.dataMode !== DATA_MODE) {
      throw new Error(`${ticker} risk smoke did not preserve research-only/unapproved boundary.`);
    }
    assertNoForbiddenOutput(`${ticker} risk smoke`, JSON.stringify(risk));

    const assistant = buildAssistantRuntime({
      question: `Explain ${ticker} financials and valuation limits without giving investment advice.`,
      activeModule: "valuation",
      ticker,
      moduleContext: {
        moduleKey: "valuation",
        ticker,
        financials: runtime.statementSnapshot ?? {},
        missingFields: runtime.dataQuality.missingFields,
      },
      dataQuality: {
        overallStatus: runtime.dataQuality.status,
        isMockData: false,
        missingFields: runtime.dataQuality.missingFields,
        sourceIssues: [],
        periodIssues: [],
        dataMode: runtime.source.dataMode,
        productionApproved: runtime.source.productionApproved,
        sourceName: runtime.source.sourceLabel,
        sourceLabel: runtime.source.sourceLabel,
        asOf: runtime.source.asOf,
        period: runtime.statementSnapshot?.period ?? null,
        warnings: runtime.dataQuality.warnings,
      },
      allowedNumericValues: Object.values(values).filter((value): value is number => value !== null),
      source: runtime.source.sourceLabel,
      timestamp: runtime.source.asOf,
    });
    if (!assistant.debug.noLlmCall || !assistant.debug.noApiCall) {
      throw new Error(`${ticker} assistant smoke unexpectedly required provider/API call.`);
    }
    if (!assistant.prompt.promptText.toLowerCase().includes("never recommend buy/sell/hold")) {
      throw new Error(`${ticker} assistant prompt did not include buy/sell/hold guardrail.`);
    }
    if (!assistant.prompt.promptText.toLowerCase().includes("never provide trading signals")) {
      throw new Error(`${ticker} assistant prompt did not include no trading signals guardrail.`);
    }

    return {
      ticker,
      api: {
        id: data.id,
        sourceLabel: data.sourceLabel,
        dataMode: data.dataMode,
        eps: values.eps,
        sharesOutstanding: values.sharesOutstanding,
        totalDebt: values.totalDebt,
        rejectedFieldsNull: true,
      },
      runtime: {
        status: runtime.runtimeStatus,
        productionApproved: runtime.source.productionApproved,
        fallbackUsed: runtime.source.fallbackUsed,
        missingFields: runtime.dataQuality.missingFields,
      },
      valuation: {
        readiness: valuation.readiness.status,
        forbiddenOutput: false,
      },
      risk: {
        readiness: risk.overallDataReadiness,
        productionApproved: risk.productionApproved,
        forbiddenOutput: false,
      },
      assistant: {
        noLlmCall: assistant.debug.noLlmCall,
        noApiCall: assistant.debug.noApiCall,
        detectedIntent: assistant.detectedIntent,
        sourceLabelIncluded: assistant.prompt.promptText.includes(SOURCE_LABEL),
        productionApprovedFalseIncluded: assistant.prompt.promptText.includes("Production approved: no"),
        forbiddenOutput: false,
      },
    };
  };

  const results = [];
  for (const ticker of APPROVED_TICKERS) {
    results.push(await smokeTicker(ticker));
  }

  const vcbRequest = new Request(
    `http://localhost/api/companies/VCB/financials?latest=true&dataMode=${DATA_MODE}`,
  );
  const vcbResponse = await financialsGet(vcbRequest, { params: { ticker: "VCB" } });
  const vcbBody = (await vcbResponse.json()) as FinancialsApiResponse;
  if (vcbResponse.ok && vcbBody.ok && vcbBody.data?.sourceLabel === SOURCE_LABEL) {
    throw new Error("VCB appeared in corporate reviewed-preview API read path.");
  }

  console.log(
    JSON.stringify(
      {
        status: "passed",
        route: "/api/companies/[ticker]/financials?latest=true&dataMode=research_only",
        sourceLabel: SOURCE_LABEL,
        dataMode: DATA_MODE,
        approvedTickers: APPROVED_TICKERS,
        vcbCorporateReviewedPreviewApiImport: false,
        results,
      },
      null,
      2,
    ),
  );
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

export {};
