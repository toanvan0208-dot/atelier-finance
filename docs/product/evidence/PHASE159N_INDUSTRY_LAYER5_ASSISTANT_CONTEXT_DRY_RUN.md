# Phase 159N - Industry Layer 5 Assistant Context Dry Run

## Goal

Expose the current Industry Layer 5 context to the Assistant prompt in a guarded dry-run path, without enabling automated investment conclusions.

## Scope

- Assistant prompt/context boundary only.
- No DB write.
- No schema change.
- No provider fetch.
- No new IndustryMetric rows.
- No Assistant live LLM answer required.

## What Changed

- Added an explicit `industryMetricAssistantGuardrail` to the Assistant module context.
- Extended the existing `industryContextGuardrail` with Layer 5 metric rules.
- Added smoke script:
  - `scripts/smoke-industry-layer5-assistant-context.ts`

## Assistant Boundary

Layer 5 metrics may appear in `industryContext.industryMetricSummary`, but:

- `readyForAssistantUse=false`.
- `productionApproved=false`.
- `needsReview=true`.
- Metrics are research-only.
- Metrics may only support "what to check next" context.
- Metrics must not become:
  - benchmark,
  - ranking,
  - score,
  - automatic comparison,
  - valuation input,
  - risk benchmark,
  - trade-action guidance,
  - stock attractiveness claim.

The future metric checklist remains user education only and is not treated as DB data.

## Validation

Required commands:

```bash
npx eslint src/app/api/assistant/route.ts scripts/smoke-industry-layer5-assistant-context.ts
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/atelier_finance?schema=public'; npx tsx scripts/smoke-industry-layer5-assistant-context.ts
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/atelier_finance?schema=public'; npx vitest run src/app/api/assistant/__tests__/route.test.ts
npm run typecheck
```

## Guardrails Confirmed

- DB write: no.
- Schema change: no.
- Provider fetch: no.
- New metric import: no.
- Benchmark/ranking/scoring introduced: no.
- Buy/sell/hold introduced: no.
- Target price/fair value/upside/downside introduced: no.
- Stock attractiveness introduced: no.
