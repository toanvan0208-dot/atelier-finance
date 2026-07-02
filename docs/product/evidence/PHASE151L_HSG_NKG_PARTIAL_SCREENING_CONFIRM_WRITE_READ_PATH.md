# Phase 151L - HSG/NKG Partial Screening Confirm-Write Read-Path

## Goal
Prepare HSG/NKG partial Screening candidate rows for confirm-write, then verify whether the existing schema can safely persist Screening candidate metrics and provenance.

## Scope
- Included tickers: `HSG`, `NKG`.
- Excluded ticker: `TVN`.
- HSG/NKG remain `screening_candidate`.
- `screeningEligible=true`.
- `analysisEligible=false`.
- No full analysis enablement.
- No DB write unless the existing schema can safely store Screening candidate rows.

## Files Changed
- `scripts/confirm-write-screening-steel-direct-peer-candidates.ts`
- `scripts/smoke-screening-steel-direct-peer-candidates-confirm-write-read-path.ts`
- `docs/product/evidence/PHASE151L_HSG_NKG_PARTIAL_SCREENING_CONFIRM_WRITE_READ_PATH.md`

## Schema Change Status
No schema change was made.

The existing schema does not contain dedicated Screening candidate storage models:
- `ScreeningCandidate`
- `ScreeningCandidateMetric`
- `ScreeningCandidateProvenance`

Because P/E, P/B, CFO, liquidity, eligibility, and caveats cannot be stored safely in the existing models without mixing semantic domains, confirm-write is blocked fail-closed.

## Write Guard / Commands
Dry-run:

```powershell
npx tsx scripts/confirm-write-screening-steel-direct-peer-candidates.ts
```

Confirm-write attempt:

```powershell
npx tsx scripts/confirm-write-screening-steel-direct-peer-candidates.ts --confirm-write
```

Idempotency rerun:

```powershell
npx tsx scripts/confirm-write-screening-steel-direct-peer-candidates.ts --confirm-write
```

## Dry-Run Summary
```json
{
  "phase": "151L",
  "mode": "dry_run",
  "candidateTickers": "HSG,NKG",
  "rowsPrepared": 2,
  "rowsWritten": 0,
  "rowsCreated": 0,
  "rowsUpdated": 0,
  "rowsSkipped": 2,
  "provenanceRowsPrepared": 8,
  "provenanceRowsWritten": 0,
  "schemaGapDetected": true,
  "missingSchemaModels": "ScreeningCandidate,ScreeningCandidateMetric,ScreeningCandidateProvenance",
  "productionApprovedTrueCount": 0,
  "readPathSmokePassed": false,
  "smokePassed": true
}
```

## Confirm-Write Summary
Confirm-write was executed with `--confirm-write`, but no DB write was attempted because the schema gap was detected before any write path.

```json
{
  "phase": "151L",
  "mode": "confirm_write",
  "rowsPrepared": 2,
  "rowsWritten": 0,
  "rowsCreated": 0,
  "rowsUpdated": 0,
  "rowsSkipped": 2,
  "provenanceRowsPrepared": 8,
  "provenanceRowsWritten": 0,
  "dbWriteAttempted": false,
  "schemaChanged": false,
  "schemaGapDetected": true,
  "productionApprovedTrueCount": 0,
  "idempotencyPassed": true
}
```

## Screening Read-Path Smoke
Smoke script:

```powershell
npx tsx scripts/smoke-screening-steel-direct-peer-candidates-confirm-write-read-path.ts
```

Result:
- Prepared HSG/NKG packages are valid.
- TVN is absent.
- HSG/NKG remain `screening_candidate`.
- HSG/NKG `analysisEligible=false`.
- HSG/NKG CFO rows remain closed by manual consolidated source.
- Read-path DB rows are not expected because the schema gap blocks persistence.
- `readPathSmokePassed=false`.
- `smokePassed=true` for fail-closed boundary behavior.

## HSG/NKG Metric Summary
HSG:
- P/E: `14.72`, provider period `2026-Q2`, source `VNStock Fundamental equity ratio`, `provider_snapshot`, `research_only`, `needsReview=true`, `productionApproved=false`.
- P/B: existing reviewed package value.
- CFO: `3659840645961` VND, manual consolidated cash-flow statement, fiscal year ended `2025-09-30`.
- Liquidity: existing reviewed package value.

NKG:
- P/E: existing reviewed package value.
- P/B: existing reviewed package value.
- CFO: `1326940472262` VND, manual consolidated annual-report cash-flow source.
- Liquidity: existing reviewed package value.

## Caveats
- `screening_candidate`.
- `research_only`.
- `needsReview=true`.
- Not investment advice.
- Not full analysis.
- Not valuation/risk benchmark.
- Provider P/E is a market ratio snapshot, not audited financial data.
- CFO is manual consolidated source.
- Missing values must remain `null` or `N/A`, never zero-filled.

## Explicit TVN Exclusion
- `tvnPresentInWriteCandidates=false`.
- `tvnPresentInReadPath=false`.
- `tvnScreeningEligible=false`.
- TVN was not written, staged, fetched, or added to future candidate plans.

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
- No forbidden advice wording.
- No HSG/NKG full analysis enablement.
- `productionApprovedTrueCount=0`.

## Final Status
Phase 151L prepared valid partial Screening candidate rows, but did not persist them because the existing schema cannot safely store Screening candidate metrics/provenance.

## Next Recommended Phase
Before UI/API caveat surfacing, add a dedicated Screening candidate schema/read model or approve an equivalent safe storage contract. After that, run the confirm-write/read-path phase again, then proceed to Phase 151M - Screening UI/API caveat surfacing and user-facing filter MVP.
