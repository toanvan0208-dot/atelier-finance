# Phase 152G-prereq — Industry And External Review DataSource Dependency Confirm-Write

## Goal
Create the missing taxonomic dependencies (`Industry` rows) and source origin identities (`DataSource` rows) required so that Phase 152G (HPG/VNM/MWG deep analysis ingestion) can be safely retried. 

## Scope
- Permitted DB writes are restricted strictly to `Industry` and `DataSource`.
- Written data acts only as basic infrastructure taxonomy, not as actionable investment benchmarks.
- Retained strict controls: `productionApprovedTrueCount=0`, no zero-fills, no raw data commits.

## Why this phase is needed after 152G
In Phase 152G, the script correctly rejected and fail-closed the database ingestion for `CompanyIndustry`, `FinancialStatement`, and `CompanyBusinessProfile` because the required foundational rows (`Industry` categories and `DataSource` origins) were missing in the active PostgreSQL database. Creating these minimal prerequisite rows now allows the parent Phase 152G script to pass its relational integrity checks upon rerun.

## Dependency Blockers Found in 152G
1. Missing `Industry` rows for:
   - `STEEL_MATERIALS`
   - `CONSUMER_STAPLES_DAIRY`
   - `RETAIL`
2. Missing `DataSource` row for:
   - External financials review workspace (and potentially the business review workspace).

## Industry Model/Schema Storage Note
- The `Industry` rows generated strictly map to standard categorical tags (`industryCode`, `industryName`, `classificationSystem`). 
- **Critical Control:** These rows do **not** dictate ranking, benchmark thresholds, dynamic scoring, or stock attractiveness. 
- Mode is safely set to `research_only` with `productionApproved=false` and `needsReview=true`.

## DataSource Model/Schema Storage Note
- The `DataSource` rows function as metadata origin markers (`curated_internal`) for tracing provenance of manually reviewed JSON datasets.
- Notes specify that the true data originates from an external review workspace and that files are not checked into the current repository. 
- The schema correctly maps these IDs to future financial statement updates.

## Execution Results

### 1. Dry-Run Result
- Prepared 3 `Industry` candidates and 2 `DataSource` candidates.
- Idempotency checks ran successfully.
- No DB writes were attempted (`dbWriteAttempted: false`).

### 2. Confirm-Write Result
- 3 `Industry` rows written (`STEEL_MATERIALS`, `CONSUMER_STAPLES_DAIRY`, `RETAIL`).
- 2 `DataSource` rows written (`External financials review workspace`, `External business review workspace`).
- Successfully executed via `--confirm-write`.

### 3. Idempotency Rerun Result
- Rerunning `--confirm-write` accurately detected existing entities.
- Skipped 3 `Industry` rows.
- Skipped 2 `DataSource` rows.
- No duplicate records generated.

### 4. Smoke Result
- Extracted and verified target `Industry` and `DataSource` entities directly from the Prisma read-path.
- Affirmed zero unintended leakage.
- Smoke verified `smokePassed: true`.

## Confirmations
- **Industry Rows Created/Reused:** 3 (STEEL_MATERIALS, CONSUMER_STAPLES_DAIRY, RETAIL).
- **DataSource Rows Created/Reused:** 2.
- **Taxonomy Only:** Verified. No benchmarks/rankings/scoring/stock attractiveness metrics were derived from or attached to these records.
- **CompanyIndustry Write:** None.
- **FinancialStatement Write:** None.
- **BusinessProfile Write:** None.
- **Company Write:** None.
- **MarketPrice Write:** None.
- **ScreeningCandidate Write:** None.
- **ScreeningCandidateMetric Write:** None.
- **Schema Change:** None.
- **Provider Fetch:** None.
- **UI Change:** None.
- **Assistant Change:** None.
- **Raw External Files Copied into Repo:** None.
- **Raw Manual Input Committed:** None.
- **HSG / NKG Untouched:** Verified.
- **TVN Absent:** Verified.
- **Forbidden Advice Wording:** None.
- **productionApprovedTrueCount:** 0.

## Next Recommended Phase
**Phase 152G-retry — HPG/VNM/MWG CompanyIndustry, FinancialStatement, and BusinessProfile Confirm-Write After Dependencies**
