# Phase 142A: PostgreSQL Production Data Strategy Audit

## 1. Phase Summary
This phase audited the Atelier Finance repository to establish a safe strategy for migrating the database from a local SQLite development artifact (`dev.db`) to a PostgreSQL production instance. The audit focused on current Prisma configurations, source priority constraints for reviewed-preview data, and safely persisting these configurations to the production database.

## 2. Current Database State
- **Prisma Provider:** `sqlite` (defined in `prisma/schema.prisma`).
- **DATABASE_URL Pattern:** `process.env.DATABASE_URL ?? "file:./dev.db"` (defined in `prisma.config.ts`).
- **Local Dev DB:** Local SQLite (`dev.db`).
- **Production Target:** PostgreSQL.

## 3. PostgreSQL Alignment with Thesis/Product
- **PostgreSQL is the official production target** for Atelier Finance.
- **SQLite (`dev.db`) is strictly a local development artifact** and must not be presented or deployed as a production database.

## 4. Migration & Readiness Assessment
- **Readiness:** The repository is well-architected with Prisma handling data abstractions. However, changing the provider requires regenerating Prisma schemas and wiping current SQLite-specific migrations (`prisma/migrations`).
- **SQLite Dependencies:** Current SQLite migrations contain native SQLite syntax that cannot be applied to PostgreSQL. 
- **Code Dependencies:** `prisma.config.ts` relies on `file:./dev.db` as the default URL. This is acceptable for local fallbacks but requires a strict PostgreSQL URL in production.

## 5. Production Data Strategy Options
### Option A: Fresh PostgreSQL + Prisma migrate + deterministic seed (Recommended)
This approach sets up a completely clean PostgreSQL instance, recreates migrations for Postgres, and uses deterministic scripts to import *only* the reviewed-preview target fields. It perfectly enforces data provenance and boundaries.

### Option B: Export `dev.db` then transform to PostgreSQL
This approach attempts to extract the local SQLite database and import it into PostgreSQL using third-party tools. It poses a very high risk of importing unintended sample data, polluted test rows, or fields without provenance.

**Recommendation:** **Option A**. The system must prioritize a *fresh PostgreSQL setup* combined with deterministic `reviewed-preview` import scripts. Do NOT lift and shift the local `dev.db` to production.

## 6. Reviewed-Preview Import Plan (5 Tickers)
For `FPT`, `HPG`, `VNM`, `MSN`, `MWG`:
- **Source Label:** `annual_report_2025_pdf_reviewed_preview`
- **Fields to Import:**
  - `eps`
  - `sharesOutstanding`
  - `totalDebt`
- **Fields to EXCLUDE (No provenance):** `revenue`, `netIncome`, `totalAssets`, `equity`, `cashAndEquivalents`, `capitalExpenditure`, `operatingCashFlow`
- **Guardrails:** Keep `productionApproved: false`.

## 7. VCB Handling (Banking Caveat)
- **Constraint:** VCB must be routed via the bank-specific / candidate path (`vnstock_financials_candidate`).
- **Rule:** Do NOT import VCB using the standard corporate path.
- **Rule:** `totalDebt` must remain `null` or `needs_bank_mapping`. Total liabilities or deposits must not be mistakenly mapped as `totalDebt`.

## 8. Required Production Env Checklist
- `DATABASE_URL`: Must point to the hosted PostgreSQL instance.
- `OPENAI_API_KEY`: Required if the AI RAG features are enabled.
- `Assistant Provider Env`: Ensure correct proxy config (e.g., `openai`).
- Local import guard must be explicitly disabled or protected to prevent arbitrary uploads on production.
- VNStock SSL bypass (`NODE_TLS_REJECT_UNAUTHORIZED="0"`) must be **disabled** on production.
- Do NOT commit `.env` or `.env.local`.

## 9. Proposed Next Phases
- **142B:** PostgreSQL compatibility audit & local setup (no data import).
- **142C:** Create a production-safe deterministic seed/import script for reviewed-preview data.
- **142D:** PostgreSQL local/staging dry-run using a temporary/local Postgres database.
- **142E:** Controlled reviewed-preview import into PostgreSQL staging/production (requires explicit confirmation).

## 10. Risks and Guardrails
- **`productionApproved: false`** must be strictly maintained for all imported data.
- **`dataMode: research_only`** must be used.
- **No Missing-to-Zero:** Missing fields must be handled explicitly as missing, not converted to 0.
- **No `totalLiabilities-as-totalDebt`:** Prevent naive mapping of total liabilities to debt.
- **No sample/fallback-as-real:** Do not import static dummy files or fallbacks as official data.
- **No Investment Advice Wording:** The product is strictly for research and learning.
