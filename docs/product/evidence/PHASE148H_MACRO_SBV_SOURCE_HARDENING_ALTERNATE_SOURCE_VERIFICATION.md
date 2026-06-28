# Evidence: Phase 148H - Macro SBV Source Hardening and Alternate Source Verification

## Verification Details
- **Phase**: 148H
- **Date**: 2026-06-28
- **Objective**: Inspect SBV source structure for `USD_VND` and `INTERBANK_RATE_OVERNIGHT` following Phase 148G's parser block. If unstable, identify alternate stable sources to ensure the system fails safe rather than generating mock data.

## Execution Summary
1. **Frontend-locked scope**: Target indicators restricted strictly to those already in the frontend UI (`USD_VND`, `INTERBANK_RATE_OVERNIGHT`).
2. **SBV Source Inspection**:
   - Both SBV URLs were fetched and inspected for HTML structure.
   - Identified extensive usage of Oracle WebCenter/ADF/JSF which makes pure HTML parsing unreliable without JavaScript rendering.
   - Conclusion: SBV HTML is unstable for naive parsing.
3. **Alternate Source Verification**:
   - `USD_VND`: Identified and verified `Vietcombank Exchange Rate API` (XML endpoint) as reachable and stable. This is a `machine_readable_api`.
   - `INTERBANK_RATE_OVERNIGHT`: No stable, free alternate source identified. Remains `blocked` for manual review.
4. **No Fake Data / No Numeric Extraction Statement**:
   - No numeric values were extracted in this phase (`numericValuesExtracted=0`). The phase strictly focused on URL reachability and structure inspection.
5. **No DB Write / Production Deploy Statement**:
   - No data was written to the database (`dbWriteAttempted=false`). No production deployments were made.

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
docs/product/evidence/PHASE148H_MACRO_SBV_SOURCE_HARDENING_ALTERNATE_SOURCE_VERIFICATION.md
scripts/audit-macro-sbv-source-hardening-scope.ts
scripts/inspect-macro-sbv-source-structure.ts
scripts/smoke-assistant-macro-source-hardening-guardrail.ts
scripts/smoke-macro-sbv-source-hardening.ts
scripts/verify-macro-alternate-source-candidates.ts
src/features/macro/lib/macro-alternate-source-candidates.ts
src/features/macro/lib/macro-parser-strategy-registry.ts
src/features/macro/lib/macro-sbv-source-inspection.ts
src/features/macro/lib/macro-source-url-candidates.ts
src/features/macro/lib/macro-source-verification-registry.ts
```

## SBV Source Inspection Result
- `USD_VND`: HTML highly unstable. Blocked.
- `INTERBANK_RATE_OVERNIGHT`: HTML highly unstable. Blocked.

## Endpoint Candidate Result
- None found within the SBV HTML.

## Alternate Source Candidate Result
- `USD_VND`: Alternate source (VCB XML API) found and reachable.
- `INTERBANK_RATE_OVERNIGHT`: None found. Blocked.

## Smoke Results
- **Hardening Smoke**: Passed. No DB writes, no numeric extractions. Alternate source URLs verified.
- **Assistant Guardrail Smoke**: Passed. Assistant context strictly handles blocked data and alternate source discovery without invention.

## Validation Results
- **Prisma Validate**: Passed
- **TypeScript**: Passed
- **Build**: Passed
- **Lint**: Failed with exit code 1 (Global lint is not a clean pass. Failure is pre-existing/out of scope verified by pre-change status).

## Known Gaps
- No expanded macro observations were written.
- Source inspection does not mean DB data is available.
- INTERBANK_RATE_OVERNIGHT remains blocked.
- Only CPI_YOY/GDP_GROWTH are DB-backed.
- World Bank remains candidate/not production-approved.
- Alternate source remains candidate/not production-approved.
- Production migration history still needs reconciliation.
- Macro-to-industry mapping not implemented.
- Global lint may remain not clean due to pre-existing issues.

## Next Recommended Phase
Phase 148I — Macro alternate-source parser dry-run for frontend indicators
