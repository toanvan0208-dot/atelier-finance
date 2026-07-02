# Phase 151R - Core Ticker Screening Candidate Backfill Dry Run

## Goal

Prepare a dry-run-only `ScreeningCandidate` backfill package for the core ticker universe:

- FPT
- HPG
- VNM
- MSN
- MWG
- VCB

This phase does not write database rows. It only inspects existing local/runtime read-paths and reports whether the core tickers are ready for a future confirm-write.

## Scope

- Dry-run only.
- No DB write.
- No schema change.
- No provider fetch.
- No UI change.
- No Assistant change.
- No Supabase write.
- No ranking, scoring, stock attractiveness score, benchmark, or `IndustryMetric`.
- No buy/sell/hold recommendation.
- Missing data remains `null` / N/A / `needs_review`; no zero-fill.
- `productionApproved=true` remains 0.

## Files Changed

- `scripts/dry-run-screening-core-ticker-backfill.ts`
- `docs/product/evidence/PHASE151R_CORE_TICKER_SCREENING_BACKFILL_DRY_RUN.md`

## Source / Read-Paths Inspected

The dry-run script uses only local runtime/read-path data:

- `prisma.company`
- `loadFinancialsRuntimeData({ preferDb: true, allowFallback: false })`
- `getLatestMarketPrice(..., { dataMode: "research_only" })`
- `loadIndustryTaxonomyRuntimeByTicker`
- Existing `ScreeningCandidate` schema contract

No provider/network fetch is attempted.

## Candidate Package Summary

| Ticker | Coverage level | Screening eligible | Analysis eligible | Ready for confirm-write |
| --- | --- | --- | --- | --- |
| FPT | `missing_safe` | false | false | no |
| HPG | `missing_safe` | false | false | no |
| VNM | `missing_safe` | false | false | no |
| MSN | `missing_safe` | false | false | no |
| MWG | `missing_safe` | false | false | no |
| VCB | `missing_safe` | false | false | no |

Current local runtime inspection did not find eligible company, taxonomy, financials, market price, or metric inputs for these six tickers under the allowed read-paths. Therefore every package remains fail-closed as `missing_safe`.

## Metric Availability

| Ticker | P/E | P/B | CFO | Liquidity | Close price | EPS | Shares outstanding | Total debt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FPT | null | null | null | null | null | null | null | null |
| HPG | null | null | null | null | null | null | null | null |
| VNM | null | null | null | null | null | null | null | null |
| MSN | null | null | null | null | null | null | null | null |
| MWG | null | null | null | null | null | null | null | null |
| VCB | null | null | null | null | null | null | null | null |

No metric was zero-filled. Null metrics are marked `MISSING_SAFE`, `NEEDS_REVIEW`, `NO_ZERO_FILL`, and `RESEARCH_ONLY`.

## Missing Fields By Ticker

Each core ticker is missing:

- `company`
- `industryCode`
- `financialsRuntime`
- `PE`
- `PB`
- `CFO`
- `LIQUIDITY`
- `CLOSE_PRICE`
- `EPS`
- `SHARES_OUTSTANDING`
- `TOTAL_DEBT`

## Dry-Run Summary

```json
{
  "phase": "151R",
  "mode": "dry_run",
  "candidateTickers": "FPT,HPG,VNM,MSN,MWG,VCB",
  "rowsPrepared": 6,
  "metricRowsPrepared": 48,
  "provenanceRowsPrepared": 48,
  "dbWriteAttempted": false,
  "providerFetchAttempted": false,
  "schemaChanged": false,
  "productionApprovedTrueCount": 0,
  "fullAnalysisCandidateCount": 0,
  "screeningCandidateCount": 0,
  "missingSafeCount": 6,
  "tickersReadyForConfirmWrite": [],
  "tickersBlocked": ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"],
  "fptStatus": "missing_safe",
  "hpgStatus": "missing_safe",
  "vnmStatus": "missing_safe",
  "msnStatus": "missing_safe",
  "mwgStatus": "missing_safe",
  "vcbStatus": "missing_safe",
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "fakeMetricWriteEligible": false,
  "forbiddenAdviceDetected": false,
  "rankingCreated": false,
  "stockAttractivenessScoreCreated": false,
  "industryMetricCreated": false,
  "benchmarkCreated": false,
  "valuationRiskBenchmarkInvented": false,
  "readyForConfirmWrite": false,
  "smokePassed": true
}
```

## Guardrail Confirmation

- DB writes: no.
- Provider fetch: no.
- Schema change: no.
- HSG/NKG untouched: yes.
- TVN absent: yes.
- Ranking/scoring created: false.
- Stock attractiveness score created: false.
- Benchmark created: false.
- `IndustryMetric` created: false.
- Forbidden advice wording detected: false.
- `productionApprovedTrueCount=0`.
- Missing values remain null/N/A.

## Validation

Passed:

```bash
npx eslint scripts/dry-run-screening-core-ticker-backfill.ts
npx tsx scripts/dry-run-screening-core-ticker-backfill.ts
npx prisma validate
npx prisma generate
npm run typecheck
```

## Next Recommended Phase

`readyForConfirmWrite=false`.

Before Phase 151S, close the local read-path gaps for the core tickers or provide reviewed source packages for the missing company, taxonomy, financials, market price, and metric fields. Once at least one core ticker has an eligible package, Phase 151S can perform a bounded `ScreeningCandidate` confirm-write and read-path smoke.
