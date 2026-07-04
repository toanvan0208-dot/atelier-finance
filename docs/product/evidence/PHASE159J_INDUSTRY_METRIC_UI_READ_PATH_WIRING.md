# Phase 159J - IndustryMetric UI Read Path Wiring

## Goal

Wire the controlled Layer 5 `IndustryMetric` rows into the Industry UI read path.

This phase only displays research-only metrics. It does not promote them to production data and does not wire Assistant use.

## Scope

- UI read path: yes.
- DB read: yes.
- DB write: no.
- Schema change: no.
- Migration creation: no.
- Provider fetch: no.
- Raw source import: no.
- Assistant prompt change: no.
- Benchmark, ranking, score, trading signal, valuation output, or stock attractiveness output: no.

## Files Changed

- `src/features/industry/lib/load-industry-context.ts`
- `src/features/industry/components/IndustryPage.tsx`
- `src/features/industry/components/__tests__/IndustryCompassSections.test.ts`
- `docs/product/evidence/PHASE159J_INDUSTRY_METRIC_UI_READ_PATH_WIRING.md`

## Runtime Read Path

Added `IndustryMetricRuntimeSummary` to the Industry runtime payload.

The runtime loader reads only metric rows that are:

- `dataMode=research_only`
- `productionApproved=false`
- `needsReview=true`
- `qualityStatus=needs_review`

The loader also counts provenance rows and marks the payload as display-safe only when provenance exists.

## UI Behavior

The Industry page now shows a Layer 5 section:

- `So lieu nganh co nguon`

For industries with metrics:

- steel shows 2 metrics
- retail shows 3 metrics

For industries without metrics:

- dairy remains missing-safe with N/A-style copy

Every displayed metric shows:

- metric label
- value
- unit
- period
- source label
- data mode
- quality status
- provenance count

## Guardrails

The UI explicitly keeps Layer 5 metrics as:

- research-only
- needs review
- not production-approved
- not an investment conclusion

The UI does not add:

- ranking
- scoring
- benchmark output
- valuation output
- trading signal
- Assistant usage

## Validation

Commands run:

- `npx eslint src/features/industry/lib/load-industry-context.ts src/features/industry/components/IndustryPage.tsx src/features/industry/components/__tests__/IndustryCompassSections.test.ts`
- `npx vitest run src/features/industry/components/__tests__/IndustryCompassSections.test.ts`
- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`

Expected result:

- all pass

## Conclusion

Layer 5 now has:

- schema
- controlled DB rows
- dry-run read path
- UI read path

Layer 5 is still review-gated and not Assistant-enabled.

## Recommended Next Phase

Phase 159K - IndustryMetric Browser Verification.

That phase should visually verify the Industry UI for steel, retail, and dairy states.
