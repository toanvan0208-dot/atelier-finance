# AI_RAG_RUNTIME_CONTRACT.md

## 1. Purpose

This document defines the runtime contract for the Atelier Finance AI assistant and RAG layer before implementation.

It is not an implementation plan for a specific vendor or database. It defines the request/response shapes, safety fields, missing data behavior, source attribution, and guardrail requirements that any future implementation must follow.

This file must be used together with:

```text
docs/rag/AI_RAG_IMPLEMENTATION_AUDIT.md
docs/rag/RAG_RETRIEVAL_RULES.md
docs/rag/AI_RAG_SYSTEM_PROMPT.md
docs/rag/AI_HALLUCINATION_CHECKLIST.md
docs/ai/AI_GUARDRAILS.md
docs/ai/AI_RESPONSE_STYLE.md
docs/ai/AI_SYSTEM_PROMPT.md
```

## 2. Core principle

The AI assistant is a financial education and analysis assistant. It helps users understand available context, missing data, risk, valuation, financial statements, Price Volume Time, and checklist discipline.

The assistant must not become:

- An investment advisor.
- A buy/sell/hold engine.
- A price prediction tool.
- A signal generator.
- A system that invents missing data.
- A system that treats mock or missing data as verified fact.

Hard rules:

```text
No buy/sell/hold recommendation.
No price prediction.
No fabricated data outside context.
Missing data = null / not_available / insufficient_data.
Missing data must never be replaced with 0.
PVT is market observation, not a trading signal.
Risk score is not a final safe/bad stock conclusion.
Checklist is not an investment recommendation.
RAG_DOCUMENT_TEMPLATE.md and RAG_METADATA_STANDARD.md are maintainer-only unless the user asks about RAG document structure, metadata, indexing, or governance.
```

## 3. Runtime flow overview

The future runtime should follow this flow:

```text
1. UI sends AssistantRequest.
2. Assistant service validates request shape.
3. Assistant service detects user intent and safety risk.
4. Assistant service builds RAGSearchRequest.
5. RAG service retrieves eligible chunks.
6. RAG service filters out negative examples unless explicitly needed as forbidden examples.
7. Assistant service builds prompt from system rules, module context, data context, retrieved chunks, and warnings.
8. LLM generates a draft answer.
9. Output validator checks guardrails and forbidden language.
10. Assistant service returns AssistantResponse with answer, warnings, refusal, missing data, and source attribution.
```

If retrieval fails or context is insufficient, the assistant must still answer safely by explaining what is missing and what can be checked next.

## 4. Assistant request schema

The assistant endpoint should accept one request object.

```ts
type AssistantRequest = {
  requestId: string;
  userQuestion: string;
  locale: "vi" | "en";
  activeModule: ModuleKey;
  ticker?: string | null;
  companyName?: string | null;
  userIntentHint?: UserIntent | null;
  moduleContext: ModuleContext;
  dataQuality: DataQualitySummary;
  conversationContext?: ConversationContext | null;
  ragOptions?: RAGOptions | null;
  safetyOptions?: SafetyOptions | null;
};
```

Required fields:

```text
requestId
userQuestion
locale
activeModule
moduleContext
dataQuality
```

Recommended `ModuleKey` values:

```ts
type ModuleKey =
  | "overview"
  | "macro"
  | "industry"
  | "screening"
  | "business"
  | "financials"
  | "valuation"
  | "technical"
  | "risk"
  | "watchlist"
  | "checklist"
  | "simulation"
  | "learning"
  | "route-config";
```

Recommended `UserIntent` values:

```ts
type UserIntent =
  | "definition"
  | "data_explanation"
  | "financial_statement_reading"
  | "valuation_explanation"
  | "risk_explanation"
  | "pvt_observation"
  | "checklist_review"
  | "maintainer_rag_document"
  | "advice_request"
  | "price_prediction_request"
  | "unknown";
```

`RAGOptions`:

```ts
type RAGOptions = {
  enabled: boolean;
  maxChunks: number;
  maxTokens: number;
  includeNegativeExamples: false;
  allowMaintainerDocs: boolean;
};
```

Default:

```json
{
  "enabled": true,
  "maxChunks": 4,
  "maxTokens": 1500,
  "includeNegativeExamples": false,
  "allowMaintainerDocs": false
}
```

## 5. Assistant response schema

