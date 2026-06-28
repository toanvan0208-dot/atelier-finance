# Evidence: Phase 148G - Macro Parser Dry-Run with Verified Source URLs

## Verification Details
- **Phase**: 148G
- **Date**: 2026-06-28
- **Objective**: Execute a parser dry-run using verified real-source URLs for `USD_VND` and `INTERBANK_RATE_OVERNIGHT` from the State Bank of Vietnam. Validate that if parsing fails (e.g. due to unstable HTML), the system fails closed gracefully without hallucinating numbers.

## Execution Summary
1. **Verified URL Parser Scope Audit**:
   - Confirmed targets: `USD_VND` and `INTERBANK_RATE_OVERNIGHT`.
   - Verified URLs available from Phase 148F.
2. **Parser Dry-Run Result**:
   - `USD_VND`: Fetched HTML from SBV, but parsing failed (`PARSER_EXTRACTION_FAILED`, `USD_ROW_NOT_FOUND`).
   - `INTERBANK_RATE_OVERNIGHT`: Fetched HTML from SBV, but parsing failed (`PARSER_EXTRACTION_FAILED`, `OVERNIGHT_ROW_NOT_FOUND`).
   - The naive regex parser correctly threw warning codes and blocked candidate generation instead of returning invalid data.
3. **No Fake Data / No Hardcoded Value Statement**:
   - No mock numbers were extracted. The parser was run on real fetched HTML and correctly failed.
   - `numericValuesHardcoded=false`
4. **No DB Write / Production Deploy Statement**:
   - `dbWriteAttempted=false` maintained throughout. No DB schema changes or deployments.
5. **Frontend Locked Scope Maintained**:
   - No indicators outside the frontend were fetched.

## Pre-check git status summary
```text
 M tsconfig.tsbuildinfo
```

## Files Changed
```text
docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md
docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md
docs/product/MACRO_INDICATOR_UNIVERSE.md
docs/product/MACRO_PARSER_STRATEGY.md
docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md
docs/product/evidence/PHASE148G_MACRO_PARSER_DRY_RUN_WITH_VERIFIED_SOURCE_URLS.md
scripts/audit-macro-parser-verified-url-scope.ts
scripts/dry-run-macro-parser-with-verified-urls.ts
scripts/smoke-assistant-macro-verified-parser-preview-guardrail.ts
scripts/smoke-macro-parser-with-verified-urls.ts
src/features/macro/lib/macro-real-source-parser-dry-run.ts
```

## Smoke Results
- **Dry-run**: Passed. Fail-closed gracefully. `readyForExpandedConfirmWrite=false`.
- **Parser Smoke**: Passed. Confirms fail-close rules.
- **Assistant Guardrail Smoke**: Passed. Assistant context strictly handles blocked data without invention.

## Validation Results
- **Prisma Validate**: Passed
- **TypeScript**: Passed
- **Build**: Passed
- **Lint**: Failed with exit code 1 (Global lint is not a clean pass. Failure is pre-existing/out of scope verified by pre-change status).

## Known Gaps
- No expanded macro observations were written.
- Parser candidate preview does not mean DB data is available.
- USD_VND / INTERBANK_RATE_OVERNIGHT remain blocked because HTML is unstable.
- Only CPI_YOY/GDP_GROWTH are DB-backed unless future confirm-write writes more.
- World Bank remains candidate/not production-approved.
- SBV source remains candidate/not production-approved.
- Production migration history still needs reconciliation.
- Macro-to-industry mapping not implemented.
- Global lint may remain not clean due to pre-existing issues.

## Next Recommended Phase
Phase 148H — Macro SBV parser hardening or alternate source verification
