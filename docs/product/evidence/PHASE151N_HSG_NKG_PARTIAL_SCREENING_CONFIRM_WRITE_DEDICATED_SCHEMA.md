# Phase 151N - HSG/NKG Partial Screening Confirm-Write Dedicated Schema

## Goal

Apply or verify the Screening candidate migration in the local DB environment, then persist HSG/NKG partial Screening candidate rows using the dedicated schema and smoke the read-path.

Strict gating was enforced: HSG/NKG data must not be written unless the DB actually contains:

- `ScreeningCandidate`
- `ScreeningCandidateMetric`
- `ScreeningCandidateProvenance`

## Scope

- HSG and NKG only.
- TVN excluded entirely.
- HSG/NKG remain `screening_candidate`.
- `screeningEligible=true`.
- `analysisEligible=false`.
- No full analysis enablement.
- No UI change.
- No Assistant change.
- No IndustryMetric.
- No valuation/risk benchmark.
- No ranking/scoring.

## Files Changed

- `scripts/confirm-write-screening-steel-direct-peer-candidates.ts`
- `scripts/smoke-screening-steel-direct-peer-candidates-confirm-write-read-path.ts`
- `docs/product/evidence/PHASE151N_HSG_NKG_PARTIAL_SCREENING_CONFIRM_WRITE_DEDICATED_SCHEMA.md`

## Migration Apply Result

Migration file from Phase 151M:

- `prisma/migrations/20260702151000_add_screening_candidate_models/migration.sql`

Validation commands:

```bash
npx prisma validate
npx prisma generate
```

Result:

- Prisma schema validate: passed.
- Prisma generate: passed.

Migration/status commands with `DATABASE_URL` loaded from `.env`:

```bash
npx prisma migrate status
npx prisma migrate dev
npx prisma db execute --file prisma/migrations/20260702151000_add_screening_candidate_models/migration.sql
```

Observed results:

- `prisma migrate status`: process exited abnormally without useful output in the local environment.
- `prisma migrate dev`: Prisma recognized the local Postgres datasource, then returned:

```text
Error: Schema engine error:
```

- `prisma db execute`: returned:

```text
Error: P1001
Can't reach database server at `localhost:5432`
```

Network verification:

```text
TcpTestSucceeded=false for localhost:5432
```

Migration applied: no.

## Schema Verification Result

The updated confirm-write script verifies the actual DB before writing by querying `information_schema.tables`.

Current local result:

```json
{
  "migrationApplied": false,
  "migrationRecorded": false,
  "schemaVerified": false,
  "dbConnectionAvailable": false,
  "dbError": "connect ECONNREFUSED ::1:5432; connect ECONNREFUSED 127.0.0.1:5432",
  "missingSchemaTables": "ScreeningCandidate,ScreeningCandidateMetric,ScreeningCandidateProvenance"
}
```

Because schema verification failed, no candidate data write was attempted.

## Dry-Run Summary

Command:

```bash
npx tsx scripts/confirm-write-screening-steel-direct-peer-candidates.ts
```

Summary:

```json
{
  "phase": "151N",
  "mode": "dry_run",
  "migrationApplied": false,
  "schemaVerified": false,
  "rowsPrepared": 2,
  "rowsWritten": 0,
  "metricRowsPrepared": 8,
  "metricRowsWritten": 0,
  "provenanceRowsPrepared": 8,
  "provenanceRowsWritten": 0,
  "dbWriteAttempted": false,
  "productionApprovedTrueCount": 0,
  "smokePassed": true
}
```

## Confirm-Write Summary

Command:

```bash
npx tsx scripts/confirm-write-screening-steel-direct-peer-candidates.ts --confirm-write
```

Summary:

