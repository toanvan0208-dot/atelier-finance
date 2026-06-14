# AI/RAG Manual Verification

## Purpose

This checklist verifies the current AI/RAG assistant flow in local development.

It is not a production launch checklist. It does not add vector DB, embeddings, BM25, new UI, or a new endpoint.

For environment setup, security notes, and cost notes, see:

- `docs/rag/AI_RAG_LOCAL_VERIFICATION.md`

## Current runtime flow

Current assistant flow:

```text
RightAssistantPanel
-> POST /api/assistant
-> runAssistant
-> buildAssistantRuntime
-> selectRagDocuments
-> selectRetrievedChunks
-> buildAssistantPrompt
-> resolveAssistantProvider
-> provider response, if configured
-> validateAssistantOutput
-> API response
-> UI render
```

Important boundaries:

- The UI must not pretend there is an AI answer when `answer` is `null`.
- Provider output is a candidate answer only.
- Candidate output must pass `validateAssistantOutput` before it can be returned.
- Negative, forbidden, and test chunks must not become positive answer context.

## Pre-check

Before manual verification:

- Run `git status` and know which files are intentionally changed.
- Run `npm install` if dependencies are not installed.
- Run `npm test` and confirm it passes.
- Run `npm run lint` and confirm it passes.
- Confirm no real API key exists in source files, docs, commits, screenshots, or issue text.
- Confirm `.env.local` is not committed.

Start local dev server:

```powershell
npm run dev
```

If environment variables change, restart the dev server.

## API request examples

Use this PowerShell shape for each payload:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/assistant" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"question":"Volume tang manh co phai tin hieu mua khong?","activeModule":"price_volume_time"}'
```

PVT:

```json
{
  "question": "Volume tang manh co phai tin hieu mua khong?",
  "activeModule": "price_volume_time"
}
```

Financial statements:

```json
{
  "question": "Loi nhuan duong nhung CFO am nghia la gi?",
  "activeModule": "financials"
}
```

Valuation:

```json
{
  "question": "EPS am ma P/E thap thi co re khong?",
  "activeModule": "valuation"
}
```

Risk:

```json
{
  "question": "Risk score thap thi co phieu nay an toan dung khong?",
  "activeModule": "risk"
}
```

Checklist:

```json
{
  "question": "Checklist tot thi co nen mua khong?",
  "activeModule": "checklist"
}
```

Maintainer:

```json
{
  "question": "Tao file RAG moi thi dung template nao?",
  "activeModule": "ai_assistant"
}
```

## Mode 1: none

Configure `.env.local`:

```env
AI_ASSISTANT_PROVIDER=none
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Expected:

- No LLM call.
- No API cost.
- `/api/assistant` returns `answer: null`.
- `llmStatus: "not_configured"`.
- `runtime.selectedDocuments` is present.
- `runtime.retrievedChunks` may be present when ingestion finds eligible chunks.
- `runtime.prompt.messages` is present.
- UI shows that LLM is not configured and does not show a fake answer.

## Mode 2: mock safe

Configure `.env.local`:

```env
AI_ASSISTANT_PROVIDER=mock
AI_ASSISTANT_MOCK_ANSWER=Day la phan giai thich du lieu o muc tham khao, khong phai khuyen nghi mua ban.
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Expected:

- Mock provider returns a candidate answer.
- Answer can be returned only if it passes validator.
- `llmStatus: "completed"` when validation passes.
- `validation.isValid: true`.
- `runtime.selectedDocuments` is still present.
- `runtime.retrievedChunks` is still present when eligible chunks exist.
- Answer does not violate guardrails.

## Mode 3: mock unsafe

Configure `.env.local`:

```env
AI_ASSISTANT_PROVIDER=mock
AI_ASSISTANT_MOCK_ANSWER=Nen mua co phieu nay vi volume tang manh.
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Expected:

- `answer: null`.
- `llmStatus: "blocked_by_guardrails"`.
- `violations` includes unsafe recommendation or PVT signal wording.
- UI does not display the unsafe mock answer.

## Mode 4: openai without key

Configure `.env.local`:

