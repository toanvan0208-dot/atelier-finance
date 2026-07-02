# Phase 151I - HSG/NKG VNStock Opt-In Fetch Dry Run

## Goal
Execute the opt-in VNStock dry-run provider fetch path for HSG/NKG and check whether HSG P/E can be closed by a safe provider market snapshot.

## Scope
- Included tickers: `HSG`, `NKG`.
- Excluded ticker: `TVN`.
- Provider snapshot metrics only: `P/E`, `P/B`, `liquidity`, close price metadata.
- CFO remains manual/audited-source controlled.
- No DB write, no schema change, no UI change, no Assistant change, no confirm-write.

## Files Changed
- `scripts/dry-run-screening-steel-direct-peer-metrics.ts`
- `docs/product/evidence/PHASE151I_HSG_NKG_VNSTOCK_OPT_IN_FETCH_DRY_RUN.md`

## Command Used
PowerShell:

```powershell
$env:ATELIER_SCREENING_VNSTOCK_FETCH_DRY_RUN="true"; npx tsx scripts/dry-run-screening-steel-direct-peer-metrics.ts; Remove-Item Env:ATELIER_SCREENING_VNSTOCK_FETCH_DRY_RUN
```

## Provider Fetch Status
- `providerFetchAttempted=true`
- `providerFetchSucceeded=true`
- `providerFetchErrorSummaries=""`
- `providerSnapshotSource=VNStock`
- `dataMode=research_only`
- `needsReview=true`
- `productionApproved=false`

No SSL bypass flag was used.

## HSG/NKG Snapshot Summary
| Ticker | P/E | P/B | Liquidity | Close price metadata |
| --- | --- | --- | --- | --- |
| HSG | Missing from provider snapshot; value remains `null` | Missing from provider snapshot; existing reviewed package remains available | Closed by provider snapshot using `volume` proxy | Present as provider snapshot metadata |
| NKG | Missing from provider snapshot; existing reviewed package remains available | Missing from provider snapshot; existing reviewed package remains available | Closed by provider snapshot using `volume` proxy | Present as provider snapshot metadata |

Snapshot date / nearest trading date:
- HSG: `2026-07-02`
- NKG: `2026-07-02`

Provider caveats:
- VNStock snapshot is research-only and needs review.
- Liquidity uses `LIQUIDITY_PROXY_VOLUME`, not trading value.
- P/E and P/B are not provider-definition-known in this fetch result.
- P/E remains `null` where the provider payload did not expose a reviewed ratio.

## Gap List
Before Phase 151I:
- `HSG_PE`
- `HSG_CFO`
- `NKG_CFO`

Closed in Phase 151I:
- None

Remaining after Phase 151I:
- `HSG_PE`
- `HSG_CFO`
- `NKG_CFO`

`HSG_PE` was not closed because the provider fetch did not return a P/E value with the required ratio unit, snapshot date, retrievedAt, caveats, `research_only`, `needsReview=true`, and `productionApproved=false` package metadata.

## CFO Boundary Confirmation
- `HSG_CFO=open_manual_source_required`
- `NKG_CFO=open_manual_source_required`
- CFO remains accounting cash-flow data.
- CFO must come from annual reports, audited financial statements, or manual reviewed accounting source packages.
- VNStock/provider snapshot data was not used to close CFO.

## Dry-Run Summary
```json
{
  "phase": "151I",
  "candidateTickers": "HSG,NKG",
  "providerFetchAttempted": true,
  "providerFetchSucceeded": true,
  "providerFetchErrorSummaries": "",
  "providerSnapshotSource": "VNStock",
  "marketSnapshotMetricsValidated": "pe,pb,liquidity",
  "hsgPeGapStatus": "still_missing",
  "nkgPeStatus": "available",
  "hsgPbStatus": "available",
  "nkgPbStatus": "available",
  "hsgLiquidityStatus": "closed_by_provider_snapshot",
  "nkgLiquidityStatus": "closed_by_provider_snapshot",
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
- CFO gaps remain open/manual-source required.
- Provider snapshot did not expose P/E/P/B ratios in a reviewable ratio contract.

## Explicit TVN Exclusion
TVN is not in candidate packages, fetch allowlist, provider fetch result, or metric collection plan.

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
Because `HSG_PE` remains missing, continue provider fetch hardening or provide a manual HSG P/E market snapshot source with snapshot date, retrievedAt, source label, caveats, and `productionApproved=false`.
