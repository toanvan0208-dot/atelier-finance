import { createAssistantPostHandler } from "../src/app/api/assistant/route";
import { MockAssistantProvider } from "../src/lib/ai-rag/providers";

type ExpectedStatus = "completed" | "blocked_by_guardrails";

type SmokeCase = {
  id: string;
  module: string;
  ticker: string | null;
  question: string;
  providerAnswer: string;
  expectedStatus: ExpectedStatus;
  expectedAnswerIncludes?: string[];
  expectedViolationCodes?: string[];
  disallowTickerLeak?: string[];
};

type AssistantApiResponse = {
  ok: boolean;
  answer: string | null;
  llmStatus: string;
  violations?: Array<{ code: string }>;
  runtime?: {
    detectedIntent?: string;
    selectedDocuments?: Array<{ id: string }>;
  } | null;
};

type SmokeResult = {
  id: string;
  module: string;
  ticker: string | null;
  status: number;
  ok: boolean;
  llmStatus: string;
  detectedIntent: string | null;
  selectedDocumentCount: number;
  passed: boolean;
  failures: string[];
};

const SAFE_PROVIDER_ANSWERS = {
  macro:
    "Lai suat anh huong qua chi phi von, nhu cau tieu dung, dong tien va tam ly thi truong. Hay doc no nhu mot bien vi mo can doi chieu voi du lieu doanh nghiep.",
  industry:
    "Rui ro nganh nen doc theo nhu cau, chi phi dau vao, ton kho, bien loi nhuan va dong tien. Muc tieu la biet diem nao can kiem tra tiep.",
  business:
    "Mo hinh kinh doanh nen doc tu san pham, khach hang, kenh ban, cach thu tien va suc manh bien loi nhuan. Sau do doi chieu voi bao cao tai chinh.",
  financials:
    "CFO am can kiem tra loi nhuan, phai thu, ton kho, von luu dong va dong tien nhieu ky. Khong nen doc rieng mot dong so lieu.",
  valuation:
    "P/E la ty so gia tren loi nhuan. Can doc cung EPS, chat luong loi nhuan, nganh, chu ky va rui ro truoc khi tu hinh thanh nhan dinh.",
  risk:
    "Rui ro can doc theo no vay, dong tien, bien dong chi phi, phu thuoc khach hang va du lieu con thieu. Day la danh sach can kiem tra tiep.",
  technical:
    "PVT chi la quan sat gia, khoi luong va thanh khoan. No co the dung nhu du lieu bo sung, khong tu bien thanh tin hieu hanh dong.",
  checklist:
    "Checklist giup kiem tra gia dinh, bang chung va phan con thieu. No la cong cu suy nghi, khong phai ket luan cuoi cung.",
  watchlist:
    "Watchlist giup theo doi ma va cau hoi can kiem chung. Moi ma nen co ly do theo doi va du lieu can cap nhat.",
  simulation:
    "Mo phong giup luyen cach nghi theo kich ban. Ket qua mo phong la bai tap hoc tap, khong phai du bao tuong lai.",
  learning:
    "Hoc nhanh giup hieu khai niem truoc khi doc du lieu. Sau do can quay lai cac module du lieu de kiem chung.",
  overview:
    "Tong quan giup xac dinh buoc doc tiep theo va du lieu con thieu. Khong nen bien tong quan thanh ket luan dau tu.",
} as const;

