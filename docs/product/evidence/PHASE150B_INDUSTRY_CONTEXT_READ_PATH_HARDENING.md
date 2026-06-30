# Phase 150B - IndustryContext Read-Path Hardening

## Phase Objective

Harden the IndustryContext data/read-path without redesigning the Industry UI. Phase 150B connects the existing research-only DB `IndustryContext` rows to a typed runtime payload, Assistant context, company API, and the existing Industry header warning slot.

No new industry data was imported. No DB writes were attempted.

## UI Safety Constraint

- No layout redesign.
- No sidebar/navigation/module-order/user-flow changes.
- No visual-heavy UI additions.
- Existing Industry sections remain in place.
- UI change is limited to a small caveat line inside the existing source/warning box.

## Commands Run

Preflight:

- `git status --short`
- `git diff --stat`
- `git diff`
- `git show --stat --name-only HEAD`
- `git log --oneline -12`

Implementation validation:

- `node scripts/run-staging.mjs npx eslint scripts/smoke-industry-context-read-path.ts src/features/industry/lib/load-industry-context.ts src/app/api/assistant/route.ts src/app/api/companies/[ticker]/route.ts src/app/workspace/page.tsx src/components/layout/AppShell.tsx src/features/industry/components/IndustryPage.tsx src/features/industry/components/IndustryCompassSections.tsx`
- `node scripts/run-staging.mjs npx tsx scripts/smoke-industry-context-read-path.ts`
- `node scripts/run-staging.mjs npx prisma validate`
- `node scripts/run-staging.mjs npx prisma generate`
- `node scripts/run-staging.mjs npx prisma migrate status`
- `node scripts/run-staging.mjs npm run typecheck`
- `node scripts/run-staging.mjs npm run build`
- `node scripts/run-staging.mjs npm run lint`

## Files Changed

- `src/features/industry/lib/load-industry-context.ts`
- `src/app/api/assistant/route.ts`
- `src/app/api/companies/[ticker]/route.ts`
- `src/app/workspace/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/features/industry/components/IndustryPage.tsx`
- `src/features/industry/components/IndustryCompassSections.tsx`
- `scripts/smoke-industry-context-read-path.ts`
- `docs/product/evidence/PHASE150B_INDUSTRY_CONTEXT_READ_PATH_HARDENING.md`

## Starting Commit

- `e3c22445fa23e57c666d447b0b5b0e36d085a370`

## Current IndustryContext Contract

Existing `IndustryContext` fields are interpreted as follows:

| Field | Phase 150B interpretation |
| --- | --- |
| `industryCode` | Optional industry code. Missing remains null. |
| `industryName` | Qualitative industry label from the row. |
| `industryOverview` | Qualitative text only. Legacy mock-labeled text is suppressed from runtime payload. |
| `keyDrivers` | Qualitative text only. Legacy mock-labeled text is suppressed from runtime payload. |
| `industryRisks` | Qualitative text only. Legacy mock-labeled text is suppressed from runtime payload. |
| `relatedTickers` | Ticker matching key for read-path lookup. |
| `asOfDate` | Context date. Not a market price/date signal. |
| `sourceLabel` | Source label only; not a source URL. |
| `dataMode` | Must be `research_only` to be readable by the runtime loader. |
| `productionApproved` | Must remain `false`. |
| `needsReview` | Must remain `true`. |

Schema limitation: `IndustryContext` currently has no native `sourceUrl`, provenance sidecar, numeric metric model, or valuation/risk benchmark model. Phase 150B does not fake these fields.

## Loader / Read-Path Behavior

`loadIndustryContextByTicker(ticker)` remains backward compatible and returns the eligible DB row or `null`.

`loadIndustryContextRuntimeByTicker(ticker)` now returns a typed payload:

- `status="available"` when an eligible `research_only`, `productionApproved=false`, `needsReview=true` row exists.
- `status="missing"` with `missingReason` when no eligible row exists.
- `numericIndustryMetricsAvailable=false`.
- `valuationRiskBenchmarksAvailable=false`.
- caveats and warning codes for research-only, needs-review, missing numeric metrics, and missing benchmarks.
- provenance limitation notes because only `sourceLabel` is available.
- legacy mock-labeled text is suppressed from the runtime payload instead of being surfaced as real data.

## Assistant Context Behavior

