# Evidence: Phase 148J - Domestic Rate Product Decision and Source Strategy Finalization

## Verification Details
- **Phase**: 148J
- **Date**: 2026-06-28
- **Objective**: Finalize the product decision for the frontend card "Lãi suất trong nước". Switch the backend representative indicator from `INTERBANK_RATE_OVERNIGHT` to `POLICY_RATE`, while keeping it safely non-DB-backed.

## Execution Summary
1. **Starting Commit**: 42ea4f6a
2. **Files Audited**:
   - `src/features/macro/lib/macro-domestic-rate-semantic-mapping.ts`
   - `src/features/macro/data/macroCompass.data.ts`
   - `src/features/macro/lib/macro-indicator-registry.ts`
3. **Files Changed**:
   - `src/features/macro/lib/macro-domestic-rate-semantic-mapping.ts`
   - `src/features/macro/data/macroCompass.data.ts`
   - `src/features/macro/lib/macro-indicator-registry.ts`
   - `scripts/audit-macro-domestic-rate-semantic-mapping.ts`
   - `scripts/smoke-macro-domestic-rate-semantic-mapping.ts`
   - `docs/product/MACRO_DOMESTIC_RATE_MAPPING_DECISION.md`
   - `docs/product/MACRO_INDICATOR_UNIVERSE.md`
   - `docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md`
   - `docs/product/MACRO_PARSER_STRATEGY.md`
   - `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
   - `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`
4. **Previous Mapping**: `INTERBANK_RATE_OVERNIGHT`
5. **Final Product Decision**: Map "Lãi suất trong nước" to `POLICY_RATE`. Retire `INTERBANK_RATE_OVERNIGHT` from the current frontend scope.
6. **Final Backend Indicator**: `POLICY_RATE`
7. **Runtime Mapping Changed**: Yes (`DOMESTIC_RATE_FRONTEND_INDICATOR_CODE` updated to `POLICY_RATE`).
8. **UI Copy Changed**: Yes (Description updated to explicitly mention "lãi suất điều hành").
9. **Assistant Boundary Changed**: Yes (Assistant instructed to treat "Lãi suất trong nước" as policy rate, which is currently unavailable).
10. **Source Strategy**: Awaiting SBV source assessment.
11. **DB Backed Status**: `POLICY_RATE` is `dbBacked=false`.
12. **Provider Expansion Eligible Status**: `POLICY_RATE` is `providerExpansionEligible=true`. `INTERBANK_RATE_OVERNIGHT` is `providerExpansionEligible=false`.
13. **Needs Review Status**: `needsReview=true`.

## Guardrail Results
- **dbWriteAttempted**: false
- **providerFetchAttempted**: false
- **numericValuesExtracted**: 0
- **observationRowsCreated**: 0
- **provenanceRowsCreated**: 0
- **productionApprovedTrueCount**: 0
- **frontendIndicatorUniverseExpanded**: false (Used an existing candidate indicator)
- **investmentAdviceAdded**: false
- **mockOrSampleAsReal**: false

## Semantic Mapping Details
- `INTERBANK_RATE_OVERNIGHT` retired from domestic-rate frontend mapping, but not deleted as historical/candidate indicator.
- `POLICY_RATE` selected as product-level representative indicator for "Lãi suất trong nước".
- `POLICY_RATE` remains not DB-backed until reviewed observation exists.

## Validation Results
- **Prisma Validate**: Passed
- **TypeScript**: Passed
- **Build**: Passed
- **Lint**: Failed with exit code 1 (Global lint is not a clean pass. Failure is pre-existing/out of scope verified by pre-change status).

## Recommended Next Phase
Phase 148K — Policy-rate source verification for domestic-rate frontend card