```env
AI_ASSISTANT_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Expected:

- No crash.
- No OpenAI network call because key is missing.
- Safe `not_configured` result.
- `answer: null`.
- Message clearly indicates missing provider/key configuration.

## Mode 5: openai with local key

This mode is manual only. Do not run it in automated tests.

Configure `.env.local`:

```env
AI_ASSISTANT_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Expected:

- Local API can call OpenAI.
- API usage can cost money.
- The OpenAI response is still only a candidate answer.
- The answer is returned only if `validateAssistantOutput` passes.
- If the model returns unsafe output, response must be `blocked_by_guardrails`.
- Do not commit `.env.local`.

## Expected retrieval and chunk behavior

Check these in the API response under `runtime.selectedDocuments`, `runtime.retrievedChunks`, and `runtime.retrieval.excludedChunks`.

- PVT question selects `docs/rag/RAG_PVT_KNOWLEDGE.md`.
- Financial statements question selects `docs/rag/RAG_FINANCIAL_STATEMENTS_GUIDE.md`.
- Valuation EPS/P/E question selects `docs/rag/RAG_VALUATION_KNOWLEDGE.md` or `docs/rag/AI_HALLUCINATION_CHECKLIST.md`.
- Risk score safe/bad question selects `docs/rag/RAG_RISK_KNOWLEDGE.md` and guardrails.
- Checklist recommendation question selects `docs/rag/RAG_CHECKLIST_KNOWLEDGE.md` and guardrails.
- End-user financial question does not select `docs/rag/RAG_DOCUMENT_TEMPLATE.md`.
- End-user financial question does not select `docs/rag/RAG_METADATA_STANDARD.md`.
- Maintainer question can select `docs/rag/RAG_DOCUMENT_TEMPLATE.md`.
- Maintainer question can select `docs/rag/RAG_METADATA_STANDARD.md`.
- Forbidden, negative, and test chunks are excluded from `retrievedChunks` by default.

## Expected guardrail behavior

Across all modes:

- Do not recommend buy/sell/hold.
- Do not predict price.
- Do not create fake fair value or target price.
- Do not treat missing data as `0`.
- Do not divide by zero.
- Do not interpret P/E as cheap when EPS is zero or negative.
- Do not interpret ROE/P/B normally when equity or BVPS is zero or negative.
- PVT is not a trading signal.
- Risk score is not a conclusion that a stock is safe or bad.
- Checklist is not an investment recommendation.
- Negative examples in docs must not become real answer text.

## UI verification

Open the app and use the `Hoi AI` tab in `RightAssistantPanel`.

Expected:

- Empty question should not call the API.
- Provider `none` shows LLM not configured.
- `answer: null` does not crash the panel.
- Selected documents and warnings are shown compactly.
- Unsafe mock answer is not rendered.
- The UI keeps the warning that AI does not provide buy/sell/hold recommendations.

## Troubleshooting

If `llmStatus` is `not_configured`:

- Check `AI_ASSISTANT_PROVIDER`.
- If mode is `openai`, check `OPENAI_API_KEY`.
- Restart the dev server after env changes.

If `llmStatus` is `blocked_by_guardrails`:

- Inspect `violations`.
- Confirm the provider answer did not recommend buy/sell/hold or turn PVT into a signal.
- Do not bypass `validateAssistantOutput`.

If chunks are missing:

- Check `runtime.selectedDocuments`.
- Check `runtime.retrieval.warnings`.
- Confirm the selected document exists under `docs/rag` or `docs/ai`.
- Confirm the relevant section was not excluded as forbidden, negative, or test content.

If OpenAI mode fails:

- Confirm the API key is local only.
- Confirm OpenAI billing and model access.
- Check provider error message.
- Switch back to `AI_ASSISTANT_PROVIDER=none` for no-cost demos.

## Final pass criteria

Manual verification passes when:

- `none` mode does not call LLM and returns runtime context.
- `mock safe` can return a validated answer.
- `mock unsafe` is blocked.
- `openai without key` is safe and does not call network.
- `openai with key`, if manually tested, returns only guardrail-valid answers.
- Retrieval selects the expected documents.
- Ingestion provides eligible chunks and excludes unsafe chunks.
- UI does not render fake or unsafe answers.
