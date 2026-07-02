# Phase 151O - Screening API/UI Caveat Surfacing MVP

## Goal

Implement the smallest production-safe Screening MVP read-path/API/UI surfacing for dedicated `ScreeningCandidate` tables.

HSG/NKG are visible in Screening as `screening_candidate` only, with clear caveats. This phase does not enable full analysis, benchmarks, ranking, scoring, valuation/risk usage, or investment recommendation behavior.

## Files Changed

- `src/features/screening/lib/screening-candidate-read-path.ts`
- `src/features/screening/lib/load-screening-runtime-data.ts`
- `src/app/api/screening/candidates/route.ts`
- `src/features/screening/components/ScreeningPage.tsx`
- `scripts/smoke-screening-api-ui-caveat-surfacing-mvp.ts`
- `docs/product/evidence/PHASE151O_SCREENING_API_UI_CAVEAT_SURFACING_MVP.md`

## API / Read-Path Behavior

Added a read-only Screening candidate read-path that reads dedicated tables:

- `ScreeningCandidate`
- `ScreeningCandidateMetric`
- `ScreeningCandidateProvenance`

API route:

- `GET /api/screening/candidates`

Response payload includes:

- `ticker`
- `companyName`
- `coverageLevel`
- `screeningEligible`
- `analysisEligible`
- `needsReview`
- `dataMode`
- `researchOnly`
- `warningCodes`
- `caveats`
- metrics with provenance summary
- `isValuationRiskBenchmarkEligible=false`
- `isFullAnalysisEligible=false`
- `fullAnalysisEnabled=false`

Only HSG/NKG are allowlisted. TVN is explicitly excluded from the read-path.

## UI Caveat Behavior

The Screening page now surfaces a small dedicated `screening_candidate` section for HSG/NKG.

The section:

- shows HSG/NKG as Screening candidates only
- labels `screening_candidate`, `research_only`, `needsReview=true`
- shows `analysisEligible=false`
- shows full analysis disabled
- shows benchmark ineligible
- labels HSG P/E as provider market-ratio snapshot, not audited financial data
- labels HSG/NKG CFO as manual consolidated cash-flow source
- states HSG/NKG cannot be used in Business/Financials/Valuation/Risk deep-analysis path

No large redesign was made. The UI behaves like a candidate universe/filter, not a leaderboard.

## Smoke Command

```bash
npx tsx scripts/smoke-screening-api-ui-caveat-surfacing-mvp.ts
```

## Smoke Output Summary

```json
{
  "phase": "151O",
  "smoke": "screening-api-ui-caveat-surfacing-mvp",
  "candidateCount": 2,
  "hsgAppears": true,
  "nkgAppears": true,
  "tvnAbsent": true,
  "hsgCoverageLevel": "screening_candidate",
  "nkgCoverageLevel": "screening_candidate",
  "hsgAnalysisEligible": false,
  "nkgAnalysisEligible": false,
  "hsgFullAnalysisEnabled": false,
  "nkgFullAnalysisEnabled": false,
  "hsgBenchmarkEligible": false,
  "nkgBenchmarkEligible": false,
  "hsgPeProviderSnapshot": true,
  "hsgPeValue": 14.72,
  "hsgPeProviderPeriod": "2026-Q2",
  "hsgPeCaveatIncludesProviderSnapshot": true,
  "hsgPeCaveatIncludesResearchOnly": true,
  "hsgPeCaveatIncludesNeedsReview": true,
  "hsgCfoManualConsolidatedSource": true,
  "nkgCfoManualConsolidatedSource": true,
  "uiCaveatMentionsNotInvestmentAdvice": true,
  "uiCaveatMentionsNotFullAnalysis": true,
  "uiCaveatMentionsNotBenchmark": true,
  "forbiddenAdviceDetected": false,
  "rankingCreated": false,
  "stockAttractivenessScoreCreated": false,
  "industryMetricCreated": false,
  "benchmarkCreated": false,
  "productionApprovedTrueCount": 0,
  "dbWriteAttempted": false,
  "schemaChanged": false,
  "smokePassed": true
}
```

## Validation

Passed:

```bash
npx eslint src/features/screening/lib/screening-candidate-read-path.ts src/features/screening/lib/load-screening-runtime-data.ts src/app/api/screening/candidates/route.ts src/features/screening/components/ScreeningPage.tsx scripts/smoke-screening-api-ui-caveat-surfacing-mvp.ts
npx tsx scripts/smoke-screening-api-ui-caveat-surfacing-mvp.ts
npx vitest run src/features/screening/lib/__tests__/screening-readiness-mvp.test.ts src/features/screening/components/__tests__/ScreeningPage.copy.test.ts
npm run typecheck
```

## Guardrail Confirmations

- DB writes: no, read-only only.
- Schema changed: no.
- HSG/NKG remain `screening_candidate`.
- HSG/NKG `analysisEligible=false`.
- HSG/NKG full analysis enabled: false.
- TVN excluded: true.
- IndustryMetric created: false.
- valuation/risk benchmark created: false.
- HSG/NKG benchmark eligible: false.
- ranking/scoring created: false.
- stock attractiveness score created: false.
- forbidden advice wording detected: false.
- `productionApprovedTrueCount=0`.
- Provider P/E remains `research_only` / `needsReview` / `productionApproved=false`.
- CFO remains manual consolidated source.
- Missing data surfaces as N/A / needs_review, not zero-filled.

## Next Recommended Phase

Phase 151P - Screening user-facing filter refinement and blocked deep-analysis navigation copy, if product wants more explicit interactions around partial candidates.
