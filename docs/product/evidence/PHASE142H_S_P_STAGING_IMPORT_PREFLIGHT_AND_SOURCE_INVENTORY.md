# Phase 142H-S-P: Staging Import Preflight and Source Inventory

## Objective
To inventory all current import scripts and establish strict guardrails and validation checklists before allowing actual data to be written to the Supabase Staging PostgreSQL instance. No data imports occurred in this phase.

## Initial Status
- **Current Main Commit:** `e0926ef83070d8df812f27e474bee946ef574657`
- **Staging Schema Checked:** `true`
- **Pre-import Row Counts:** Confirmed all domain tables (`Company`, `FinancialStatement`, etc.) are at `0` on staging.

## Import Scripts Review
**Audited Scripts:**
- `scripts/import-fpt-pdf-reviewed-preview.ts` (and sibling scripts for HPG, MSN, MWG, VNM)
- `scripts/import-reviewed-source-records.ts`
- `src/lib/data-sources/financial-statement-local-write-service.ts`

**Finding:**
All current scripts that perform writes utilize `runFinancialStatementLocalWriteTrial` and are subject to `assessFinancialStatementLocalWriteDatabaseUrl`. This guard explicitly rejects non-local `postgresql://` endpoints. Therefore, **none of the existing scripts are capable of running against Supabase Staging** without being modified or bypassed intentionally.

## Approved Scope
If a staging import is to occur in Phase 142H-S, it must strictly be:
- **Tickers:** `FPT`, `HPG`, `VNM`, `MSN`, `MWG` only.
- **Excluded:** `VCB` is strictly rejected for corporate metrics.
- **Allowed Fields:** `eps`, `sharesOutstanding`, `totalDebt`
- **Rejected Fields:** `revenue`, `netIncome`, `totalAssets`, `equity`, `cashAndEquivalents`, `capitalExpenditure`, `operatingCashFlow` (to be recorded as null/undefined).
- **Mandatory Labels:** `sourceLabel: annual_report_2025_pdf_reviewed_preview`, `dataMode: research_only`, `productionApproved: false`.

## Target Tables & Rollback Criteria
The import will interact with: `Company`, `DataSource`, `FinancialStatement`, `FinancialStatementUnitMetadata`.
If a rollback is needed, delete records matching:
- `sourceLabel = 'annual_report_2025_pdf_reviewed_preview'`
- `ticker IN ('FPT', 'HPG', 'VNM', 'MSN', 'MWG')`
- `productionApproved = false`

## Pre-requisites Before Phase 142H-S Actual
1. A new or modified script specifically enabling staging imports must be created.
2. The script must execute a dry-run reflecting only 5 corporate tickers and 3 fields.
3. The actual import must not be allowed to run against `production`.

## Recommendations
- **readyFor142H_SActual:** `false` (A staging-specific script must be created first during the actual phase).
- **Production Readiness:** `false`.
