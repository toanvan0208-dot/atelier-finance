# Phase 143A: Staging company and business profile data seed

## 1. Context and Objective
Phase 143A seeds initial non-official, neutral company business profiles for the 5 approved tickers (FPT, HPG, VNM, MSN, MWG) into the staging PostgreSQL database, skipping VCB and ensuring strict adherence to product guardrails. The purpose is to provide sufficient data for UI/read-path verification on staging before any future production transition.

## 2. Schema and Source Inventory Summary
- **Schema Modification:** A narrow additive `CompanyBusinessProfile` model was added to `prisma/schema.prisma`, linking to the core `Company` model. 
  - *Fields added:* `id`, `ticker`, `companyId`, `businessDescription`, `businessModelSummary`, `mainProducts`, `revenueDrivers`, `businessRiskNotes`, `profileLanguage`, `asOfDate`, `sourceLabel`, `dataMode`, `productionApproved`, `needsReview`, `createdAt`, `updatedAt`.
  - *Uniqueness:* `@@unique([ticker, sourceLabel, profileLanguage])`.
- **Pre-write Counts (from `scripts/staging-read-counts.mjs`):**
  - Company: 5
  - FinancialStatement: 5
  - FinancialStatementUnitMetadata: 15
  - MarketPrice: 0
  - VCB: 0
- **Source:** Neutral, concise manually curated data with `sourceLabel = staging_company_business_profile_research_seed`.

## 3. Seed Execution
- **Dry-run command:** `node scripts/run-staging.mjs npx tsx scripts/dry-run-staging-company-profile-seed.ts`
- **Dry-run result:** Success, simulated 5 profile insertions.
- **Controlled write command:** `node scripts/run-staging.mjs npx tsx scripts/dry-run-staging-company-profile-seed.ts --confirm-write`
- **Controlled write result:** Success.
- **Rows inserted:** 5
- **Rows updated:** 0
- **Rows skipped:** 0
- **Approved Tickers Seeded:** FPT, HPG, VNM, MSN, MWG
- **Excluded:** VCB
- **Fields Seeded:** `businessDescription`, `mainProducts`, `businessRiskNotes`.
- **IDs captured (for rollback):**
  - FPT: 03c7145b-3e70-42ca-91f3-f3ae330438a3
  - HPG: a5cdd144-738d-4336-ac68-e60a8a76e830
  - VNM: 36ab494f-3fee-44d9-a228-e25364035d4c
  - MSN: bd181f53-ce82-4e0a-b072-694a5b2e1be8
  - MWG: 3af686eb-107c-4348-85b7-dc23abe480d6

## 4. Verification and Validation
- **Read-back verification:** Verified 5 rows exist, VCB excluded, `dataMode=research_only`, `productionApproved=false`, `needsReview=true`. Guardrails (no "official", no "khuyến nghị") respected.
- **Validation results:** Prisma validate, generate, typecheck, lint, test, build all completed successfully on staging Postgres.

## 5. Scope & Rollback Status
- **Schema migration write:** Yes, staging schema only.
- **Data seed write:** Yes, staging only after confirm-write.
- **Production deploy:** No.
- **Production import:** No.
- **VCB import:** No.
- **Rollback Criteria:** If needed, delete precisely the `CompanyBusinessProfile` rows matching the captured IDs above. Do not touch `Company` core rows.

## 6. Notes / Risks
- Environment requires `NODE_TLS_REJECT_UNAUTHORIZED=0` when running locally against the Supabase staging database due to certificate issues, but the data safely entered the staging instance and the guardrail pipeline holds.
- Future actual business model summaries can be layered on via the additive `sourceLabel` logic.
