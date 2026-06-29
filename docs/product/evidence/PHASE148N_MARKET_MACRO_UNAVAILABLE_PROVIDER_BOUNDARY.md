# Evidence: Phase 148N - Market Macro Unavailable Provider Boundary

## Verification Details
- **Phase**: 148N
- **Date**: 2026-06-29
- **Objective**: Harden the unavailable state and finalize provider boundary for `MARKET_TRADING_VALUE` and `FOREIGN_NET_FLOW` indicators. Ensure UI explicitly communicates missing data and Assistant avoids hallucinations or generating trading signals.

## Execution Summary
1. **Starting Commit**: 690ff382
2. **Files Audited**:
   - `src/features/macro/data/macroCompass.data.ts`
   - `src/features/macro/lib/load-macro-runtime-data.ts`
   - `src/features/macro/lib/macro-indicator-registry.ts`
   - `src/features/macro/lib/macro-source-url-candidates.ts`
   - `src/app/api/assistant/route.ts`
3. **Files Changed**:
   - `src/features/macro/data/macroCompass.data.ts`
   - `src/app/api/assistant/route.ts`
   - `docs/product/MACRO_INDICATOR_UNIVERSE.md`
   - `docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md`
   - `docs/product/MACRO_PARSER_STRATEGY.md`
   - `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
   - `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`
   - `scripts/smoke-market-macro-unavailable-provider-boundary.ts` (new script)
4. **Target Indicators**: `MARKET_TRADING_VALUE`, `FOREIGN_NET_FLOW`
5. **Frontend Visibility**: Both visible in the frontend.
6. **Current Mappings**: Maintained.
7. **Source Candidates**: vnstock / undocumented provider API.
8. **Source URL Statuses**: `missing_source_url` (blocked from parser).
9. **Provider Boundary Status**: Finalized as undocumented provider / not production source.
10. **Runtime Unavailable State**: Hardened (returning null/missing configuration).
11. **UI Unavailable Copy**: 
   - `Chưa có dữ liệu thanh khoản đã kiểm duyệt.`
   - `Chưa có dữ liệu giao dịch khối ngoại đã kiểm duyệt.`
12. **Assistant Unavailable Boundary**: Explicit instructions added to state: "Hiện hệ thống chưa có dữ liệu đã kiểm duyệt cho thanh khoản thị trường hoặc giao dịch khối ngoại, nên không kết luận tác động đến ngành hoặc cổ phiếu từ các chỉ số này." and banned terms (mua/bán/nắm giữ/tín hiệu/đáng mua/hấp dẫn/giải ngân/đứng ngoài...).
13. **Parser Readiness**: Blocked for both.
14. **Ready for Parser Dry-run**: false for both.
15. **Blocked Reasons**: Missing documented public source URLs.
16. **Manual Data Needed From User**: To unblock these indicators, the user must provide a documented formal API source or equivalent for market trading value and foreign net flow.
17. **Candidate Rows Created/Extracted**: 0
18. **DB Write Attempted**: false
19. **Provider Fetch Attempted**: false
20. **Numeric Values Extracted**: 0
21. **Production Approved True Count**: 0
22. **DB Backed Status**: `false` for both
23. **Needs Review Status**: `true` for both

## Guardrail Results
- **targetIndicators**: MARKET_TRADING_VALUE, FOREIGN_NET_FLOW
- **dbWriteAttempted**: false
- **providerFetchAttempted**: false
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
- **marketTradingValueParserReadiness**: blocked
- **foreignNetFlowParserReadiness**: blocked
- **undocumentedProviderNotProductionSource**: true
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
Phase 148O — External provider exploration or transition to manual input.
