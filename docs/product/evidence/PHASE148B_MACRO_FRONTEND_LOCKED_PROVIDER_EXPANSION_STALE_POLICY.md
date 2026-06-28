# Evidence: Phase 148B - Macro Frontend-Locked Provider Expansion & Stale Policy

## Verification Details
- **Phase**: 148B
- **Date**: 2026-06-28
- **Objective**: Audit current Macro frontend indicator scope, lock the macro indicator universe and future provider expansion to the existing frontend, implement a frequency-based stale data policy, and enforce guardrails preventing the LLM from fabricating data.

## Execution Summary
1. **Frontend-Locked Rule Enforced**: 
   - `MACRO_INDICATOR_UNIVERSE` updated with `inCurrentFrontend` and `providerExpansionEligible`. 
   - Only indicators currently in the Macro UI (`inCurrentFrontend=true`) are eligible for integration.
   - Indicators like `VNINDEX_CLOSE` are not in the current UI and are now explicitly blocked from preview/ingestion.
2. **Stale Data Policy**: 
   - Created `macro-stale-policy.ts` to evaluate data freshness based on `expectedFrequency`.
   - Integrated into `loadMacroRuntimeData` to tag `staleStatus` and pass it to UI/Assistant.
3. **No Fake Data Statement**:
   - Confirmed that UI status for non-DB indicators correctly shows "Chưa có dữ liệu quan sát", "Cần đánh giá nguồn", or "Dự kiến hỗ trợ". 
   - Assistant is actively commanded not to invent numbers.
4. **No DB Write / Production Deploy Statement**:
   - `dbWriteAttempted=false` maintained during all preview and smoke scripts.
   - No Prisma migrations were created. The application was not deployed.

## Pre-check git status summary
```text
 M tsconfig.tsbuildinfo
```

## Files Changed
```text
docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md
docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md
docs/product/MACRO_INDICATOR_UNIVERSE.md
docs/product/evidence/PHASE148B_MACRO_FRONTEND_LOCKED_PROVIDER_EXPANSION_STALE_POLICY.md
scripts/audit-macro-frontend-indicator-scope.ts
scripts/audit-macro-provider-expansion-eligibility.ts
scripts/preview-macro-provider-expansion-frontend-locked.ts
scripts/smoke-assistant-macro-frontend-locked-no-fake.ts
scripts/smoke-macro-frontend-locked-registry.ts
scripts/smoke-macro-stale-policy.ts
src/app/api/assistant/route.ts
src/features/macro/components/MacroCompassSections.tsx
src/features/macro/lib/load-macro-runtime-data.ts
src/features/macro/lib/macro-indicator-registry.ts
src/features/macro/lib/macro-stale-policy.ts
src/features/macro/types.ts
```

## Smoke Test Results
- **Frontend Indicator Scope Audit**: 14 frontend indicators properly detected and aligned.
- **Frontend-Locked Registry**: `providerExpansionLockedToFrontend: true` verified.
- **Provider Expansion Preview**: `previewBlockedIndicators: USD_VND, FED_FUNDS_RATE` due to missing source integrations. `dryRun=true, dbWriteAttempted=false`.
- **Assistant Guardrail Smoke**: Passed. `staleIndicatorsInjected` and `notInFrontendIndicatorsInjected` correctly included.
- **Stale Policy Smoke**: Passed. Daily (5 days), monthly (60), quarterly (150), and annual (450) freshness logic working correctly.

## Validation Results
- **Prisma Validate**: Passed
- **TypeScript**: Passed
- **Build**: Passed

## Known Gaps
- Only indicators in current Macro frontend are eligible for data work.
- Some frontend indicators still require source assessment.
- No confirm-write for expanded indicators yet (blocked by preview).
- World Bank remains candidate/not production-approved.
- Production migration history still needs reconciliation.
- Macro-to-industry mapping not implemented.
- Global lint may remain not clean due to pre-existing issues.

## Next Recommended Phase
Phase 148C — Macro source verification for frontend-locked indicators
