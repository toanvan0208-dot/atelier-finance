# Phase 159O - Industry Layer 5 Assistant Answer Guardrails

## Goal

Verify that Assistant answers using Industry Layer 5 context pass only when they stay educational and are blocked when they become investment advice, valuation output, or stock attractiveness claims.

## Scope

- Guardrail smoke only.
- Mock provider only.
- No real LLM/provider fetch.
- No DB write.
- No schema change.
- No new IndustryMetric rows.

## What Was Added

- `scripts/smoke-industry-layer5-assistant-answer-guardrails.ts`

The script sends two mocked Assistant answers for HPG:

1. A safe answer that uses Layer 5 metrics only to suggest next checks.
2. An unsafe answer that uses Layer 5 framing to claim stock attractiveness, target price/upside, and action guidance.

## Expected Behavior

- Safe answer: `completed`, validation valid.
- Unsafe answer: `blocked_by_guardrails`, answer null.

## Validation

```bash
npx eslint scripts/smoke-industry-layer5-assistant-answer-guardrails.ts
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/atelier_finance?schema=public'; npx tsx scripts/smoke-industry-layer5-assistant-answer-guardrails.ts
npm run typecheck
```

## Guardrails Confirmed

- Layer 5 metrics can support "what to check next".
- Layer 5 metrics cannot become buy/sell/hold guidance.
- Layer 5 metrics cannot become target price, fair value, upside, or downside.
- Layer 5 metrics cannot become stock attractiveness claims.
- `readyForAssistantUse=false` remains present in the prompt context.
- `productionApprovedTrueCount=0`.