```ts
type AssistantResponse = {
  requestId: string;
  status: "answered" | "refused" | "insufficient_context" | "error";
  answer: string;
  shortAnswer?: string | null;
  refusal?: Refusal | null;
  warnings: Warning[];
  missingData: MissingDataItem[];
  usedContext: UsedContext;
  sources: SourceAttribution[];
  guardrailChecks: GuardrailCheck[];
  suggestedNextChecks: string[];
  debug?: AssistantDebug | null;
};
```

Response rules:

- `answer` must be user-facing and safe.
- `status = "refused"` when the user asks for a recommendation, trade action, price prediction, or fake data.
- `status = "insufficient_context"` when the system cannot answer a data-specific question from available context.
- `warnings` must include safety or data-quality caveats.
- `sources` must list docs/chunks or module data used.
- `debug` must not be returned to normal users unless explicitly enabled in development mode.

## 6. RAG search request schema

```ts
type RAGSearchRequest = {
  requestId: string;
  query: string;
  locale: "vi" | "en";
  activeModule: ModuleKey;
  ticker?: string | null;
  detectedIntents: UserIntent[];
  detectedMetrics: string[];
  detectedSafetyRisks: SafetyRisk[];
  missingFields: string[];
  filters: RAGFilters;
  ranking: RAGRankingOptions;
};
```

`SafetyRisk`:

```ts
type SafetyRisk =
  | "buy_sell_hold_request"
  | "entry_exit_signal_request"
  | "price_prediction_request"
  | "fake_data_request"
  | "missing_data_as_zero_risk"
  | "invalid_ratio_risk"
  | "pvt_signal_risk"
  | "risk_score_overreach"
  | "checklist_recommendation_risk";
```

`RAGFilters`:

```ts
type RAGFilters = {
  allowedModules?: string[];
  requiredFiles?: string[];
  excludedFiles?: string[];
  includeMaintainerDocs: boolean;
  includeNegativeSections: false;
  reviewStatus?: Array<"draft" | "reviewed" | "approved">;
};
```

Default exclusion for end-user financial questions:

```json
{
  "excludedFiles": [
    "docs/rag/RAG_DOCUMENT_TEMPLATE.md",
    "docs/rag/RAG_METADATA_STANDARD.md"
  ],
  "includeMaintainerDocs": false,
  "includeNegativeSections": false
}
```

Maintainer intent exception:

```json
{
  "requiredFiles": [
    "docs/rag/RAG_DOCUMENT_TEMPLATE.md",
    "docs/rag/RAG_METADATA_STANDARD.md"
  ],
  "includeMaintainerDocs": true
}
```

## 7. RAG search response schema

```ts
type RAGSearchResponse = {
  requestId: string;
  query: string;
  status: "ok" | "no_match" | "error";
  chunks: RetrievedChunk[];
  requiredDocsPresent: string[];
  requiredDocsMissing: string[];
  excludedDocs: string[];
  warnings: Warning[];
  retrievalTrace?: RetrievalTrace | null;
};
```

Rules:

- `chunks` must only include eligible chunks.
- Negative examples and forbidden examples must be excluded from normal answer context.
- If a forbidden/negative section is included for a safety reason, it must be labeled clearly and must not be used as valid answer content.
- If required docs are missing, return `requiredDocsMissing` and add a warning.

## 8. Retrieved chunk schema

```ts
type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  filePath: string;
  title: string;
  sectionPath: string[];
  text: string;
  summary?: string | null;
  language: "vi" | "en" | "mixed";
  module: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  relatedMetrics: string[];
  userIntents: string[];
  allowedUsage: string[];
  forbiddenUsage: string[];
  sectionType: SectionType;
  safetyLevel: "low" | "medium" | "high" | "critical";
  score: number;
  scoreBreakdown?: ScoreBreakdown | null;
  source: SourceAttribution;
};
```

`SectionType`:

```ts
type SectionType =
  | "definition"
  | "concept_explanation"
  | "safe_template"
  | "retrieval_guidance"
  | "metadata"
  | "guardrail"
  | "hallucination_rule"
  | "test_case"
  | "negative_example"
  | "forbidden_output"
  | "maintainer_template"
  | "metadata_standard";
```

Runtime rule:

```text
sectionType = negative_example | forbidden_output | test_case
must not be used as positive answer content.
```

## 9. Module context schema

