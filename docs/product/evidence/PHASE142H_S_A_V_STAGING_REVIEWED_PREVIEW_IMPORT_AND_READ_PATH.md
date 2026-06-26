# Phase 142H-S-A/V Staging Reviewed-Preview Import And Read Path

## Summary
- Starting commit: `291e55e642415dc61d36e9981ab5fa1afafdf732`
- Branch: `main`
- Target DB: Supabase staging PostgreSQL via `.env.staging.local`
- DB write: Yes, staging only
- Data import: Yes, staging reviewed-preview only
- Production deploy: No
- Production import: No
- Local SQLite/dev.db import: No
- `financial-statement-local-write-guard.ts` modified: No

## Files Changed
- `scripts/dry-run-staging-reviewed-preview-import.ts`
- `scripts/verify-staging-reviewed-preview-import.mjs`
- `scripts/smoke-staging-reviewed-preview-read-path.ts`
- `docs/product/evidence/PHASE142H_S_A_V_STAGING_REVIEWED_PREVIEW_IMPORT_AND_READ_PATH.md`

## Pre-Write Counts
Command:
```bash
node scripts/staging-read-counts.mjs
```

Result:
- Tables: `AssistantInteraction`, `Company`, `DataQualityReport`, `DataSource`, `FinancialStatement`, `FinancialStatementUnitMetadata`, `ManualImportRecord`, `ManualImportSession`, `MarketPrice`, `MarketPriceUnitMetadata`, `PaperTrade`, `SourceEvidence`, `User`, `Watchlist`, `_prisma_migrations`
- `Company`: 0
- `FinancialStatement`: 0
- `FinancialStatementUnitMetadata`: 0
- `MarketPrice`: 0

## Dry-Run
Command:
```bash
npx tsx scripts/dry-run-staging-reviewed-preview-import.ts
```

Result:
- `writeEnabled: false`
- `confirmWrite: false`
- DB write: No
- Approved tickers: `FPT`, `HPG`, `VNM`, `MSN`, `MWG`
- VCB excluded: true
- Approved fields: `eps`, `sharesOutstanding`, `totalDebt`
- Rejected fields: `revenue`, `netIncome`, `totalAssets`, `equity`, `cashAndEquivalents`, `capitalExpenditure`, `operatingCashFlow`
- `sourceLabel`: `annual_report_2025_pdf_reviewed_preview`
- `dataMode`: `research_only`
- `productionApproved`: false
- Connection string: masked only

## Controlled Write
Command:
```bash
npx tsx scripts/dry-run-staging-reviewed-preview-import.ts --confirm-write
```

Result:
- Status: `write_completed`
- Inserted `FinancialStatement` rows: 5
- Skipped existing rows: 0
- Updated rows: 0
- Rejected rows: 0
- Created `DataSource`: `b7938e16-5036-40a7-943c-9db2a37a4218`
- Created schema-required `Company` rows only for approved tickers:
  - `FPT`: `e93a5dd0-a358-4bb0-b671-7fe67481ab4c`
  - `HPG`: `da06e13b-4974-4b9e-88ba-6da5deaccd10`
  - `VNM`: `7fe5ea7f-3452-47f3-b2b4-df8ff8f9ba52`
  - `MWG`: `ed58ea77-e03f-4c14-a088-227f7cfbb8a3`
  - `MSN`: `a1b15037-e6ee-4167-baef-c2e35ae12142`

FinancialStatement IDs inserted:
- `FPT`: `57d0c647-516d-4918-97d4-135032787cbc`
- `HPG`: `19335e19-5062-4cde-ba38-d039923d2378`
- `VNM`: `6e747fc3-cfeb-4e7d-b37a-4b4576087193`
- `MWG`: `d58dc729-eacb-4f94-9de5-67780fc3c5c3`
- `MSN`: `deea34f6-f207-4a69-abf3-086c63d29a58`

