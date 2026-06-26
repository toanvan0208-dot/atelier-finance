# Phase 143B: Business profile read-path integration

## 1. Context and Objective
Phase 143B implements read-path integration for `CompanyBusinessProfile` data. The objective is to expose the seeded business profiles (from Phase 143A) through the application's read layers, particularly the company API route `/api/companies/[ticker]`, without any mutations to the data or schema.

## 2. Read-back Verification
Before modification, verification confirmed:
- CompanyBusinessProfile rows = 5
- Approved tickers only (FPT, HPG, VNM, MSN, MWG)
- VCB excluded correctly.
- `sourceLabel=staging_company_business_profile_research_seed`
- `dataMode=research_only`
- `productionApproved=false`
- `needsReview=true`
- `profileLanguage=vi`

## 3. Read-path/API Integration
- **Audited routes**: `src/app/api/companies/[ticker]/route.ts` and `src/lib/database/services/company-service.ts`.
- **Implementation**: Created the helper `loadCompanyBusinessProfile` in `src/features/business/lib/load-company-business-profile.ts`.
- **Logic**: The helper exclusively queries `CompanyBusinessProfile` using strict criteria matching the seeded staging attributes. It validates `dataMode` and `productionApproved` explicitly. If there is no data, it falls back to `"Chưa đủ dữ liệu"` for text fields, adhering to missing-to-zero/null guardrails.
- **API Extension**: The `/api/companies/[ticker]` route was cleanly extended to return `businessProfile` within the `apiSuccess` payload payload without adding new endpoints.

## 4. Assistant Context
- **Smoke**: The assistant context dynamically consumes data provided by the business modules. Given the read-path integration, the `/api/companies/[ticker]` output makes `businessProfile` explicitly available for the UI context packet builder. A deep direct-LLM integration is bypassed at this step per "chỉ làm API/business read-path trước và ghi limitation".

## 5. Smoke Test Results
Ran `scripts/smoke-staging-company-business-profile-read-path.ts` over the API/helper logic.
- **Result**: SUCCESS.
- **FPT, HPG, VNM, MSN, MWG**: Profile loaded successfully with accurate properties.
- **VCB**: Profile correctly absent (returned null).
- **Guardrails**: No rejected terms (`official`, `khuyến nghị`, `buy`, `sell`, `hold`, etc.) were found in the read-back.

## 6. Scope & Validation
- **DB write**: No
- **Data seed/import**: No
- **Production deploy**: No
- **Validation results**: Prisma validate, generate, TypeScript typecheck, lint, and build succeeded fully cleanly. `npm test` passed 1184/1185 tests, with 1 isolated legacy flaky temp-db test failing (`financial-statement-csv-to-prisma-temp-db-write-trial.test.ts`), which is a known issue from prior phases and unrelated to this read-path logic.

## 7. Notes/Risks
- Read-path is safely guarded. The frontend API can confidently consume this data for research purposes without violating production constraints.
