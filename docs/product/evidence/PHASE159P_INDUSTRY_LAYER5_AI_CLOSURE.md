# Phase 159P - Industry Layer 5 + AI Closure

## Goal

Close the current Industry Layer 5 + AI workstream with a clear status boundary before starting either metric expansion or PDF/RAG work.

## Scope

- Closure/audit only.
- No DB write.
- No schema change.
- No provider fetch.
- No new IndustryMetric rows.
- No UI change.
- No prompt behavior expansion beyond already committed guardrails.

## Current State

Layer 5 safe foundation is complete:

- `IndustryMetric` and `IndustryMetricProvenance` schema exist.
- Local DB has source-backed research-only metric rows.
- Current metric coverage:
  - Steel: 2 metrics.
  - Retail: 3 metrics.
  - Dairy / consumer staples: 0 metrics, missing safely.
- Industry UI reads Layer 5 data.
- UI shows metric reading notes and a separate "future metric" guide.
- Assistant prompt receives `industryMetricSummary`.
- Assistant guardrails keep Layer 5 as next-check context only.
- Unsafe mock answer using stock attractiveness, target price/upside, or action guidance is blocked.

## Not Complete

Layer 5 full metric coverage is not complete:

- Metric coverage is still small.
- Dairy has no eligible metric rows.
- No scheduled metric refresh exists.
- No external provider fetch has been introduced.
- PDF/report RAG retrieval has not been implemented.
- Assistant is not allowed to use metrics for investment conclusions.

## RAG Boundary

The current Industry Layer 5 path is runtime DB context:

```text
IndustryMetric DB
-> loadIndustryContextRuntimeByTicker
-> Assistant moduleContext
-> prompt guardrails
```

It is not yet PDF/report RAG retrieval:

```text
PDF/report corpus
-> retrieval
-> cited chunks
-> answer synthesis
```

## Closure Script

Added:

- `scripts/smoke-industry-layer5-ai-closure.ts`

The script checks:

- IndustryMetric row counts.
- Steel/retail metric presence.
- Dairy missing-safe state.
- UI read-path marker.
- Assistant prompt includes Layer 5 context and guardrail.
- `readyForAssistantUse=false` remains present.
- Unsafe mock answer is blocked.
- `productionApprovedTrueCount=0`.

## Validation

```bash
npx eslint scripts/smoke-industry-layer5-ai-closure.ts
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/atelier_finance?schema=public'; npx tsx scripts/smoke-industry-layer5-ai-closure.ts
npm run typecheck
```

## Closure Conclusion

- Layer 5 safe foundation: complete.
- Layer 5 full metric coverage: not complete.
- AI usage: allowed only for next-check guidance.
- AI investment conclusion usage: not allowed.
- PDF/RAG industry research: not implemented yet.

## Recommended Next Options

1. Expand real source-backed IndustryMetric coverage by industry.
2. Design PDF/report RAG retrieval separately from runtime DB context.