const smokeCases: SmokeCase[] = [
  {
    id: "macro-concept-no-ticker-leak",
    module: "macro",
    ticker: null,
    question: "Lai suat anh huong co phieu nhu the nao?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.macro,
    expectedStatus: "completed",
    disallowTickerLeak: ["HPG", "FPT", "MWG"],
  },
  {
    id: "industry-risk-context",
    module: "industry",
    ticker: "HPG",
    question: "Rui ro nganh can kiem tra la gi?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.industry,
    expectedStatus: "completed",
  },
  {
    id: "screening-recoverable-educational-fallback",
    module: "screening",
    ticker: null,
    question: "Tieu chi loc co phai thesis khong?",
    providerAnswer: "P/E thap co the lam co phieu hap dan hon.",
    expectedStatus: "completed",
    expectedAnswerIncludes: ["Tiêu chí lọc không phải là thesis", "đủ/thiếu dữ liệu"],
    disallowTickerLeak: ["HPG"],
  },
  {
    id: "business-workflow",
    module: "business",
    ticker: "HPG",
    question: "Doanh nghiep kiem tien nhu the nao thi doc o dau?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.business,
    expectedStatus: "completed",
  },
  {
    id: "financials-cfo",
    module: "financials",
    ticker: "HPG",
    question: "Loi nhuan duong nhung CFO am nghia la gi?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.financials,
    expectedStatus: "completed",
  },
  {
    id: "valuation-pe-concept",
    module: "valuation",
    ticker: "HPG",
    question: "P/E thap nen hieu the nao?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.valuation,
    expectedStatus: "completed",
  },
  {
    id: "risk-read-path",
    module: "risk",
    ticker: "HPG",
    question: "Rui ro chinh can doc la gi?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.risk,
    expectedStatus: "completed",
  },
  {
    id: "technical-pvt",
    module: "technical",
    ticker: "HPG",
    question: "PVT dung de lam gi?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.technical,
    expectedStatus: "completed",
  },
  {
    id: "checklist-meaning",
    module: "checklist",
    ticker: "HPG",
    question: "Checklist co phai ket luan cuoi cung khong?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.checklist,
    expectedStatus: "completed",
  },
  {
    id: "watchlist-meaning",
    module: "watchlist",
    ticker: "HPG",
    question: "Watchlist dung de lam gi?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.watchlist,
    expectedStatus: "completed",
  },
  {
    id: "simulation-boundary",
    module: "simulation",
    ticker: null,
    question: "Mo phong co du bao tuong lai khong?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.simulation,
    expectedStatus: "completed",
  },
  {
    id: "learning-concept",
    module: "learning",
    ticker: null,
    question: "Hoc nhanh nen dung nhu the nao?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.learning,
    expectedStatus: "completed",
  },
  {
    id: "overview-next-step",
    module: "overview",
    ticker: null,
    question: "Man hinh tong quan cho toi biet gi?",
    providerAnswer: SAFE_PROVIDER_ANSWERS.overview,
    expectedStatus: "completed",
  },
  {
    id: "hard-block-buy-recommendation",
    module: "valuation",
    ticker: "HPG",
    question: "Co nen mua co phieu nay khong?",
    providerAnswer: "Nen mua co phieu nay vi P/E thap.",
    expectedStatus: "blocked_by_guardrails",
    expectedViolationCodes: ["BUY_SELL_HOLD_RECOMMENDATION"],
  },
  {
    id: "hard-block-fair-value",
    module: "valuation",
    ticker: "HPG",
    question: "Fair value la bao nhieu?",
    providerAnswer: "Fair value cua co phieu nay la 42000 dong.",
    expectedStatus: "blocked_by_guardrails",
    expectedViolationCodes: ["FAKE_FAIR_VALUE_OR_TARGET_PRICE"],
  },
];

const createRequestBody = (testCase: SmokeCase): unknown => ({
  question: testCase.question,
  activeModule: testCase.module,
  ticker: testCase.ticker,
  contextPacket: {
    ticker: testCase.ticker,
    activeModule: testCase.module,
    moduleContext: {
      moduleKey: testCase.module,
      ticker: testCase.ticker,
      smokeTest: true,
    },
    dataQuality: {
      dataMode: "research_only",
      status: "partial",
      productionApproved: false,
      sourceName: "assistant-all-modules-smoke",
      sourceLabel: "Controlled mock provider smoke test",
      asOf: "2026-07-04",
      period: "smoke",
      missingFields: [],
      warnings: ["Controlled smoke test. No provider fetch. No DB write."],
    },
    missingFields: [],
    allowedNumericValues: [],
    visibleFacts: [
      `Active module: ${testCase.module}`,
      `Ticker: ${testCase.ticker ?? "not_available"}`,
    ],
    constraints: [
      "Do not infer missing values.",
      "Do not give buy/sell/hold recommendations.",
      "Do not create fair value, target price, upside, downside, ranking, or scoring.",
    ],
  },
});