```ts
type ModuleContext = {
  moduleKey: ModuleKey;
  moduleName: string;
  ticker?: string | null;
  companyName?: string | null;
  companyType?: "non_financial" | "bank" | "securities" | "insurance" | "unknown" | null;
  industry?: string | null;
  period?: string | null;
  periodType?: "quarter" | "year" | "ttm" | "session" | "unknown" | null;
  dataSource?: SourceAttribution | null;
  isMockData: boolean;
  metrics: Record<string, MetricValue>;
  moduleWarnings: Warning[];
  moduleSpecificContext?: Record<string, unknown>;
};
```

`MetricValue`:

```ts
type MetricValue = {
  value: number | string | boolean | null;
  status?: "available" | "not_available" | "insufficient_data" | "not_applicable" | null;
  unit?: string | null;
  period?: string | null;
  source?: SourceAttribution | null;
  dataQuality?: "sufficient" | "partial" | "missing" | "stale" | "mock" | null;
  missingFields?: string[];
  warningCodes?: string[];
};
```

Module-specific required context:

- `financials`: revenue, net profit, operating cash flow, assets, liabilities, equity, debt, receivables, inventory when available.
- `valuation`: price, EPS, book value/equity, valuation metrics, valuation readiness, assumptions when available.
- `technical`: price, previous price, volume, trading value, average trading value, liquidity status/risk when available.
- `risk`: risk factors, risk scores, data quality, missing fields, financial pressure items.
- `checklist`: checklist items, missing evidence, readiness state, user thesis if provided.

## 10. Data quality schema

```ts
type DataQualitySummary = {
  overallStatus: "good" | "usable_with_caution" | "partial" | "missing" | "stale" | "mock";
  isMockData: boolean;
  missingFields: string[];
  staleFields: string[];
  lowConfidenceFields: string[];
  invalidFields: string[];
  sourceIssues: string[];
  periodIssues: string[];
  warnings: Warning[];
};
```

Rules:

- If `isMockData = true`, assistant must say the data is mock/sample when making a data-specific statement.
- If source or timestamp is missing, assistant must lower confidence.
- If fields are missing, assistant must list missing fields instead of assuming values.
- If denominator is missing, 0, or invalid, normal ratio interpretation is not allowed.

## 11. Warning schema

```ts
type Warning = {
  code: WarningCode;
  severity: "info" | "watch" | "risk" | "critical";
  message: string;
  field?: string | null;
  source?: SourceAttribution | null;
};
```

Recommended `WarningCode` values:

```ts
type WarningCode =
  | "NO_RECOMMENDATION"
  | "NO_PRICE_PREDICTION"
  | "MISSING_DATA"
  | "MOCK_DATA"
  | "STALE_DATA"
  | "SOURCE_MISSING"
  | "INVALID_DENOMINATOR"
  | "EPS_NEGATIVE"
  | "EQUITY_NEGATIVE"
  | "CFO_MISSING"
  | "FINANCIAL_SECTOR_CAVEAT"
  | "PVT_NOT_SIGNAL"
  | "RISK_SCORE_NOT_CONCLUSION"
  | "CHECKLIST_NOT_RECOMMENDATION"
  | "NEGATIVE_EXAMPLE_EXCLUDED"
  | "MAINTAINER_DOC_EXCLUDED"
  | "INSUFFICIENT_RAG_CONTEXT";
```

## 12. Refusal schema

```ts
type Refusal = {
  refused: boolean;
  reasonCode: RefusalReasonCode;
  userFacingReason: string;
  redirectedTo: "data_explanation" | "risk_review" | "missing_data_review" | "education" | "checklist";
  allowedHelp: string[];
};
```

`RefusalReasonCode`:

```ts
type RefusalReasonCode =
  | "BUY_SELL_HOLD_REQUEST"
  | "ENTRY_EXIT_SIGNAL_REQUEST"
  | "PRICE_PREDICTION_REQUEST"
  | "FAKE_DATA_REQUEST"
  | "MISSING_DATA_AS_ZERO_REQUEST"
  | "TARGET_PRICE_REQUEST_WITHOUT_CONTEXT"
  | "UNSUPPORTED_CONCLUSION_REQUEST";
```

Example:

