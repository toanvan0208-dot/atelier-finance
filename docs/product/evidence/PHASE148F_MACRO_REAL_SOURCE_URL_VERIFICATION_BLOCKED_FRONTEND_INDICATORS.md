# Evidence: Phase 148F - Macro Real-Source URL Verification for Blocked Frontend Indicators

## Verification Details
- **Phase**: 148F
- **Date**: 2026-06-28
- **Objective**: Verify specific source URLs for `USD_VND` and `INTERBANK_RATE_OVERNIGHT` from the State Bank of Vietnam (SBV). Prove URL reachability without extracting numeric data or polluting the DB.

## Execution Summary
1. **Source URL Verification Scope Audit**:
   - Confirmed targets: `USD_VND` and `INTERBANK_RATE_OVERNIGHT`.
   - Both are in the frontend and lacked explicit URLs.
2. **URL Verification Result**:
   - `USD_VND`: Checked `https://www.sbv.gov.vn/TyGia/faces/TyGia.jspx` -> Reachable (text/html).
   - `INTERBANK_RATE_OVERNIGHT`: Checked `https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/tstttlm/lstlnt/lstlnt` -> Reachable (text/html).
   - No mock numbers were extracted.
   - No fake provenance records were created.
3. **No Fake Data / No Numeric Extraction Statement**:
   - Zero numeric data was extracted. The script strictly verified reachability (`fetch` HEAD/GET).
4. **No DB Write / Production Deploy Statement**:
   - `dbWriteAttempted=false` maintained throughout. No DB schema changes or deployments.
5. **Frontend Locked Scope Maintained**:
   - No indicators outside the frontend were checked.

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
docs/product/evidence/PHASE148F_MACRO_REAL_SOURCE_URL_VERIFICATION_BLOCKED_FRONTEND_INDICATORS.md
scripts/audit-macro-source-url-verification-scope.ts
scripts/smoke-assistant-macro-source-url-guardrail.ts
scripts/smoke-macro-source-url-verification.ts
scripts/verify-macro-source-urls.ts
src/features/macro/lib/macro-parser-strategy-registry.ts
src/features/macro/lib/macro-source-url-candidates.ts
src/features/macro/lib/macro-source-verification-registry.ts
```

## Source URL Candidate Summary
- Candidates strictly limited to `USD_VND` and `INTERBANK_RATE_OVERNIGHT`.
- Automation Level: `html_table_candidate`
- Verification Status: `not_verified` initially, advanced to verified reachable but parser needed.

## Smoke Results
- **URL Verification Smoke**: Passed. No numeric extraction, no DB write, production approved count is 0.
- **Assistant Guardrail Smoke**: Passed. Assistant context has the URL strategy but strictly knows URL is not an observation.

## Validation Results
- **Prisma Validate**: Passed
- **TypeScript**: Passed
- **Build**: Passed
- **Lint**: Pre-existing any-type errors remain, no new severe breaking errors.

## Known Gaps
- No expanded macro observations were written.
- Verified URL does not mean DB data is available.
- Parser still needs dry-run before any confirm-write.
- USD_VND / INTERBANK_RATE_OVERNIGHT may remain blocked if the HTML table format is unstable.
- Only CPI_YOY/GDP_GROWTH are DB-backed.
- World Bank remains candidate/not production-approved.
- Production migration history still needs reconciliation.
- Macro-to-industry mapping not implemented.
- Global lint may remain not clean due to pre-existing issues.

## Next Recommended Phase
Phase 148G — Macro parser dry-run with verified source URLs