The Assistant route now loads `IndustryContext` by ticker when a ticker is present and injects:

- `industryContext`
- `industryContextGuardrail`
- ticker-specific available/missing status
- production approval and needs-review state
- missing numeric metrics/benchmark warnings

Assistant behavior remains bounded:

- no deterministic macro-to-industry conclusions;
- no invented industry metrics;
- no invented valuation/risk benchmarks;
- missing VCB context remains missing instead of falling back to static data.

## Minimal UI Wiring Behavior

The workspace server loads IndustryContext runtime payloads for:

- FPT
- MWG
- VNM
- HPG
- VCB
- MSN

`AppShell` passes this read-only map into `IndustryPage`. The existing Industry header warning box now shows a small DB IndustryContext line for selected ticker groups:

- count of available `research_only` context rows;
- `productionApproved=false`;
- `needsReview=true`;
- numeric metrics unavailable;
- valuation/risk benchmarks unavailable;
- missing context tickers when applicable.

No layout, navigation, section order, card hierarchy, or route behavior was redesigned.

## Ticker Coverage Result

| Ticker | Runtime read-path | Assistant context | Notes |
| --- | --- | --- | --- |
| FPT | readable | injected | Legacy mock-labeled fields suppressed where present. |
| MWG | readable | injected | Research-only, needs review. |
| VNM | readable | injected | Research-only, needs review. |
| HPG | readable | injected | Research-only, needs review. |
| MSN | readable | injected | Research-only, needs review. |
| VCB | missing-safe | missing-safe | No eligible `IndustryContext`; no fallback. |

## Static Guidance Fallback Policy

Static Industry compass guidance remains present as clearly labeled research/static guidance. It is not promoted to DB-backed sourced data and is not used to fill missing DB IndustryContext rows.

## Numeric Metrics / Benchmarks

- Numeric industry metrics: still unavailable.
- Valuation industry benchmarks: still unavailable.
- Risk industry benchmarks: still unavailable.
- No zero-fill was added.
- No placeholder numeric rows were added.

## Smoke Results

`scripts/smoke-industry-context-read-path.ts` result:

- `dbReadAttempted=true`
- `dbWriteAttempted=false`
- `providerFetchAttempted=false`
- `csvImportAttempted=false`
- `schemaChanged=false`
- `industryContextRowsFound=5`
- `industryContextReadableTickers=FPT, MWG, VNM, HPG, MSN`
- `missingTickerHandledSafely=true`
- `assistantInjectsDbIndustryContext=true`
- `uiLayoutRedesigned=false`
- `uiDbContextWarningWired=true`
- `numericIndustryMetricsInvented=false`
- `valuationRiskBenchmarksInvented=false`
- `productionApprovedTrueCount=0`
- `needsReviewTrueCount=5`
- `mockOrSampleAsReal=false`
- `missingDataZeroFilled=false`
- `investmentAdviceAdded=false`
- `smokePassed=true`

## Guardrail Results

- DB writes: no.
- Provider fetch: no.
- CSV import: no.
- Schema migration: no.
- `productionApproved=true`: 0.
- Static/mock fallback as real: no.
- Missing data zero-filled: no.
- Numeric industry metrics invented: no.
- Valuation/risk benchmarks invented: no.
- UI redesign: no.

## Validation Results

| Command | Result |
| --- | --- |
| `npx prisma validate` | pass |
| `npx prisma generate` | pass |
| `npx prisma migrate status` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| targeted eslint for Phase 150B touched files | pass |
| `npm run lint` | fail: global lint is not a clean pass due to old/out-of-scope lint debt |

Global lint failures were in old/out-of-scope files and did not list the new Phase 150B script or touched runtime/UI/Assistant files.

## Known Limitations

- `IndustryContext` still lacks source URL/native provenance fields.
- DB rows are research-only and need review.
- Legacy DB rows may still contain historical staging text in the database, but runtime payload suppresses mock-labeled fields.
- Industry page still relies on static compass guidance for many explanatory sections.
- Numeric industry metrics and valuation/risk benchmarks are not yet modeled.

## Recommended Next Phase

Phase 150C should define and dry-run a real industry provenance/source contract, then decide whether industry metrics need a dedicated `IndustryMetric` model or can reuse an existing observation/provenance pattern.

## Commit

Pending at evidence creation time.