```json
{
  "refused": true,
  "reasonCode": "BUY_SELL_HOLD_REQUEST",
  "userFacingReason": "Mình không đưa ra khuyến nghị mua, bán hoặc nắm giữ.",
  "redirectedTo": "data_explanation",
  "allowedHelp": [
    "Giải thích dữ liệu hiện có",
    "Chỉ ra dữ liệu còn thiếu",
    "Gợi ý các yếu tố cần kiểm tra thêm"
  ]
}
```

## 13. Source attribution schema

```ts
type SourceAttribution = {
  sourceId: string;
  sourceType: "module_data" | "rag_document" | "financial_logic" | "api" | "user_input" | "mock_data";
  filePath?: string | null;
  documentTitle?: string | null;
  sectionPath?: string[] | null;
  metricKey?: string | null;
  sourceName?: string | null;
  collectedAt?: string | null;
  period?: string | null;
  isMockData?: boolean;
};
```

Rules:

- Every data-specific answer must include module data or API source attribution.
- Every RAG-based explanation must include document/chunk attribution internally, and should expose sources in the UI when useful.
- Mock data must be marked as `isMockData: true`.
- User-provided assumptions must be marked as `sourceType: "user_input"`.

## 14. Missing data behavior

Missing data must be represented as:

```text
null
not_available
insufficient_data
not_applicable
```

Missing data must not be represented as:

```text
0
"0"
false
"none"
```

`MissingDataItem`:

```ts
type MissingDataItem = {
  field: string;
  label: string;
  reason: string;
  impact: string;
  requiredFor: string[];
  status: "not_available" | "insufficient_data" | "not_applicable";
};
```

Behavior rules:

- Do not calculate a metric when required input is missing.
- Do not divide by 0.
- Do not infer unavailable values from related fields.
- Do not invent EPS, equity, CFO, volume, trading value, average trading value, fair value, WACC, FCFF, news, or sector context.
- If a user asks to estimate missing data, refuse fake estimation and offer a checklist of required inputs.

## 15. Output constraints

The assistant response must:

- Be grounded in `moduleContext`, `retrievedChunks`, and user-provided assumptions.
- State missing data when it affects interpretation.
- State data quality warnings when data is mock, stale, partial, or source-less.
- Avoid one-metric conclusions.
- Avoid certainty language.
- Avoid buy/sell/hold wording as final advice.
- Avoid price prediction.
- Avoid treating PVT as a trading signal.
- Avoid treating risk score as a final safe/bad stock conclusion.
- Avoid treating checklist as a recommendation.

The assistant response must not contain:

```text
buy recommendation
sell recommendation
hold recommendation
entry signal
exit signal
confirmed breakout as instruction
guaranteed price direction
fake fair value
fake target price
missing data treated as 0
```

Vietnamese forbidden behavior examples:

```text
Không được bảo người dùng nên mua.
Không được bảo người dùng nên bán.
Không được gọi giá/volume là tín hiệu vào lệnh.
Không được nói risk thấp là cổ phiếu an toàn.
Không được nói checklist đạt là đủ điều kiện đầu tư.
```

These phrases may appear in this contract only as restrictions or forbidden examples.

## 16. Examples for PVT

### PVT request

```json
{
  "requestId": "req_pvt_001",
  "userQuestion": "Volume tăng mạnh như này có phải tín hiệu mua không?",
  "locale": "vi",
  "activeModule": "technical",
  "ticker": "MWG",
  "moduleContext": {
    "moduleKey": "technical",
    "moduleName": "Price Volume Time",
    "ticker": "MWG",
    "companyName": "MWG",
    "companyType": "non_financial",
    "industry": "retail",
    "period": "current_session",
    "periodType": "session",
    "isMockData": true,
    "metrics": {
      "closePrice": { "value": 42000, "status": "available", "dataQuality": "mock" },
      "previousClosePrice": { "value": 42600, "status": "available", "dataQuality": "mock" },
      "volume": { "value": 3900000, "status": "available", "dataQuality": "mock" },
      "avgTradingValue20d": { "value": null, "status": "not_available", "dataQuality": "missing" }
    },
    "moduleWarnings": [],
    "moduleSpecificContext": {}
  },
  "dataQuality": {
    "overallStatus": "mock",
    "isMockData": true,
    "missingFields": ["avgTradingValue20d"],
    "staleFields": [],
    "lowConfidenceFields": [],
    "invalidFields": [],
    "sourceIssues": [],
    "periodIssues": [],
    "warnings": []
  }
}
```

