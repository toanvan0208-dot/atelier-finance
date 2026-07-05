import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const parseEnvLine = (line: string): [string, string] | null => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex <= 0) return null;

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return key ? [key, value] : null;
};

const loadEnvFileIfPresent = (filePath: string): void => {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;

    const [key, value] = parsed;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const loadLocalEnv = (): void => {
  const cwd = process.cwd();
  loadEnvFileIfPresent(join(cwd, ".env.local"));
  loadEnvFileIfPresent(join(cwd, ".env"));
};

loadLocalEnv();

type LiveCase = {
  id: string;
  module: string;
  ticker: string | null;
  question: string;
  maxAnswerLength: number;
  disallowTickerLeak?: string[];
  disallowSourceTalk?: boolean;
};

type AssistantApiResponse = {
  ok: boolean;
  answer: string | null;
  llmStatus: string;
  message?: string;
  violations?: Array<{ code: string; message?: string }>;
  providerResponse?: {
    providerId?: string;
    model?: string;
    error?: string;
  };
  runtime?: {
    detectedIntent?: string;
    selectedDocuments?: Array<{ id: string }>;
  } | null;
};

type LiveResult = {
  id: string;
  module: string;
  ticker: string | null;
  status: number;
  ok: boolean;
  llmStatus: string;
  detectedIntent: string | null;
  selectedDocumentCount: number;
  answerLength: number;
  passed: boolean;
  failures: string[];
  warnings: string[];
};

const liveCases: LiveCase[] = [
  {
    id: "macro-interest-rate-no-ticker",
    module: "macro",
    ticker: null,
    question: "Lai suat anh huong co phieu nhu the nao?",
    maxAnswerLength: 900,
    disallowTickerLeak: ["HPG", "FPT", "MWG"],
    disallowSourceTalk: true,
  },
  {
    id: "industry-risk-steel",
    module: "industry",
    ticker: "HPG",
    question: "Rui ro nganh thep can kiem tra la gi?",
    maxAnswerLength: 900,
    disallowSourceTalk: true,
  },
  {
    id: "screening-vs-thesis",
    module: "screening",
    ticker: null,
    question: "Tieu chi loc co phai thesis khong?",
    maxAnswerLength: 850,
    disallowTickerLeak: ["HPG"],
    disallowSourceTalk: true,
  },
  {
    id: "financials-cfo-negative",
    module: "financials",
    ticker: "HPG",
    question: "Loi nhuan duong nhung CFO am nghia la gi?",
    maxAnswerLength: 900,
    disallowSourceTalk: true,
  },
  {
    id: "valuation-pe-low",
    module: "valuation",
    ticker: "HPG",
    question: "P/E thap co nghia la co phieu re khong?",
    maxAnswerLength: 900,
    disallowSourceTalk: true,
  },
  {
    id: "risk-main-checks",
    module: "risk",
    ticker: "HPG",
    question: "Rui ro chinh can doc la gi?",
    maxAnswerLength: 900,
    disallowSourceTalk: true,
  },
  {
    id: "technical-pvt-boundary",
    module: "technical",
    ticker: "HPG",
    question: "PVT dung de lam gi?",
    maxAnswerLength: 850,
    disallowSourceTalk: true,
  },
];

const hasOpenAiKey = (): boolean => Boolean(process.env.OPENAI_API_KEY?.trim());

const createRequestBody = (testCase: LiveCase): unknown => ({
  question: testCase.question,
  activeModule: testCase.module,
  ticker: testCase.ticker,
  contextPacket: {
    ticker: testCase.ticker,
    activeModule: testCase.module,
    moduleContext: {
      moduleKey: testCase.module,
      ticker: testCase.ticker,
      liveSmokeTest: true,
    },
    dataQuality: {
      dataMode: "research_only",
      status: "partial",
      productionApproved: false,
      sourceName: "assistant-openai-live-smoke",
      sourceLabel: "Controlled live provider smoke test",
      asOf: "2026-07-04",
      period: "smoke",
      missingFields: [],
      warnings: ["Controlled live smoke test. No DB write."],
    },
    missingFields: [],
    allowedNumericValues: [],
    visibleFacts: [
      `Active module: ${testCase.module}`,
      `Ticker: ${testCase.ticker ?? "not_available"}`,
    ],
    constraints: [
      "Answer in Vietnamese.",
      "Keep the answer concise and easy to understand.",
      "Do not mention source/provenance unless the user asks for source evidence.",
      "Do not infer a ticker when ticker is not_available.",
      "Do not give buy/sell/hold recommendations.",
      "Do not create fair value, target price, upside, downside, ranking, or scoring.",
    ],
  },
});

const postJson = async (testCase: LiveCase): Promise<{ response: Response; json: AssistantApiResponse }> => {
  const [{ createAssistantPostHandler }, { OpenAiAssistantProvider }] = await Promise.all([
    import("../src/app/api/assistant/route"),
    import("../src/lib/ai-rag/providers"),
  ]);
  const handler = createAssistantPostHandler({
    provider: new OpenAiAssistantProvider({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
    }),
  });

  const response = await handler(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createRequestBody(testCase)),
    }),
  );
  const json = (await response.json()) as AssistantApiResponse;

  return { response, json };
};

