# Evidence: Phase 148M - Market Macro Source Strategy (Trading Value & Foreign Flow)

## Verification Details
- **Phase**: 148M
- **Date**: 2026-06-29
- **Objective**: Assess the source strategy and parser readiness for `MARKET_TRADING_VALUE` and `FOREIGN_NET_FLOW`, updating mappings, guardrails, and docs without creating fake data or modifying DB.

## Execution Summary
1. **Starting Commit**: 2f8e5425
2. **Files Audited**:
   - `src/features/macro/data/macroCompass.data.ts`
   - `src/features/macro/lib/load-macro-runtime-data.ts`
   - `src/features/macro/lib/macro-indicator-registry.ts`
   - `src/features/macro/lib/macro-source-url-candidates.ts`
   - `src/app/api/assistant/route.ts`
3. **Files Changed**:
   - `src/features/macro/lib/macro-indicator-registry.ts`
   - `src/features/macro/lib/macro-source-url-candidates.ts`
   - `src/app/api/assistant/route.ts`
   - `docs/product/MACRO_INDICATOR_UNIVERSE.md`
   - `docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md`
   - `docs/product/MACRO_PARSER_STRATEGY.md`
   - `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
   - `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`
   - `scripts/smoke-market-macro-source-strategy.ts` (new script)
4. **Target Indicators**: `MARKET_TRADING_VALUE`, `FOREIGN_NET_FLOW`
5. **Frontend Visibility**: Both are visible (`market-liquidity` and `foreign-flow`).
6. **Current Mappings**: Maintained.
7. **Source Candidates**: vnstock / undocumented provider API.
8. **Selected Sources**: vnstock / undocumented provider API.
9. **Source URL Statuses**: `missing_source_url` for both.
10. **Provider Fetch Attempted**: false
11. **Provider Fetch Succeeded**: N/A
12. **HTTP Statuses**: N/A
13. **Content Types**: N/A
14. **Source Shapes**: `missing_source_url`
15. **Parser Readiness**: Blocked (waiting for formal API endpoint).
16. **Ready for Parser Dry-run**: false (for both)
17. **Blocked Reasons**: Missing documented public source URLs.
18. **Candidate Macro Rows**: 0
19. **Candidate Provenance Rows**: 0
20. **DB Write Attempted**: false
21. **Numeric Values Extracted**: 0
22. **Production Approved True Count**: 0
23. **DB Backed Status**: `false` (for both)
24. **Needs Review Status**: `true` (for both)
25. **Assistant Boundary Status**: Hardened. The Assistant is forbidden from hallucinating market data or turning liquidity/flow into investment advice.

## Guardrail Results
- **targetIndicators**: MARKET_TRADING_VALUE, FOREIGN_NET_FLOW
- **dbWriteAttempted**: false
- **numericValuesExtracted**: 0
- **candidateMacroRows**: 0
- **candidateProvenanceRows**: 0
- **observationRowsCreated**: 0
- **provenanceRowsCreated**: 0
- **productionApprovedTrueCount**: 0
- **marketTradingValueDbBacked**: false
- **foreignNetFlowDbBacked**: false
- **marketTradingValueNeedsReview**: true
- **foreignNetFlowNeedsReview**: true
- **frontendIndicatorUniverseExpanded**: false
- **assistantDoesNotInventMarketMacro**: true
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
Phase 148N — Market macro implementation and vnstock integration (or alternate provider evaluation).