### PVT required retrieval

```json
{
  "requiredFiles": [
    "docs/rag/RAG_PVT_KNOWLEDGE.md",
    "docs/ai/AI_GUARDRAILS.md",
    "docs/rag/AI_HALLUCINATION_CHECKLIST.md"
  ],
  "excludedFiles": [
    "docs/rag/RAG_DOCUMENT_TEMPLATE.md",
    "docs/rag/RAG_METADATA_STANDARD.md"
  ]
}
```

### PVT response behavior

```json
{
  "status": "refused",
  "refusal": {
    "refused": true,
    "reasonCode": "ENTRY_EXIT_SIGNAL_REQUEST",
    "userFacingReason": "Mình không gọi volume tăng là tín hiệu mua hoặc điểm vào lệnh.",
    "redirectedTo": "data_explanation",
    "allowedHelp": [
      "Giải thích volume và trading value",
      "Kiểm tra thanh khoản",
      "Nêu dữ liệu cần kiểm tra thêm"
    ]
  },
  "warnings": [
    {
      "code": "PVT_NOT_SIGNAL",
      "severity": "critical",
      "message": "Price Volume Time chỉ là quan sát thị trường, không phải tín hiệu giao dịch."
    },
    {
      "code": "MOCK_DATA",
      "severity": "watch",
      "message": "Dữ liệu hiện tại là mock/sample, không nên trình bày như dữ liệu thật."
    }
  ]
}
```

## 17. Examples for Financial Statements

### Financial statements request

```json
{
  "requestId": "req_fin_001",
  "userQuestion": "Lợi nhuận dương nhưng CFO âm nghĩa là gì?",
  "locale": "vi",
  "activeModule": "financials",
  "ticker": "MWG",
  "moduleContext": {
    "moduleKey": "financials",
    "moduleName": "Financial Statements",
    "ticker": "MWG",
    "companyName": "MWG",
    "companyType": "non_financial",
    "industry": "retail",
    "period": "FY2024",
    "periodType": "year",
    "isMockData": true,
    "metrics": {
      "netProfit": { "value": 4200000000000, "status": "available", "unit": "VND", "dataQuality": "mock" },
      "operatingCashFlow": { "value": -500000000000, "status": "available", "unit": "VND", "dataQuality": "mock" },
      "receivables": { "value": null, "status": "not_available", "dataQuality": "missing" },
      "inventory": { "value": null, "status": "not_available", "dataQuality": "missing" }
    },
    "moduleWarnings": [],
    "moduleSpecificContext": {}
  },
  "dataQuality": {
    "overallStatus": "partial",
    "isMockData": true,
    "missingFields": ["receivables", "inventory"],
    "staleFields": [],
    "lowConfidenceFields": [],
    "invalidFields": [],
    "sourceIssues": [],
    "periodIssues": [],
    "warnings": []
  }
}
```

### Financial statements required retrieval

```json
{
  "requiredFiles": [
    "docs/rag/RAG_FINANCIAL_STATEMENTS_GUIDE.md",
    "docs/rag/RAG_RISK_KNOWLEDGE.md",
    "docs/rag/AI_HALLUCINATION_CHECKLIST.md"
  ],
  "additionalIfMetricDefinitionAsked": [
    "docs/rag/RAG_FINANCIAL_TERMS.md"
  ]
}
```

### Financial statements response behavior

The assistant may explain:

```text
Lợi nhuận dương nhưng CFO âm cho thấy lợi nhuận kế toán chưa chuyển thành tiền từ hoạt động kinh doanh trong kỳ. Cần kiểm tra phải thu, tồn kho, phải trả, khoản mục phi tiền mặt và yếu tố một lần. Vì receivables và inventory đang thiếu, chưa đủ dữ liệu để kết luận nguyên nhân.
```

The assistant must not say:

```text
CFO âm nghĩa là doanh nghiệp chắc chắn xấu.
Lợi nhuận dương nên dòng tiền không quan trọng.
```

## 18. Examples for Valuation/Risk/Checklist

### Valuation example

User question:

```text
EPS âm thì P/E thấp có rẻ không?
```

Required behavior:

```text
If EPS is negative, P/E must be marked not_applicable for normal cheap/expensive interpretation.
Do not conclude the stock is cheap.
Retrieve valuation knowledge, financial statement guide if needed, and guardrails.
```