FinancialStatementUnitMetadata IDs inserted:
- `FPT`: `2bd0f788-adac-4acf-8926-5125fdcdc4e9`, `57701427-52e1-4a75-96b0-2da20c3e9567`, `cb910f91-d44b-43b1-8df5-3d6210343214`
- `HPG`: `8ec394a1-728b-41fb-93ae-c130d2368012`, `281df12a-8d1f-4aa0-bbe1-8d39fabb3a36`, `fe8b22b0-fb8f-41e1-a9d6-be12257da45a`
- `VNM`: `f06ad030-77af-4fb7-b885-deb5b1bdf16a`, `9c5a0825-8817-418a-9290-0c22c2d545c2`, `27214a52-eacc-4ab9-9e67-64f750ebaf4f`
- `MWG`: `8a69a0c2-9efa-4848-ac50-f8207591a68f`, `fce08aee-bd91-4ea4-9369-adb3293e7973`, `9aeb525f-1705-4ce9-a0d1-bd917e582d77`
- `MSN`: `a94bce98-6f5b-4960-acf9-4aada56eadc0`, `8e41c13d-b0f7-4f6d-9399-0e95ea599e28`, `39528235-2a8a-4f82-bf8a-0b296a8d8e62`

## Read-Back Verification
Commands:
```bash
node scripts/staging-read-counts.mjs
node scripts/verify-staging-reviewed-preview-import.mjs
```

Counts after write:
- `Company`: 5
- `FinancialStatement`: 5
- `FinancialStatementUnitMetadata`: 15
- `MarketPrice`: 0

Verifier result:
- Status: passed
- Expected rows: 5
- Actual rows: 5
- VCB count for reviewed-preview corporate source: 0
- Outside tickers in source scope: none
- Rejected DB fields checked and null: `revenue`, `netIncome`, `totalAssets`, `equity`, `operatingCashFlow`
- Rejected fields absent from schema and not written by this import: `cashAndEquivalents`, `capitalExpenditure`
- Unit metadata fields: only `eps`, `sharesOutstanding`, `totalDebt`
- Unit metadata `productionApproved`: false for all 15 rows
- `_prisma_migrations` count: 1, unchanged during verification

## API And Read-Path Smoke
Command used on Windows:
```bash
node scripts/run-staging.mjs npx tsx scripts/smoke-staging-reviewed-preview-read-path.ts
```

Planned command with bare `tsx` did not resolve on this Windows shell, so `npx tsx` was used without changing staging DB semantics.

Result:
- Status: passed
- Route: `/api/companies/[ticker]/financials?latest=true&dataMode=research_only`
- Approved tickers returned DB-backed data: `FPT`, `HPG`, `VNM`, `MSN`, `MWG`
- `sourceLabel`: `annual_report_2025_pdf_reviewed_preview`
- `dataMode`: `research_only`
- Runtime `productionApproved`: false
- Runtime fallback: false
- Rejected fields null in API path: true
- Missing fields stayed missing; no missing-to-zero observed
- VCB corporate reviewed-preview API import: false

## Valuation, Risk, Assistant Smoke
- Valuation smoke: passed; readiness `not_ready`; no buy/sell/hold or target/fair value/upside/downside advice emitted by smoke output.
- Risk smoke: passed; readiness `partial`; `productionApproved=false`; no `totalLiabilities` substitution observed.
- Assistant smoke: passed without LLM/provider call; prompt includes source label and `productionApproved=false`; prompt guardrails include no buy/sell/hold and no trading signals.

## Validation
Passed:
```bash
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
```

Lint completed with 0 errors and 15 pre-existing warnings in legacy financial statement temp-db files.

Failed:
```bash
node scripts/run-staging.mjs npm test
```

Result:
- Test files: 1 failed, 141 passed, 142 total
- Tests: 1 failed, 1184 passed, 1185 total
- Failing test: `src/features/financials/lib/__tests__/financial-statement-csv-to-prisma-temp-db-write-trial.test.ts`
- Failure: expected `metadataRows.length` to be greater than or equal to 8, actual 0.
- Staging counts after this failure remained unchanged at the approved phase scope: `Company=5`, `FinancialStatement=5`, `FinancialStatementUnitMetadata=15`, `MarketPrice=0`.

