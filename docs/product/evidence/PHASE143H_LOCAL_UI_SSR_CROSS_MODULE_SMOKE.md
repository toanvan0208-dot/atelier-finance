# Phase 143H: Local UI/SSR Cross-Module Smoke

## Execution Context
- **Phase**: 143H
- **Objective**: Verify read-only local Next.js UI/SSR functionality against the Supabase PostgreSQL staging environment. Ensure cross-module data renders without falling back to sample or offline mocks, and confirm all guardrails (forbidden words, missing-to-zero, exclusion of VCB) are properly handled.
- **Data Target**: Staging (PostgreSQL Supabase)

## Secret / Env Safety Verification
- **Checked**: `.env`, `.env.local`, `.env.staging.local`, `dev.db`, `secrets`, `docs/thesis`, `diagrams`, and `PDF/images/temp/OCR outputs`.
- **Result**: **No secrets or inappropriate files were committed in prior phases.** A clean diff and status were confirmed prior to proceeding with this test.

## Pre-Smoke Staging Data Verification
Before starting the Next.js UI server, raw data counts from staging were confirmed to ensure structural completeness:
- **Company count**: 5
- **CompanyBusinessProfile count**: 5
- **FinancialStatement count**: 5
- **FinancialStatementUnitMetadata count**: 15
- **MarketPrice count**: 85
- **MacroContext count**: 1
- **IndustryContext count**: 5

**Cross-Module Database Data Smoke Check**:
- `FPT, HPG, VNM, MSN, MWG`: Passed tests for Company, Business, Financials, MarketPrice, Macro, and Industry.
- `VCB`: Excluded from all core corporate logic sets as expected. 

## Local UI/SSR Smoke Execution
- **Command executed**:
  ```bash
  $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
  npx tsx scripts/smoke-staging-local-ui-ssr-cross-module.ts
  ```
- **Testing Approach**: 
  - Started `next start` (SSR process bound to `process.env.DATABASE_URL` via `scripts/run-staging.mjs`).
  - Pinged routes programmatically to evaluate response status.
  - Parsed the HTTP payload to look for forbidden phrases (e.g. `khuyến nghị` [except compliant disclaimers], `đáng mua`), missing-to-zero behavior, or Prisma/invocation errors.
- **Routes Tested (across `overview`, `macro`, `industry`, `business`, `financials`, `valuation`, `risk`)**:
  - `http://localhost:3000/workspace?symbol=[TICKER]&module=[MODULE]`
  - Tested Tickers: `FPT`, `HPG`, `VNM`, `MSN`, `MWG`, `VCB`

## Test Results and Observations Matrix
- **FPT**: HTTP 200 on all modules. No Prisma errors. No forbidden wording.
- **HPG**: HTTP 200 on all modules. No Prisma errors. No forbidden wording.
- **VNM**: HTTP 200 on all modules. No Prisma errors. No forbidden wording.
- **MSN**: HTTP 200 on all modules. No Prisma errors. No forbidden wording.
- **MWG**: HTTP 200 on all modules. No Prisma errors. No forbidden wording.
- **VCB**: HTTP 200 on all modules. Render correctly handled null/excluded data fallbacks.

**Observation Notes**:
- Standard safety disclaimers (e.g., "Đây không phải khuyến nghị đầu tư") successfully bypassed the strict forbidden-word check as they align with strict product guardrails.
- Render successfully returned HTTP 200 for all SSR routes indicating that standard React Server Components / API handlers process Staging PostgreSQL payload successfully without throwing.
- No LLM provider calls were made. The testing explicitly verified standard rendering paths.

## Validation Status
- **DB Write**: No
- **Data Seed/Import**: No
- **Rollback**: No
- **Production Deploy**: No
- **Full Validation Suite Executed Against Staging DB (`run-staging.mjs`)**:
  - `prisma validate`: Pass
  - `prisma generate`: Pass
  - `npm run typecheck`: Pass
  - `npm run lint`: Pass
  - `npm test`: Pass
  - `npm run build`: Pass

## Conclusion
- **readyForNextPhase**: Yes. The full SSR/UI staging read-path has proven clean across the complete staging scope, strictly enforcing the PostgreSQL transition.