Response fields:

```json
{
  "status": "answered",
  "warnings": [
    {
      "code": "EPS_NEGATIVE",
      "severity": "critical",
      "message": "EPS âm nên P/E không được diễn giải như chỉ báo rẻ/đắt thông thường."
    }
  ],
  "missingData": []
}
```

### Risk example

User question:

```text
Risk score thấp thì cổ phiếu này an toàn đúng không?
```

Required behavior:

```text
Risk score is a risk summary within available data only.
Do not call the stock safe.
Explain which risk factors are low, which fields are missing, and what still needs checking.
```

Response fields:

```json
{
  "status": "answered",
  "warnings": [
    {
      "code": "RISK_SCORE_NOT_CONCLUSION",
      "severity": "critical",
      "message": "Risk score thấp không phải kết luận cổ phiếu an toàn."
    }
  ]
}
```

### Checklist example

User question:

```text
Checklist đạt nhiều mục thì có nghĩa là đủ điều kiện đầu tư chưa?
```

Required behavior:

```text
Checklist is a discipline and missing-evidence tool.
Do not convert checklist state into investment recommendation.
Explain passed checks, missing evidence, and next review steps.
```

Response fields:

```json
{
  "status": "answered",
  "warnings": [
    {
      "code": "CHECKLIST_NOT_RECOMMENDATION",
      "severity": "critical",
      "message": "Checklist không phải khuyến nghị đầu tư."
    }
  ]
}
```

## 19. Guardrail requirements

Runtime implementation must enforce guardrails in four places:

```text
1. Request validation
2. Retrieval filtering
3. Prompt construction
4. Output validation
```

### Request validation

- Detect advice requests.
- Detect price prediction requests.
- Detect fake data requests.
- Detect missing-data-as-zero requests.
- Detect PVT signal requests.
- Detect maintainer intent.

### Retrieval filtering

- Retrieve `RAG_PVT_KNOWLEDGE.md` for PVT questions.
- Retrieve `RAG_FINANCIAL_STATEMENTS_GUIDE.md` for financial statement reading.
- Retrieve `RAG_FINANCIAL_TERMS.md` for metric definitions.
- Retrieve `RAG_RISK_KNOWLEDGE.md` when debt, negative cash flow, negative equity, invalid ratios, or risk score appears.
- Retrieve `AI_GUARDRAILS.md` and/or `AI_RAG_SYSTEM_PROMPT.md` when safety risk appears.
- Exclude `RAG_DOCUMENT_TEMPLATE.md` and `RAG_METADATA_STANDARD.md` from end-user financial answers.
- Include maintainer docs only when intent is `maintainer_rag_document`.

### Prompt construction

The prompt must include:

- System role and safety hierarchy.
- Active module.
- User question.
- Module data context.
- Missing fields.
- Data quality warnings.
- Retrieved safe chunks.
- Explicit forbidden behavior summary.

The prompt must not include:

- Unlabeled negative examples as normal context.
- Maintainer docs for end-user financial questions.
- Mock data without mock labeling.

### Output validation

The output validator must check:

- No buy/sell/hold recommendation.
- No price prediction.
- No fake target price or fair value.
- No fabricated metric.
- No missing data treated as 0.
- No PVT signal wording.
- No risk score as safe/bad conclusion.
- No checklist as recommendation.
- Missing data and data quality warnings are surfaced when relevant.

If validation fails, the response must be regenerated or replaced with a safe refusal/redirection.

## 20. Final implementation notes

- This contract defines runtime behavior only. It does not create endpoints, prompt builders, retrieval code, or vector storage.
- Future implementation should create types from this contract before wiring UI to backend.
- The current UI assistant should not be treated as real AI until it calls a runtime that satisfies this contract.
- The assistant should expose data quality and source attribution in the UI so users can distinguish real data, mock data, user assumptions, and RAG knowledge.
- Financial logic output should be treated as deterministic context, not as an AI conclusion.
- RAG knowledge should explain concepts and boundaries, not replace financial logic code.
- If contract fields conflict with stricter guardrails, the stricter guardrail wins.

Final classification target for future implementation:

```text
Docs/design -> Runtime contract -> Typed API -> Retrieval -> Prompt builder -> LLM call -> Output guardrails -> UI integration -> AI/RAG tests
```

