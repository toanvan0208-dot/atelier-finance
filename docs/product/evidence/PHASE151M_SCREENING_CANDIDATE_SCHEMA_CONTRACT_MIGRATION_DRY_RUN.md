# Phase 151M - Screening Candidate Schema Contract + Migration Dry Run

## Goal

Add a dedicated, minimal, semantically safe schema contract for Screening candidates so HSG/NKG partial `screening_candidate` metrics and provenance can be persisted in a later confirm-write phase.

This phase does not write HSG/NKG Screening candidate data.

## Scope

- Add standalone Screening candidate schema models.
- Add a migration file for the new schema.
- Keep HSG/NKG as `screening_candidate` only.
- Keep `analysisEligible=false`.
- Keep `screeningEligible=true`.
- Keep all candidate data `research_only`, `needsReview=true`, and `productionApproved=false`.
- Do not add TVN.
- Do not add UI, Assistant, ranking, scoring, benchmark, IndustryMetric, or full-analysis behavior.

## Files Changed

- `prisma/schema.prisma`
- `prisma/migrations/20260702151000_add_screening_candidate_models/migration.sql`
- `scripts/confirm-write-screening-steel-direct-peer-candidates.ts`
- `scripts/smoke-screening-steel-direct-peer-candidates-confirm-write-read-path.ts`
- `scripts/smoke-screening-candidate-schema-contract.ts`
- `docs/product/evidence/PHASE151M_SCREENING_CANDIDATE_SCHEMA_CONTRACT_MIGRATION_DRY_RUN.md`

## Models Added

### ScreeningCandidate

Minimal candidate-level contract:

- `ticker`
- `companyName`
- `industryCode`
- `peerRole`
- `coverageLevel`
- `screeningEligible`
- `analysisEligible`
- `dataMode`
- `needsReview`
- `productionApproved`
- `warningCodes`
- `caveats`

Guard defaults:

- `screeningEligible=true`
- `analysisEligible=false`
- `dataMode=research_only`
- `needsReview=true`
- `productionApproved=false`

### ScreeningCandidateMetric

Metric-level contract for partial Screening candidate rows:

- `metricCode`
- `value`
- `unit`
- `period`
- `periodType`
- `providerPeriod`
- `snapshotDate`
- `fiscalYearEnd`
- `statementScope`
- source metadata
- review and warning fields

Expected metric codes remain limited to package-controlled Screening metrics such as:

- `PE`
- `PB`
- `CFO`
- `LIQUIDITY`
- optional later `CLOSE_PRICE`

### ScreeningCandidateProvenance

Provenance-level contract for candidate and metric source metadata:

- `sourceType`
- `sourceLabel`
- `sourceUrl`
- `retrievedAt`
- `publicationDate`
- `extractedQuote`
- `reviewNote`
- `payloadChecksum`
- warning/review guard fields

## Migration

Migration file:

- `20260702151000_add_screening_candidate_models`

The migration creates only:

- `ScreeningCandidate`
- `ScreeningCandidateMetric`
- `ScreeningCandidateProvenance`
- supporting unique constraints, indexes, and foreign keys

The migration contains no seed data and no `INSERT`.

Local `npx prisma migrate dev --name add_screening_candidate_models` did not apply successfully in this environment. Prisma recognized the local Postgres datasource, then exited with:

```text
Error: Schema engine error:
```

Because the engine error did not provide a usable migration artifact, the migration SQL was created manually from the Prisma schema contract. The DB schema was not claimed as applied in this evidence.

## Why This Avoids Semantic Mixing

Phase 151L correctly failed closed because existing schema had no dedicated storage for partial Screening candidate data. Phase 151M resolves that schema-level gap without forcing HSG/NKG metrics into Company, Financials, MarketPrice, IndustryContext, IndustryMetric, Valuation, or Risk tables.

This keeps Screening candidate data separate from:

- audited financial statement models
- market price history
- Industry qualitative context
- IndustryMetric
- valuation/risk benchmarks
- ranking/scoring systems
- full company analysis eligibility

## Dry-Run Result

Command:

```bash
npx tsx scripts/confirm-write-screening-steel-direct-peer-candidates.ts
```

Summary:

```json
{
  "phase": "151M",
  "mode": "dry_run",
  "candidateTickers": "HSG,NKG",
  "rowsPrepared": 2,
  "rowsWritten": 0,
  "rowsCreated": 0,
  "rowsUpdated": 0,
  "provenanceRowsPrepared": 8,
  "provenanceRowsWritten": 0,
  "schemaGapDetected": false,
  "readyForConfirmWrite": true,
  "dataConfirmWriteBlockedUntilPhase151N": true,
  "productionApprovedTrueCount": 0,
  "smokePassed": true
}
```

No HSG/NKG candidate data was written in Phase 151M.

## Schema Smoke Result

Command:

```bash
npx tsx scripts/smoke-screening-candidate-schema-contract.ts
```

Summary:

```json
{
  "phase": "151M",
  "modelsPresent": true,
  "candidateFieldsPresent": true,
  "metricFieldsPresent": true,
  "provenanceFieldsPresent": true,
  "bannedFieldsPresent": false,
  "industryMetricCreated": false,
  "tvnPresentInCandidatePackages": false,
  "productionApprovedDefaultsFalse": true,
  "needsReviewDefaultsTrue": true,
  "analysisEligibleDefaultFalse": true,
  "screeningEligibleDefaultTrue": true,
  "warningCodesStoredAsText": true,
  "caveatsStoredAsText": true,
  "smokePassed": true
}
```

## 151L Blocker Status

151L blocker:

- Missing `ScreeningCandidate`
- Missing `ScreeningCandidateMetric`
- Missing `ScreeningCandidateProvenance`

151M status:

- Resolved at schema contract level.
- Dedicated migration file added.
- Confirm-write remains intentionally blocked until Phase 151N.
- HSG/NKG candidate data is still not written in this phase.

## TVN Exclusion

TVN remains excluded:

- no candidate package
- no write candidate
- no read-path row
- no fetch allowlist change
- no screening eligibility

## Guardrail Confirmation

- DB data write: no
- HSG/NKG candidate data written: no
- UI change: no
- Assistant change: no
- HSG/NKG full analysis enabled: no
- TVN screening eligible: no
- IndustryMetric created: no
- valuation benchmark created: no
- risk benchmark created: no
- peer valuation/risk comparison created: no
- ranking/scoring created: no
- stock attractiveness score created: no
- forbidden advice wording introduced: no
- `productionApproved=true`: no
- missing values remain nullable / not zero-filled: yes

## Validation Commands

Passed:

```bash
npx prisma validate
npx prisma generate
npx eslint scripts/confirm-write-screening-steel-direct-peer-candidates.ts scripts/smoke-screening-steel-direct-peer-candidates-confirm-write-read-path.ts scripts/smoke-screening-candidate-schema-contract.ts
npx tsx scripts/confirm-write-screening-steel-direct-peer-candidates.ts
npx tsx scripts/smoke-screening-candidate-schema-contract.ts
npx tsx scripts/smoke-screening-steel-direct-peer-candidates-confirm-write-read-path.ts
npm run typecheck
```

Attempted but not locally applied:

```bash
npx prisma migrate dev --name add_screening_candidate_models
```

Result:

- Prisma schema engine error in local environment.
- Migration SQL file exists.
- DB schema application must be rerun/verified before Phase 151N confirm-write.

## Next Recommended Phase

Phase 151N - HSG/NKG partial Screening candidate confirm-write using dedicated schema + read-path smoke.

Before 151N writes data, rerun/apply the migration successfully in the target local DB environment.