```json
{
  "phase": "151N",
  "mode": "confirm_write",
  "migrationApplied": false,
  "schemaVerified": false,
  "dbConnectionAvailable": false,
  "rowsPrepared": 2,
  "rowsWritten": 0,
  "rowsCreated": 0,
  "rowsUpdated": 0,
  "rowsSkipped": 2,
  "metricRowsPrepared": 8,
  "metricRowsWritten": 0,
  "provenanceRowsPrepared": 8,
  "provenanceRowsWritten": 0,
  "hsgPeWritten": false,
  "hsgCfoWritten": false,
  "nkgCfoWritten": false,
  "dbWriteAttempted": false,
  "productionApprovedTrueCount": 0,
  "smokePassed": false
}
```

This is the expected fail-closed behavior for a missing/unreachable local DB.

## Idempotency Result

Idempotency write rerun was not executed because migration/schema verification failed.

The confirm-write implementation is idempotent when the schema exists:

- candidates are upserted by `ticker`
- metrics are upserted by `candidateId + metricCode`
- provenance rows are updated by `candidateId + metricId + sourceLabel`

## Screening Read-Path Smoke Result

The read-path smoke was updated to query the dedicated DB tables:

- candidate rows
- metric rows
- provenance rows
- HSG P/E value and provider period
- HSG/NKG CFO consolidated source fields
- TVN absence

It was not run as a passing DB smoke because the DB is unreachable and the Screening tables are not verified.

## HSG/NKG Metric Summary Prepared For Write

Prepared candidate rows:

- HSG
- NKG

Prepared metrics:

- HSG `PE=14.72`, `providerPeriod=2026-Q2`, source `VNStock Fundamental equity ratio`, `provider_snapshot`
- HSG `PB` from existing reviewed package
- HSG `CFO=3659840645961`, consolidated cash-flow source, fiscal year ended `2025-09-30`
- HSG `LIQUIDITY` from existing reviewed package
- NKG `PE` from existing reviewed package
- NKG `PB` from existing reviewed package
- NKG `CFO=1326940472262`, consolidated annual-report source
- NKG `LIQUIDITY` from existing reviewed package

## HSG/NKG Caveats

Candidate and metric rows remain guarded as:

- `screening_candidate`
- `research_only`
- `needsReview=true`
- `productionApproved=false`
- not investment advice
- not full analysis
- not valuation/risk benchmark
- provider P/E is a market ratio snapshot, not audited financial data
- CFO is manual consolidated source

## TVN Exclusion

TVN remains excluded:

- no write candidate
- no read-path row
- no screening eligibility
- no provider fetch
- no future candidate package change

## Guardrail Confirmation

- DB writes: no
- HSG_PE written: no
- HSG_CFO written: no
- NKG_CFO written: no
- HSG/NKG screeningEligible prepared: yes
- HSG/NKG analysisEligible: no
- HSG/NKG full analysis enabled: no
- TVN screening eligible: no
- IndustryMetric created: no
- valuation benchmark created: no
- risk benchmark created: no
- peer valuation/risk comparison created: no
- ranking/scoring created: no
- forbidden advice wording introduced: no
- `productionApprovedTrueCount=0`
- missing values remain null/N/A, not zero-filled

## Validation

Passed:

```bash
npx prisma validate
npx prisma generate
npx eslint scripts/confirm-write-screening-steel-direct-peer-candidates.ts scripts/smoke-screening-steel-direct-peer-candidates-confirm-write-read-path.ts scripts/smoke-screening-candidate-schema-contract.ts
npx tsx scripts/smoke-screening-candidate-schema-contract.ts
npx tsx scripts/confirm-write-screening-steel-direct-peer-candidates.ts
npm run typecheck
```

Fail-closed:

```bash
npx tsx scripts/confirm-write-screening-steel-direct-peer-candidates.ts --confirm-write
```

Result:

- DB unavailable.
- `schemaVerified=false`.
- `dbWriteAttempted=false`.
- `rowsWritten=0`.

## Next Recommended Phase

Before writing HSG/NKG Screening candidates, fix or start the local PostgreSQL environment and apply the existing Phase 151M migration.

Recommended next phase:

- Phase 151N-Retry - Local PostgreSQL migration environment repair + rerun HSG/NKG confirm-write/read-path smoke.

If migration and confirm-write then succeed:

- Phase 151O - Screening API/UI caveat surfacing and user-facing filter MVP.