Not run because validation stop condition was reached:
```bash
node scripts/run-staging.mjs npm run build
```

No commit or push was performed.

## Rollback Criteria
Rollback is not automatic.

Preferred rollback requires explicit approval and uses exact captured IDs:
```sql
DELETE FROM "FinancialStatement"
WHERE "id" IN (
  '57d0c647-516d-4918-97d4-135032787cbc',
  '19335e19-5062-4cde-ba38-d039923d2378',
  '6e747fc3-cfeb-4e7d-b37a-4b4576087193',
  'd58dc729-eacb-4f94-9de5-67780fc3c5c3',
  'deea34f6-f207-4a69-abf3-086c63d29a58'
);
```

Fallback rollback requires explicit review before execution:
```sql
DELETE FROM "FinancialStatement"
WHERE "sourceLabel" = 'annual_report_2025_pdf_reviewed_preview'
  AND "ticker" IN ('FPT', 'HPG', 'VNM', 'MSN', 'MWG')
  AND "dataMode" = 'research_only';
```

Never use `TRUNCATE`, `DROP`, broad `DELETE`, or any statement touching `_prisma_migrations`.

## Notes And Risks
- This phase created only schema-required `DataSource`/`Company` rows because staging was empty.
- No existing production-like metadata, display names, sectors, industries, or unrelated company records were altered.
- The import script strips `sslmode=require` before direct `pg` connections and uses explicit SSL config to match the Supabase pooler behavior observed in existing read-count scripts.
- Validation is not complete because `npm test` failed. The phase is not ready to commit/push until that validation blocker is resolved or explicitly accepted by a later instruction.

## Validation Follow-Up
Phase: `142H-S-A/V-F`

Root cause:
- The failing test was a legacy local/disposable Postgres temp-db test: `src/features/financials/lib/__tests__/financial-statement-csv-to-prisma-temp-db-write-trial.test.ts`.
- The test helper uses `TEST_DATABASE_URL` or a localhost fallback and rejects non-local test DB URLs, so it was not writing to staging.
- The validation blocker came from non-isolated local test state for phase temp rows. A matching old local `FinancialStatement` could be reused/skipped, leaving the test to read a statement without the expected unit metadata rows.

Fix:
- Updated `createFptPrismaTempDbEnvironment` to clear only known phase-scoped local temp `FinancialStatement` rows before each local temp-db scenario.
- This preserves the metadata assertion and does not weaken metadata, production approval, or field guardrails.
- This does not modify `financial-statement-local-write-guard.ts`.

Staging read-back before fix:
- `Company`: 5
- `FinancialStatement`: 5
- `FinancialStatementUnitMetadata`: 15
- `MarketPrice`: 0
- Verifier: passed
- VCB count: 0

Follow-up DB write:
- Confirm-write rerun: No
- DB write during follow-up: No staging write
- Data import during follow-up: No
- Rollback: Not executed
- Production deploy: No
- Production import: No

Validation rerun:
```bash
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npm test
node scripts/run-staging.mjs npm run build
```

Results:
- `npx prisma validate`: Pass
- `npx prisma generate`: Pass
- `npm run typecheck`: Pass
- `npm run lint`: Pass with 0 errors and 15 existing warnings in legacy temp-db files
- `npm test`: Pass, 142 test files passed, 1185 tests passed
- `npm run build`: Pass with PostgreSQL `DATABASE_URL` supplied by `scripts/run-staging.mjs`

Final staging read-back after validation:
- `Company`: 5
- `FinancialStatement`: 5
- `FinancialStatementUnitMetadata`: 15
- `MarketPrice`: 0
- Verifier: passed
- Approved tickers only: true
- VCB corporate reviewed-preview import: false
- Unit metadata `productionApproved=false`: true
