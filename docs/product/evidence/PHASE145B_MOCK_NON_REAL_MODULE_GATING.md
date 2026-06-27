# Phase 145B — Remove or gate mock/non-real modules from product UI

## Overview
This phase implements the "Real Product Readiness" standard by hiding or gating non-real modules from the product UI, ensuring no mock or static data is presented as real company/user data.

- **Starting commit**: `c9f56ab`
- **Scope**: Product UI, Navigation, AppShell, Business, Learning, and Assistant modules.

## Files Changed
- `src/lib/product/module-readiness.ts` (NEW)
- `src/config/navigation.config.ts` (MODIFIED)
- `src/components/layout/AppShell.tsx` (MODIFIED)
- `src/features/business/components/BusinessUnderstandingDashboard.tsx` (MODIFIED)
- `src/features/learning/components/LearningPage.tsx` (MODIFIED)
- `src/components/layout/RightAssistantPanel.tsx` (MODIFIED)
- `scripts/smoke-product-ui-mock-gates.ts` (NEW)

## Module Gate Policy
A new configuration object `PRODUCT_MODULE_GATES` in `module-readiness.ts` enforces the readiness contract. Modules lacking real user/session/write-path support are marked as `gated_not_real_yet`.

## Simulation Gating Result
- Removed from the sidebar navigation.
- If accessed directly via URL, AppShell intercepts the route and renders a gated message via `MainContent`, preventing the mock portfolio from loading.

## Watchlist Gating Result
- Removed from the sidebar navigation.
- If accessed directly via URL, it is similarly gated by AppShell, preventing the mock user state from displaying.

## Business UI Mock Chip Result
- Removed `isMock` labels and hardcoded mock values.
- Replaced the mock data state description with a clear "Chưa có dữ liệu vận hành từ hệ thống".
- Rendering `N/A` for metric values to ensure no mock-as-real data is displayed.

## Learning Treatment
- Retained in navigation as educational static content.
- Added a prominent disclaimer banner at the top of the UI explicitly stating it is educational and not market data or investment advice.

## Assistant Treatment
- Added a user-facing disclaimer directly in the Assistant UI panel (RightAssistantPanel).
- Explicitly states that the AI only explains data, does not recommend actions, and is not a full semantic RAG.

## Mock-as-real Checks
- Verified via `scripts/smoke-product-ui-mock-gates.ts` that no prohibited wording or mock chips persist in the updated files.

## Technical Details
- **DB write**: No
- **Data seed/import**: No
- **Schema migration**: No
- **Rollback**: No
- **Production deploy/import**: No
- **Live LLM call**: No

## Validation Result
- Build, lint, and typecheck pass locally.
- Test suite fails locally ONLY due to the known PostgreSQL temporary database infrastructure issue, which is unrelated to these UI gating changes.

## Known Limitations
- The product still relies on `research_only` staging seed data, but no mock UI elements mislead the user.
- The `isMock` property on the business metric type remains but is safely ignored in the UI.

## Recommended Next Phase
- **Phase 145C** — Proceed with backend pipeline hardening and transitioning data provenance from `research_only` to `productionApproved=true`.

## readyForNextPhase
Yes
