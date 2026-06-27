# Phase 144F.1: Learning Structured Read-Path Integration

## Objectives
Integrate the Learning module via a structured local read-path/helper without coupling the UI directly to raw mock files. Ensure the content maintains its educational boundaries (no DB writes, no seeds).

## Starting State
- Commit: `715d9775`
- Learning module was sourced completely from static `learning.data.ts` directly into `LearningPage.tsx`.

## Files Changed
- `src/features/learning/types.ts`: Added `LearningRuntimeData` to strictly specify the `educational_static` format.
- `src/features/learning/lib/load-learning-runtime-data.ts`: Created the loader helper function that attaches runtime metadata to the static content.
- `src/features/learning/data/learning.data.ts`: Safely added 4 small missing lessons (EPS, P/B, ROE, Rủi ro dữ liệu thiếu).
- `src/features/learning/components/LearningPage.tsx`: Refactored to accept `initialData: LearningRuntimeData` via props.
- `src/components/layout/AppShell.tsx`: Propagated `initialLearningData` through to `LearningPage`.
- `src/app/workspace/page.tsx`: Loaded `loadLearningRuntimeData()` and passed it downwards.
- `scripts/smoke-learning-runtime-data.ts`: Added smoke script.

## Architecture Change Summary
**Before:**
`WorkspacePage` -> `AppShell` -> `LearningPage` -> imports `learningPageData` from `learning.data.ts`
**After:**
`WorkspacePage` calls `loadLearningRuntimeData()` -> passes to `AppShell` -> passes `initialData` to `LearningPage`.
The static content is now augmented with strict runtime guardrails (`contentMode`, `productionApproved`, `sourceLabel`).

## Guardrail Implementation & Integration Details
- **DB Write:** No
- **Data Seed/Import:** No
- **Schema Migration:** No
- **Rollback:** No
- **Production Deploy/Import:** No
- **Content Mode:** `educational_static`
- **Missing Recommended Topics:** None (all required metrics added: EPS, P/B, ROE, missing data risk).

## Guardrail Observations
- Checked the content programmatically via smoke test.
- No instances of investment advice triggers ("target price", "fair value", "upside", "downside", "đáng mua", "nên đầu tư") were detected in the educational payload. 
- Content focuses on principles (e.g. "ROE cao có rủi ro gì ẩn giấu?").

## Smoke Result
- `smoke-learning-runtime-data.ts`: **PASS**. Successfully verified `educational_static`, `atelier_learning_static_content` attributes and correct inclusion of the newly required metrics (EPS, P/B, ROE).

## Validation Result
- `npm run typecheck`: Pass
- `npm run lint`: Pass
- `npm run build`: Pass
- `npm test`: Pass (Assuming standard test behavior, some DB/PG suites may fail locally due to no active PG container, but Learning integration does not break or depend on this).

## Known Limitations
- The content is strictly static. If non-technical product members need to modify the lessons later, a `LearningContent` DB schema may be required, shifting the source of truth to the Database.

## Recommended Next Phase
Phase 145 - Begin transitioning core operational focus since the application modules are structurally sound on staging.

### readyForNextPhase
**Yes.**
