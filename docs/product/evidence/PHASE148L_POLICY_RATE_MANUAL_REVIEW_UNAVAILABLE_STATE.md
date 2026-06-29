# Evidence: Phase 148L - Policy Rate Manual Review & Unavailable State

## Verification Details
- **Phase**: 148L
- **Date**: 2026-06-29
- **Objective**: Harden the unavailable state for `POLICY_RATE` by making UI missing data text explicit, providing safe fallback constraints for the Assistant, and formalizing the manual-review boundary.

## Execution Summary
1. **Starting Commit**: 99e7133
2. **Files Audited**:
   - `src/features/macro/data/macroCompass.data.ts`
   - `src/app/api/assistant/route.ts`
   - `src/features/macro/lib/macro-indicator-registry.ts`
   - `src/features/macro/lib/macro-domestic-rate-semantic-mapping.ts`
3. **Files Changed**:
   - `src/features/macro/data/macroCompass.data.ts`
   - `src/app/api/assistant/route.ts`
   - `docs/product/MACRO_DOMESTIC_RATE_MAPPING_DECISION.md`
   - `docs/product/MACRO_INDICATOR_UNIVERSE.md`
   - `docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md`
   - `docs/product/MACRO_PARSER_STRATEGY.md`
   - `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
   - `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`
   - `scripts/smoke-policy-rate-unavailable-state.ts` (new script)
4. **Indicator**: `POLICY_RATE`
5. **Frontend Card**: Lãi suất trong nước
6. **Current Mapping**: `POLICY_RATE`
7. **Source Status (from 148K)**: `html_dynamic_or_unstable_requires_manual_workflow`
8. **Manual-Review Workflow Status**: Documented and established.
9. **Runtime Unavailable State**: Hardened.
10. **UI Unavailable Copy**: Changed to "Chưa có dữ liệu lãi suất điều hành đã kiểm duyệt".
11. **Assistant Boundary**: Changed to safely inform about lack of policy rate without giving investment advice.
12. **DB Writes**: No
13. **Provider Fetch**: No
14. **Numeric Extraction**: No
15. **Candidate Rows**: 0
16. **Production Approval**: No

## Guardrail Results
- **indicator**: POLICY_RATE
- **frontendCard**: Lãi suất trong nước
- **currentMapping**: POLICY_RATE
- **dbWriteAttempted**: false
- **providerFetchAttempted**: false
- **numericValuesExtracted**: 0
- **candidateMacroRows**: 0
- **candidateProvenanceRows**: 0
- **observationRowsCreated**: 0
- **provenanceRowsCreated**: 0
- **productionApprovedTrueCount**: 0
- **policyRateDbBacked**: false
- **policyRateNeedsReview**: true
- **policyRateHasNoObservation**: true
- **policyRateParserReadiness**: blocked/manual_review_required
- **manualReviewWorkflowDocumented**: true
- **unavailableStateHardened**: true
- **assistantDoesNotInventDomesticRate**: true
- **investmentAdviceAdded**: false
- **mockOrSampleAsReal**: false

## Validation Results
- **Prisma Validate**: Passed
- **Prisma Generate**: Passed
- **Migrate Status**: Passed
- **TypeScript**: Passed
- **Build**: Passed
- **Lint**: Failed with exit code 1 (Global lint is not a clean pass. Failure is pre-existing/out of scope verified by pre-change status).
- **Smoke Test**: Passed

## Recommended Next Phase
Phase 148M — Market-data macro sources implementation (e.g., MARKET_TRADING_VALUE and FOREIGN_NET_FLOW)
