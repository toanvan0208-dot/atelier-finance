# Phase 151N-Retry - Local Postgres Screening Confirm-Write Read Path

## Goal

Verify local PostgreSQL migration, confirm-write HSG/NKG Screening candidates, idempotency rerun, and read-path smoke.

## Environment

- PostgreSQL running via Docker container `atelier-postgres`.
- `DATABASE_URL` points to `localhost:5432` / `atelier_finance`.

## Migration / Status

- `npx prisma migrate status` reported database schema up to date.
- `migrationApplied=true`
- `migrationRecorded=true`
- `schemaVerified=true`
- `dbConnectionAvailable=true`

## Dry-Run

```json
{
  "rowsPrepared": 2,
  "metricRowsPrepared": 8,
  "provenanceRowsPrepared": 8,
  "dbWriteAttempted": false,
  "smokePassed": true
}
```

## First Confirm-Write

```json
{
  "rowsWritten": 2,
  "rowsCreated": 2,
  "rowsUpdated": 0,
  "metricRowsWritten": 8,
  "metricRowsCreated": 8,
  "metricRowsUpdated": 0,
  "provenanceRowsWritten": 8,
  "provenanceRowsCreated": 8,
  "provenanceRowsUpdated": 0,
  "hsgPeWritten": true,
  "hsgCfoWritten": true,
  "nkgCfoWritten": true,
  "productionApprovedTrueCount": 0
}
```

## Idempotency Rerun

```json
{
  "rowsWritten": 2,
  "rowsCreated": 0,
  "rowsUpdated": 2,
  "metricRowsWritten": 8,
  "metricRowsCreated": 0,
  "metricRowsUpdated": 8,
  "provenanceRowsWritten": 8,
  "provenanceRowsCreated": 0,
  "provenanceRowsUpdated": 8,
  "idempotencyPassed": true
}
```

No duplicate rows were created.

## Read-Path Smoke

```json
{
  "smokePassed": true,
  "hsgCandidatePresent": true,
  "nkgCandidatePresent": true,
  "tvnCandidatePresent": false,
  "hsgMetricRows": 4,
  "nkgMetricRows": 4,
  "provenanceRows": 8,
  "hsgPePresent": true,
  "hsgPeValue": 14.72,
  "hsgPeProviderPeriod": "2026-Q2",
  "hsgPeProviderSnapshot": true,
  "hsgCfoPresent": true,
  "hsgCfoValue": 3659840645961,
  "hsgCfoConsolidatedSource": true,
  "nkgCfoPresent": true,
  "nkgCfoValue": 1326940472262,
  "nkgCfoConsolidatedSource": true
}
```

## Guardrails

- DB writes: yes, only HSG/NKG Screening candidate dedicated tables.
- HSG/NKG `coverageLevel` remains `screening_candidate`.
- HSG/NKG `analysisEligible=false`.
- HSG/NKG full analysis enabled: false.
- TVN screening eligible: false.
- IndustryMetric created: false.
- valuation/risk benchmark created: false.
- ranking/scoring created: false.
- `productionApprovedTrueCount=0`.
- Provider P/E remains `research_only` / `needsReview` / `productionApproved=false`.
- CFO remains manual consolidated source.

## Validation

No additional DB write was required for this evidence file. The retry run already verified:

- migration status up to date
- dry-run summary
- first confirm-write
- idempotency rerun
- read-path smoke

## Next Recommended Phase

Phase 151O - Screening API/UI caveat surfacing and user-facing filter MVP.