const containsSourceTalk = (answer: string): boolean =>
  /\b(source|provenance|rag|pdf|page|nguon|nguồn|trich dan|trích dẫn|nhan nguon|nhãn nguồn|source label)\b/i.test(
    answer,
  );

const collectQualitySignals = (testCase: LiveCase, answer: string): { failures: string[]; warnings: string[] } => {
  const failures: string[] = [];
  const warnings: string[] = [];

  if (answer.length > testCase.maxAnswerLength) {
    failures.push(`answer too long: ${answer.length}/${testCase.maxAnswerLength} characters`);
  }

  if (/(###|\*\*)/.test(answer)) {
    failures.push("answer contains raw markdown heading/bold markers");
  }

  for (const ticker of testCase.disallowTickerLeak ?? []) {
    if (answer.includes(ticker)) {
      failures.push(`answer leaked ticker ${ticker}`);
    }
  }

  if (testCase.disallowSourceTalk && containsSourceTalk(answer)) {
    warnings.push("answer mentioned source/report even though the user did not ask for sources");
  }

  if (/\b(target price|fair value|upside|downside|gia muc tieu|giá mục tiêu|gia tri hop ly|giá trị hợp lý)\b/i.test(answer)) {
    failures.push("answer contains target price/fair value/upside/downside wording");
  }

  return { failures, warnings };
};

const runLiveSmoke = async (): Promise<void> => {
  if (!hasOpenAiKey()) {
    console.log(
      JSON.stringify(
        {
          mode: "assistant_openai_live_smoke",
          skipped: true,
          reason: "OPENAI_API_KEY is not configured. No provider fetch was attempted.",
          dbWriteAttempted: false,
          providerFetchAttempted: false,
          passed: true,
        },
        null,
        2,
      ),
    );
    return;
  }

  const results: LiveResult[] = [];

  for (const testCase of liveCases) {
    const { response, json } = await postJson(testCase);
    const answer = json.answer ?? "";
    const failures: string[] = [];
    const warnings: string[] = [];

    if (response.status !== 200) failures.push(`expected HTTP 200, got ${response.status}`);
    if (!json.ok) failures.push(`expected ok=true, got ok=false`);
    if (json.llmStatus !== "completed") {
      failures.push(`expected llmStatus completed, got ${json.llmStatus}`);
    }
    if (!json.answer) failures.push("expected answer to be present");
    if (json.violations?.length) {
      failures.push(`expected no violations, got ${json.violations.map((item) => item.code).join(", ")}`);
    }

    if (answer) {
      const quality = collectQualitySignals(testCase, answer);
      failures.push(...quality.failures);
      warnings.push(...quality.warnings);
    }

    results.push({
      id: testCase.id,
      module: testCase.module,
      ticker: testCase.ticker,
      status: response.status,
      ok: json.ok,
      llmStatus: json.llmStatus,
      detectedIntent: json.runtime?.detectedIntent ?? null,
      selectedDocumentCount: json.runtime?.selectedDocuments?.length ?? 0,
      answerLength: answer.length,
      passed: failures.length === 0,
      failures,
      warnings,
    });
  }

  const failed = results.filter((result) => !result.passed);
  const warnings = results.filter((result) => result.warnings.length > 0);
  const summary = {
    mode: "assistant_openai_live_smoke",
    skipped: false,
    provider: "openai",
    model: process.env.OPENAI_MODEL ?? "default",
    dbWriteAttempted: false,
    providerFetchAttempted: true,
    modulesTested: Array.from(new Set(liveCases.map((testCase) => testCase.module))).sort(),
    caseCount: liveCases.length,
    passed: failed.length === 0,
    warningCount: warnings.length,
    unexpectedFailures: failed,
    warnings,
    results,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
};

runLiveSmoke().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
