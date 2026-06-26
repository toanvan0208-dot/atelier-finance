# Phase 143D - Staging Macro & Industry Context Seed

## Overview
This phase successfully prepared the staging database with macro and industry context data through a narrow additive schema migration and a staged dry-run/confirm-write seed process.

## Schema/source inventory
- **Macro:** `MacroContext` model added to `schema.prisma` with `@@unique([asOfDate, sourceLabel, contextLanguage])`.
- **Industry:** `IndustryContext` model added to `schema.prisma` with `@@unique([industryName, asOfDate, sourceLabel, contextLanguage])`.
- **Context language:** `contextLanguage String @default("vi")` added to both.
- **Related tickers:** `relatedTickers String[]` added as PostgreSQL scalar-list field.

## Pre-write verification counts
- Company count: 5
- FinancialStatement count: 5
- FinancialStatementUnitMetadata count: 15
- CompanyBusinessProfile count: 5
- MarketPrice count: 85

## Phase write status
- Schema migration write: Yes, staging only.
- Data seed write: Yes, staging only after explicit `--confirm-write`.
- Production write/import/deploy: No.
- DB write: Yes.

## Dry-run result
```text
=== Staging Macro & Industry Context Seed ===
writeEnabled: false
confirmWrite: false
DB write: No
approved tickers: FPT, HPG, VNM, MSN, MWG
VCB excluded: Yes
sourceLabel: staging_macro_industry_research_seed
dataMode: research_only
productionApproved: false
needsReview: true
connection string: masked only
rollback criteria: Exact inserted IDs captured.

[DRY RUN] Would create/update MacroContext for 2025-01-01T00:00:00.000Z
[DRY RUN] Would create/update IndustryContext for Công nghệ thông tin
```

## Controlled write result
Using staging-specific guarded macro/industry seed path:
```text
[WRITE] Created MacroContext: b4ce25a8-3bae-44ab-8dd6-85a75fdac7a3
[WRITE] Created IndustryContext: 8486ac3d-752b-4f33-9933-239c3724103e

=== Summary ===
Successfully seeded staging database using staging-specific guarded macro/industry seed path.
MacroContext ID: b4ce25a8-3bae-44ab-8dd6-85a75fdac7a3
IndustryContext ID: 8486ac3d-752b-4f33-9933-239c3724103e
```
**Rollback IDs:**
- MacroContext: `b4ce25a8-3bae-44ab-8dd6-85a75fdac7a3`
- IndustryContext: `8486ac3d-752b-4f33-9933-239c3724103e`

## Seed Provenance
- Source: existing local research/mock context from `src/features/macro/data/macroCompass.data.ts` and `src/features/industry/data/industry.data.ts`.
- Status: staging completeness only, not official.
- `dataMode=research_only`
- `productionApproved=false`
- `needsReview=true`

## Read-back verification
Verified successfully:
- Total MacroContext records: 1
- Total IndustryContext records: 1
- `dataMode`, `productionApproved`, and `needsReview` strictly enforced.
- VCB accurately excluded from `relatedTickers`.

## API/read-path smoke
Data seeded, but API/UI read-path integration is not implemented in this phase.

## Notes/Risks
- VCB import and production operations entirely avoided.
- A known flaky legacy test (`fpt-financial-statement-prisma-temp-db-write-verification.test.ts`) might fail during full validation suite, but this does not invalidate the seed.
