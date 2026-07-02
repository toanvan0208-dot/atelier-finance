# Phase 151H - HSG/NKG VNStock Screening Snapshot Fetch Dry Run

## Goal
Add a safe dry-run-only VNStock/provider snapshot fetch path for HSG/NKG Screening market metrics while keeping CFO gaps manual-source controlled.

## Scope
- Included tickers: `HSG`, `NKG`.
- Excluded ticker: `TVN`.
- Market/provider snapshot metrics only: `P/E`, `P/B`, `liquidity`, and close price metadata.
- CFO remains outside provider snapshot closure.
- No DB write, no schema change, no UI change, no Assistant change, no confirm-write.

## Files Changed
- `scripts/screening-steel-direct-peer-provider-snapshots.ts`
- `scripts/dry-run-screening-steel-direct-peer-metrics.ts`
- `docs/product/evidence/PHASE151H_HSG_NKG_VNSTOCK_SCREENING_SNAPSHOT_FETCH_DRY_RUN.md`

## Provider Fetch Approach
Phase 151H adds an opt-in local VNStock dry-run fetch path:

- Default behavior: no provider fetch.
- Opt-in flag: `ATELIER_SCREENING_VNSTOCK_FETCH_DRY_RUN=true`.
- Local allowlist: `HSG`, `NKG`.
- `TVN` is not in the allowlist and is not included in packages, future candidates, or metric collection plan.
- Fetch path uses a bounded date window ending on `2026-07-02`.
- Provider results are normalized to research-only snapshot packages.
- Provider errors fail closed: values remain `null`, warning codes are recorded, and no DB write is possible.

The default validation run did not attempt provider fetch, so the phase proves the fetch boundary and no-write path without relying on network or local Python package availability.

## Provider Fetch Status
- `providerFetchAttempted=false`
- `providerFetchSucceeded=false`
- `providerSnapshotSource=VNStock`
- `productionApproved=false`
- `needsReview=true`
- `dataMode=research_only`

## HSG/NKG Snapshot Summary
| Ticker | P/E | P/B | Liquidity | Close price metadata |
| --- | --- | --- | --- | --- |
| HSG | Missing; `HSG_PE` remains open | Available from existing reviewed package; provider snapshot fetch not attempted | Available from existing reviewed package; provider snapshot fetch not attempted | Not fetched by default |
| NKG | Available from existing reviewed package; provider snapshot fetch not attempted | Available from existing reviewed package; provider snapshot fetch not attempted | Available from existing reviewed package; provider snapshot fetch not attempted | Not fetched by default |

Liquidity proxy handling:
- If a future opt-in fetch returns trading value, liquidity unit is `vnd_trading_value`.
- If only volume is returned, liquidity unit is `shares` and warning code identifies `LIQUIDITY_PROXY_VOLUME`.
- If liquidity is unavailable, value remains `null` with warning codes.

## Gap List
Before Phase 151H:
- `HSG_PE`
- `HSG_CFO`
- `NKG_CFO`

Closed in Phase 151H:
- None

Remaining after Phase 151H:
- `HSG_PE`
- `HSG_CFO`
- `NKG_CFO`

`HSG_PE` was not closed because the default dry-run did not fetch provider data and no reviewed provider snapshot value exists in this phase.

## CFO Boundary Confirmation
- `HSG_CFO=open_manual_source_required`
- `NKG_CFO=open_manual_source_required`
- CFO remains accounting cash-flow data.
- CFO must come from annual reports, audited financial statements, or manual reviewed accounting source packages.
- VNStock/provider snapshot data is not used to close CFO in this phase.

## Dry-Run Summary
```json
{
  "phase": "151H",
  "candidateTickers": "HSG,NKG",
  "providerFetchAttempted": false,
  "providerFetchSucceeded": false,
  "providerSnapshotSource": "VNStock",
  "marketSnapshotMetricsValidated": "pe,pb,liquidity",
  "hsgPeGapStatus": "still_missing",
  "nkgPeStatus": "available",
  "hsgPbStatus": "available",
  "nkgPbStatus": "available",
  "hsgLiquidityStatus": "available",
  "nkgLiquidityStatus": "available",
  "cfoSourceBoundaryEnforced": true,
  "hsgCfoGapStatus": "open_manual_source_required",
  "nkgCfoGapStatus": "open_manual_source_required",
  "missingSourceGapsBefore": "HSG_PE,HSG_CFO,NKG_CFO",
  "closedSourceGaps": "",
  "remainingSourceGaps": "HSG_PE,HSG_CFO,NKG_CFO",
  "coverageLevel": "screening_candidate",
  "analysisEligibleFalseCount": 2,
  "screeningEligibleTrueCount": 2,
  "tvnPresentInCandidatePackages": false,
  "tvnScreeningEligible": false,
  "fakeMetricWriteEligible": false,
  "forbiddenAdviceDetected": false,
  "rankingCreated": false,
  "stockAttractivenessScoreCreated": false,
  "industryMetricCreated": false,
  "benchmarkCreated": false,
  "valuationRiskBenchmarkInvented": false,
  "dbWriteAttempted": false,
  "schemaChanged": false,
  "productionApprovedTrueCount": 0,
  "readyForConfirmWrite": false,
  "readyForPartialScreeningConfirmWrite": false,
  "smokePassed": true
}
```

## Partial Screening Confirm-Write
`readyForPartialScreeningConfirmWrite=false`.

Reason:
- `HSG_PE` remains missing.
- CFO gaps remain explicit and manual-source controlled.
- No provider snapshot values were fetched in the default validation run.

## Guardrail Confirmation
- No DB write.
- No schema change.
- No UI change.
- No Assistant change.
- No IndustryMetric.
- No valuation benchmark.
- No risk benchmark.
- No peer valuation/risk comparison.
- No ranking/scoring.
- No HSG/NKG full analysis enablement.
- No TVN screening data.
- `productionApprovedTrueCount=0`.
- Missing values remain `null`; no zero-fill.
- Provider snapshot data remains `research_only`, `needsReview`, and not production-approved.

## Next Recommended Phase
Continue manual CFO collection from HSG/NKG annual reports or audited financial statements.

If opt-in provider fetch later returns complete HSG/NKG market snapshot values with valid dates and caveats, run a separate Phase 151I for HSG/NKG partial screening candidate confirm-write and Screening read-path MVP.
