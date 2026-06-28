# Evidence: Phase 148I - Macro Domestic Interest Rate Semantic Mapping and Source Strategy

## Verification Details
- **Phase**: 148I
- **Date**: 2026-06-28
- **Objective**: Audit the semantic mapping between the frontend card "Lãi suất trong nước" and backend indicator `INTERBANK_RATE_OVERNIGHT`. Provide candidate alternatives and a recommended mapping strategy without creating fake data or polluting the database.

## Execution Summary
1. **Frontend-locked scope**: Target indicator restricted strictly to the frontend card "Lãi suất trong nước". No new UI cards were added.
2. **Semantic Mapping Audit**:
   - `INTERBANK_RATE_OVERNIGHT`: Mapped currently, but represents a very specific short-term rate.
   - `POLICY_RATE`: Stronger semantic fit for representing domestic monetary policy stance.
   - `GOV_BOND_YIELD_10Y`: Long-term capital cost, weaker retail relevance.
   - `DEPOSIT_RATE` / `LENDING_RATE`: Strong retail relevance but lack standard sources.
3. **Recommendation**:
   - Recommended switching to `POLICY_RATE` but deferred the actual implementation pending manual product owner review (`manual_review_before_mapping_change`).
   - Re-routed the hardcoded runtime mapping in `load-macro-runtime-data.ts` to use a central `DOMESTIC_RATE_FRONTEND_INDICATOR_CODE` constant, which is currently kept at `INTERBANK_RATE_OVERNIGHT` safely blocked.
4. **No Fake Data / No Numeric Extraction Statement**:
   - No numeric values were extracted in this phase. The phase strictly focused on semantic mapping auditing.
5. **No DB Write / Production Deploy Statement**:
   - No data was written to the database (`dbWriteAttempted=false`). No production deployments were made.

## Pre-check git status summary
```text
Clean working tree after Phase 148H pushed.
```

## Files Changed
```text
docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md
docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md
docs/product/MACRO_DOMESTIC_RATE_MAPPING_DECISION.md
docs/product/MACRO_INDICATOR_UNIVERSE.md
docs/product/MACRO_PARSER_STRATEGY.md
docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md
docs/product/evidence/PHASE148I_MACRO_DOMESTIC_RATE_SEMANTIC_MAPPING_SOURCE_STRATEGY.md
scripts/audit-macro-domestic-rate-semantic-mapping.ts
scripts/smoke-macro-domestic-rate-semantic-mapping.ts
src/features/macro/lib/load-macro-runtime-data.ts
src/features/macro/lib/macro-domestic-rate-semantic-mapping.ts
```

## Semantic Mapping Registry Summary
- Created `macro-domestic-rate-semantic-mapping.ts`.
- Mappings evaluated: `INTERBANK_RATE_OVERNIGHT`, `POLICY_RATE`, `GOV_BOND_YIELD_10Y`, `DEPOSIT_RATE`, `LENDING_RATE`.
- Runtime constant defined: `DOMESTIC_RATE_FRONTEND_INDICATOR_CODE` (currently `INTERBANK_RATE_OVERNIGHT`).

## Smoke Results
- Passed. Runtime guardrails ensure the mapping audit does not artificially populate the DB, mark indicators as db_backed, or invent values. The Assistant maintains its strict non-hallucination posture.

## Validation Results
- **Prisma Validate**: Passed
- **TypeScript**: Passed
- **Build**: Passed
- **Lint**: Failed with exit code 1 (Global lint is not a clean pass. Failure is pre-existing/out of scope verified by pre-change status).

## Known Gaps
- No domestic-rate observation was written.
- Semantic mapping does not mean data is available.
- `INTERBANK_RATE_OVERNIGHT` may remain blocked.
- `POLICY_RATE`/`GOV_BOND_YIELD_10Y`/`DEPOSIT_RATE`/`LENDING_RATE` require source assessment if chosen.
- Only CPI_YOY/GDP_GROWTH are DB-backed unless prior state says otherwise.
- Production migration history still needs reconciliation.
- Macro-to-industry mapping not implemented.
- Global lint may remain not clean due to pre-existing issues.

## Next Recommended Phase
Phase 148J — Domestic-rate product decision review and source strategy finalization
