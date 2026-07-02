# Phase 151K - HSG_PE VNStock Fundamental Ratio Closure Dry Run

## Goal
Integrate and execute a dry-run-only VNStock Fundamental equity ratio provider path for Screening market ratios, then close `HSG_PE` if the provider returns a valid P/E value.

## Scope
- `HSG_PE` only.
- HSG/NKG allowlist only.
- TVN excluded entirely.
- HSG_CFO and NKG_CFO preserved as closed by manual consolidated source.
- NKG_PE remains available from the existing package.
- HSG/NKG remain `screening_candidate` only.
- No DB write, no schema change, no UI change, no Assistant change, no confirm-write.

## Files Changed
- `scripts/screening-steel-direct-peer-provider-snapshots.ts`
- `scripts/dry-run-screening-steel-direct-peer-metrics.ts`
- `docs/product/evidence/PHASE151K_HSG_PE_VNSTOCK_FUNDAMENTAL_RATIO_CLOSURE_DRY_RUN.md`

## Command Used
PowerShell:

```powershell
$env:ATELIER_SCREENING_VNSTOCK_RATIO_FETCH_DRY_RUN="true"; npx tsx scripts/dry-run-screening-steel-direct-peer-metrics.ts; Remove-Item Env:ATELIER_SCREENING_VNSTOCK_RATIO_FETCH_DRY_RUN
```

## VNStock Fundamental Ratio Provider Path
The script uses a dry-run-only Python subprocess and tries:

```python
from vnstock_data import Fundamental
```

If unavailable, it falls back to:

```python
from vnstock import Fundamental
```

It then runs:

```python
fa = Fundamental()
equity = fa.equity(symbol=symbol)
df = equity.ratio()
```

P/E extraction rule:
- Require an `item` column.
- Match a row whose `item` contains one of: `p/e`, `price to earnings`, `price/earnings`, or `chỉ số giá thị trường trên thu nhập`.
- Select the latest period column with a non-null numeric value.
- Do not self-calculate P/E from price/EPS.

## Provider Fetch Status
- `fundamentalRatioFetchAttempted=true`
- `fundamentalRatioFetchSucceeded=true`
- `fundamentalRatioFetchErrorSummaries=""`
- Import source reported by provider warning: `vnstock`
- `providerSnapshotSource=VNStock Fundamental equity ratio`
- `productionApprovedTrueCount=0`

## HSG_PE Source Summary
- Ticker: `HSG`
- Metric: `PE`
- Value: `14.72`
- Unit: `ratio`
- Provider period: `2026-Q2`
- Retrieved at / snapshot date used by dry-run: `2026-07-02`
- Source label: `VNStock Fundamental equity ratio`
- Source type: `provider_snapshot`
- Provider definition known: `true`
- Extracted quote: `Chỉ số giá thị trường trên thu nhập (P/E) ... 2026-Q2 ... 14.72`
- Review note: P/E is taken directly from VNStock Fundamental equity ratio API, not self-calculated.
- Warning codes include `PROVIDER_SNAPSHOT`, `NEEDS_REVIEW`, `RESEARCH_ONLY`, `MARKET_RATIO_NOT_AUDITED`, and `STALE_SNAPSHOT_CHECK_REQUIRED`.

## Gap List
Before Phase 151K:
- `HSG_PE`

Closed in Phase 151K:
- `HSG_PE`

Remaining after Phase 151K:
- None

## CFO Boundary Confirmation
- `HSG_CFO=closed_by_manual_consolidated_source`
- `NKG_CFO=closed_by_manual_consolidated_source`
- CFO remains accounting cash-flow data.
- VNStock Fundamental ratio data was not used to modify or close CFO.

## Dry-Run Summary
```json
{
  "phase": "151K",
  "candidateTickers": "HSG,NKG",
  "fundamentalRatioFetchAttempted": true,
  "fundamentalRatioFetchSucceeded": true,
  "fundamentalRatioFetchErrorSummaries": "",
  "providerSnapshotSource": "VNStock Fundamental equity ratio",
  "hsgPeSourceLoaded": true,
  "hsgPeValue": 14.72,
  "hsgPeProviderPeriod": "2026-Q2",
  "hsgPeGapStatus": "closed_by_vnstock_fundamental_ratio_snapshot",
  "hsgCfoGapStatus": "closed_by_manual_consolidated_source",
  "nkgCfoGapStatus": "closed_by_manual_consolidated_source",
  "nkgPeStatus": "available",
  "missingSourceGapsBefore": "HSG_PE",
  "closedSourceGaps": "HSG_PE",
  "remainingSourceGaps": "",
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
  "readyForPartialScreeningConfirmWrite": true,
  "smokePassed": true
}
```

## Explicit TVN Exclusion
TVN is not in candidate packages, future candidates, fetch allowlist, provider fetch result, or metric collection plan.

## Partial Screening Confirm-Write
`readyForPartialScreeningConfirmWrite=true`.

This does not write data in Phase 151K. It only means a later confirm-write phase can be considered for HSG/NKG partial Screening candidate read-path work while keeping all caveats visible.

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
- Missing data remains `null`; no zero-fill.
- P/E is a provider market ratio snapshot, not audited financial data.
- P/E is `research_only`, `needsReview=true`, and `productionApproved=false`.

## Next Recommended Phase
Phase 151L - HSG/NKG partial screening candidate confirm-write + Screening read-path MVP, while preserving provider caveats and keeping HSG/NKG at `screening_candidate` only.
