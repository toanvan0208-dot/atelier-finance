# Evidence: Phase 148E - Real-Source Macro Parser Dry-Run for Frontend Indicators

## Verification Details
- **Phase**: 148E
- **Date**: 2026-06-28
- **Objective**: Execute a real-source parser dry-run for `USD_VND` and `INTERBANK_RATE_OVERNIGHT`. Verify failure modes and extraction paths without polluting the DB or hallucinating data.

## Execution Summary
1. **Parser Dry-Run Scope Audit**:
   - Confirmed targets: `USD_VND` and `INTERBANK_RATE_OVERNIGHT`.
   - Both are in the frontend and have source strategies (`html_parser_feasible`).
2. **Parser Dry-Run Result**:
   - Attempted parsing without hardcoded URLs.
   - Result: Both correctly failed-closed (`previewBlocked=true`) due to `MISSING_SOURCE_URL` in the strategy registry.
   - No mock numbers were extracted.
   - No fake provenance records were created.
3. **No Fake Data / No Hardcoded Value Statement**:
   - Zero numeric data was hardcoded. The dry-run safely blocked the execution because a robust `sourceUrl` wasn't formalized yet.
4. **No DB Write / Production Deploy Statement**:
   - `dbWriteAttempted=false` maintained throughout. No DB schema changes or deployments.

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
docs/product/evidence/PHASE148E_REAL_SOURCE_MACRO_PARSER_DRY_RUN_FRONTEND_INDICATORS.md
scripts/audit-macro-real-source-parser-dry-run-scope.ts
scripts/dry-run-macro-real-source-parser.ts
scripts/smoke-assistant-macro-parser-dry-run-guardrail.ts
scripts/smoke-macro-real-source-parser-dry-run.ts
src/features/macro/lib/macro-real-source-parser-dry-run.ts
```

## Parser Dry-Run Scope Audit
- **targetIndicators**: USD_VND, INTERBANK_RATE_OVERNIGHT
- **targetIndicatorsInFrontend**: USD_VND, INTERBANK_RATE_OVERNIGHT
- **targetIndicatorsCandidateForParser**: USD_VND, INTERBANK_RATE_OVERNIGHT
- **targetIndicatorsHaveSourceStrategy**: USD_VND, INTERBANK_RATE_OVERNIGHT
- **notInFrontendTargetIndicators**: []
- **frontendScopeLocked**: true

## Dry-Run Result
- `dryRun: true`
- `dbWriteAttempted: false`
- `providerFetchAttempted: false`
- `providerFetchSucceeded: false`
- `parserAttempted: false`
- `parserSucceeded: false`
- `candidateMacroRows: 0`
- `candidateProvenanceRows: 0`
- `candidateRowsValidForSchema: 0`
- `previewBlockedIndicators: USD_VND, INTERBANK_RATE_OVERNIGHT`
- `previewBlockedReasons: MISSING_SOURCE_URL`
- `numericValuesHardcoded: false`
- `readyForExpandedConfirmWrite: false`
- `readyForProductionApproval: false`

## Smoke Results
- **Parser Dry-Run Smoke**: Passed. Safe failure confirmed. No fetch attempted if source missing, no rows extracted.
- **Assistant Guardrail Smoke**: Passed. `parserDryRunContextAvailable: true`, `usdVndDoesNotInventObservation: true`.

## Validation Results
- **Prisma Validate**: Passed
- **TypeScript**: Passed
- **Build**: Passed
- **Lint**: Pre-existing any-type errors remain, no new severe breaking errors.

## Known Gaps
- No expanded macro observations were written.
- Parser dry-run candidate preview does not mean DB data is available.
- USD_VND / INTERBANK_RATE_OVERNIGHT are still blocked because source URLs/formats are unstable or missing.
- Only CPI_YOY/GDP_GROWTH are DB-backed unless a future confirm-write phase writes more.
- World Bank remains candidate/not production-approved.
- Production migration history still needs reconciliation.
- Macro-to-industry mapping not implemented.
- Global lint may remain not clean due to pre-existing issues.

## Next Recommended Phase
Phase 148F — Macro real-source parser hardening for blocked frontend indicators