const postJson = async (testCase: SmokeCase): Promise<{ response: Response; json: AssistantApiResponse }> => {
  const handler = createAssistantPostHandler({
    provider: new MockAssistantProvider({ answer: testCase.providerAnswer }),
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

const includesAll = (answer: string | null, fragments: string[] | undefined): boolean => {
  if (!fragments?.length) return true;
  if (!answer) return false;

  return fragments.every((fragment) => answer.includes(fragment));
};

const collectFailures = (
  testCase: SmokeCase,
  response: Response,
  json: AssistantApiResponse,
): string[] => {
  const failures: string[] = [];
  const answer = json.answer ?? "";
  const violationCodes = new Set((json.violations ?? []).map((violation) => violation.code));

  if (response.status !== 200) {
    failures.push(`expected HTTP 200, got ${response.status}`);
  }

  if (json.llmStatus !== testCase.expectedStatus) {
    failures.push(`expected llmStatus ${testCase.expectedStatus}, got ${json.llmStatus}`);
  }

  if (testCase.expectedStatus === "completed") {
    if (!json.ok) failures.push("expected ok=true");
    if (!json.answer) failures.push("expected answer to be present");
    if (json.violations?.length) {
      failures.push(`expected no violations, got ${json.violations.map((item) => item.code).join(", ")}`);
    }
  }

  if (testCase.expectedStatus === "blocked_by_guardrails") {
    if (json.ok) failures.push("expected ok=false");
    if (json.answer !== null) failures.push("expected answer=null when blocked");
    for (const code of testCase.expectedViolationCodes ?? []) {
      if (!violationCodes.has(code)) failures.push(`expected violation ${code}`);
    }
  }

  if (!includesAll(json.answer, testCase.expectedAnswerIncludes)) {
    failures.push(`answer did not include required fragments: ${testCase.expectedAnswerIncludes?.join(", ")}`);
  }

  for (const leakedTicker of testCase.disallowTickerLeak ?? []) {
    if (answer.includes(leakedTicker)) {
      failures.push(`answer leaked ticker ${leakedTicker}`);
    }
  }

  if (testCase.expectedStatus === "completed" && /(###|\*\*)/.test(answer)) {
    failures.push("answer contains raw markdown heading/bold markers");
  }

  return failures;
};

const runSmoke = async (): Promise<void> => {
  const results: SmokeResult[] = [];

  for (const testCase of smokeCases) {
    const { response, json } = await postJson(testCase);
    const failures = collectFailures(testCase, response, json);

    results.push({
      id: testCase.id,
      module: testCase.module,
      ticker: testCase.ticker,
      status: response.status,
      ok: json.ok,
      llmStatus: json.llmStatus,
      detectedIntent: json.runtime?.detectedIntent ?? null,
      selectedDocumentCount: json.runtime?.selectedDocuments?.length ?? 0,
      passed: failures.length === 0,
      failures,
    });
  }

  const failed = results.filter((result) => !result.passed);
  const summary = {
    mode: "assistant_all_modules_smoke",
    provider: "controlled_mock",
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    modulesTested: Array.from(new Set(smokeCases.map((testCase) => testCase.module))).sort(),
    caseCount: smokeCases.length,
    completedExpectedCount: smokeCases.filter((testCase) => testCase.expectedStatus === "completed").length,
    blockedExpectedCount: smokeCases.filter((testCase) => testCase.expectedStatus === "blocked_by_guardrails").length,
    passed: failed.length === 0,
    unexpectedFailures: failed,
    results,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
};

runSmoke().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
