# Phase 151G - VNStock P/E Snapshot CFO Boundary Dry Run

## Goal
Define and validate the boundary that HSG/NKG market-derived Screening metrics may come from a VNStock/provider snapshot, while CFO remains controlled by annual-report/manual reviewed accounting sources. This phase is dry-run only.

## Scope
- Tickers in scope: `HSG`, `NKG`.
- Excluded entirely: `TVN`.
- Market/provider snapshot metrics allowed by contract: `P/E`, `P/B`, `liquidity`, and close price metadata.
- Accounting/manual-source metrics kept outside provider snapshot closure: `CFO`, and accounting debt components when provider definitions are unclear.
- No DB write, no schema change, no UI change, no Assistant change, and no confirm-write.

## Files Changed
- `scripts/screening-steel-direct-peer-provider-snapshots.ts`
- `scripts/dry-run-screening-steel-direct-peer-metrics.ts`
- `docs/product/evidence/PHASE151G_VNSTOCK_PE_SNAPSHOT_CFO_BOUNDARY_DRY_RUN.md`

## VNStock/Provider Snapshot Handling
Phase 151G adds a provider snapshot package contract for HSG/NKG market-derived metrics. The contract requires:
- `ticker`
- `metricCode`
- `value` or `null`
- `unit`
- `periodType=market_snapshot`
- `snapshotDate` or `nearestTradingDate`
- `sourceLabel=VNStock`
- `sourceType=provider_snapshot`
- `retrievedAt`
- `providerDefinitionKnown`
- `extractedQuote=null`
- `reviewNote`
- non-empty `warningCodes`
- `dataMode=research_only`
- `needsReview=true`
- `productionApproved=false`
- `staleAfterDays`
- `refreshPolicy=manual_or_provider_refresh`

The current repo has safe VNStock market-price infrastructure for controlled tickers, but HSG/NKG are not in the controlled VNStock fetch set. Therefore Phase 151G does not fetch provider data and does not invent P/E/P/B/liquidity values.

## Snapshot Summary
| Ticker | P/E Snapshot | P/B Snapshot | Liquidity Snapshot | Status |
| --- | --- | --- | --- | --- |
| HSG | `null` | `null` | `null` | Provider snapshot contract present, value missing |
| NKG | Existing package P/E remains available; VNStock snapshot `null` | `null` | `null` | Provider snapshot contract present, value missing |

Provider snapshot caveats:
- `providerFetchAttempted=false`
- `sourceLabel=VNStock`
- `sourceType=provider_snapshot`
- `dataMode=research_only`
- `needsReview=true`
- `productionApproved=false`
- stale market snapshot warning required before any future write eligibility

## CFO Boundary
CFO is not a market/provider snapshot metric. HSG/NKG CFO gaps remain open until a reviewed annual-report/manual accounting source package explicitly provides net cash flow from operating activities with period and statement scope.

VNStock/provider snapshot data is not allowed to close CFO unless a future approved source package explicitly defines the field, period, and statement scope.

## Gap List
Before Phase 151G:
- `HSG_PE`
- `HSG_CFO`
- `NKG_CFO`

Closed in Phase 151G:
- None

Remaining after Phase 151G:
- `HSG_PE`
- `HSG_CFO`
- `NKG_CFO`

`HSG_PE` was not closed because no safe HSG/NKG VNStock provider snapshot fetch or reviewed snapshot value exists in this phase.

## Dry-Run Summary
```json
{
  "phase": "151G",
  "candidateTickers": "HSG,NKG",
  "providerSnapshotAttempted": false,
  "providerSnapshotSource": "VNStock",
  "marketSnapshotMetricsValidated": "pe,pb,liquidity",
  "hsgPeGapStatus": "still_missing",
  "nkgPeStatus": "available",
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
  "providerFetchAttempted": false,
  "dbWriteAttempted": false,
  "schemaChanged": false,
  "productionApprovedTrueCount": 0,
  "readyForConfirmWrite": false,
  "readyForPartialScreeningConfirmWrite": false,
  "smokePassed": true
}
```

## Guardrail Confirmation
- No DB write.
- No schema change.
- No UI change.
- No Assistant change.
- No provider fetch.
- No IndustryMetric.
- No valuation benchmark.
- No risk benchmark.
- No peer valuation/risk comparison.
- No ranking/scoring.
- No HSG/NKG full analysis enablement.
- No TVN screening data.
- `productionApprovedTrueCount=0`.
- Missing values remain `null`; no zero-fill.
- VNStock/provider snapshot is research-only, needs review, and not production-approved.

## Next Recommended Phase
If CFO remains required for full candidate coverage, collect/review HSG/NKG CFO manual annual-report sources next.

If partial screening is later accepted as a product decision, run a separate Phase 151H for HSG/NKG partial screening candidate confirm-write and Screening read-path MVP, with provider snapshot values present and stale-date caveats explicit.
