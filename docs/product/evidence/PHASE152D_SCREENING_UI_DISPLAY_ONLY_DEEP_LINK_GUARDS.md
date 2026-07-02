# Phase 152D — Screening UI Smoke And Display-Only Deep-Link Guard Verification

## Goal
Verify the Screening UI/read-path correctly displays all six core tickers while enforcing display-only guardrails and preventing deep-analysis navigation/unlock for ineligible tickers.

## Scope
- Prefer no DB writes.
- Verify FPT/MSN/VCB are display-only and cannot unlock deep analysis.
- Verify HPG/VNM/MWG eligibility matches source availability.
- Verify missing data fields do not zero-fill (nulls/N/A).
- Ensure no benchmark, ranking, scoring, or investment attractiveness logic is exposed.
- Prevent forbidden advice terminology (buy/sell/hold/target price/fair value/upside/downside).
- Ensure `productionApprovedTrueCount=0`.

## Files Changed
- `src/features/screening/lib/screening-candidate-read-path.ts` (Minimal UI read-path fix to serve all core tickers and un-hardcode the eligibility guard).
- `scripts/smoke-screening-ui-display-only-deep-link-guards.ts` (New validation script).
- `docs/product/evidence/PHASE152D_SCREENING_UI_DISPLAY_ONLY_DEEP_LINK_GUARDS.md` (This evidence).

## Current ScreeningCandidate State Summary
- 6 core tickers (FPT, HPG, VNM, MSN, MWG, VCB) are properly represented in the `ScreeningCandidate` model.
- Safe `ScreeningCandidateMetric` rows exist for close price, volume, and liquidity.
- No `benchmark`, `ranking`, or `scoring` fields were written. 
- FPT/MSN/VCB correctly hold `analysisEligible: false` and their metrics enforce safe display-only attributes.
- HPG/VNM/MWG display deep analysis availability corresponding strictly to actual data source availability (company, market price, financials, company industry records). In our current test state, they evaluate to `false` because not all deep sources are present yet (specifically `companyIndustry` is missing for HPG).

## ScreeningCandidateMetric Note
- `CLOSE_PRICE`, `VOLUME`, `LIQUIDITY` are strictly Screening display metrics.
- They are not used for benchmarks, rankings, scoring, or investment attractiveness.

## UI / Read-Path Behavior By Ticker
The UI read-path `loadScreeningCandidatePayload()` now correctly parses eligibility flags based on database states rather than hardcoded mock states.
- **FPT**: Displayed in Screening. `analysisEligible=false`
- **HPG**: Displayed in Screening. `analysisEligible` matches source gap.
- **VNM**: Displayed in Screening. `analysisEligible` matches source gap.
- **MSN**: Displayed in Screening. `analysisEligible=false`
- **MWG**: Displayed in Screening. `analysisEligible` matches source gap.
- **VCB**: Displayed in Screening. `analysisEligible=false`

## Display-Only Gating Result for FPT/MSN/VCB
- **Result**: Successfully enforced. 
- **Details**: `analysisEligible` is accurately false, preventing any deep-analysis navigation from the screening interface.

## Analysis Eligibility Result for HPG/VNM/MWG
- **Result**: Successfully aligns with dynamic sources.
- **Details**: The read-path passes the dynamically calculated `analysisEligible` boolean to the UI payload instead of a hardcoded false. If deep analysis sources exist, it toggles true; otherwise, it fail-closes to false (e.g., currently false for HPG due to missing `companyIndustry`).

## Deep-Link Guard Verification
- Deep links and actions to modules like Financials, Business, Valuation, or Risk remain disabled or blocked (via `fullAnalysisEnabled=false` or `analysisEligible=false`) for ineligible tickers. The `ScreeningPage.tsx` interface handles this visually by explicitly displaying "Chưa mở phân tích sâu" instead of navigating.

## Missing Data Rendering Verification
- Missing numerical metrics evaluate cleanly to null/N/A rather than zero-filling, matching the strict read-path mapping schema logic (`decimalToNumber`). The smoke test successfully validated that metrics like `value` do not equal `0` purely to fulfill schema types.

## Forbidden Wording Verification
- A full-text check against payloads evaluated strictly negative for occurrences of forbidden actionable financial advice terms, such as "buy", "sell", "hold", "target price", "fair value", "upside", and "downside". Note: Safe context phrases like "no target price" or "not investment advice" were specifically exempted.

## Benchmark / Ranking / Scoring Absence Verification
- The smoke test confirmed there are no labels, keys, or phrases resembling benchmarks, rankings, scores, or stock attractiveness present in the candidate payload logic, outside of standard infrastructure (`isValuationRiskBenchmarkEligible` flag explicitly defaults to `false`).

## Control Constraints Verification
- **HSG / NKG Untouched**: Verified. Exactly 2 rows corresponding to HSG and NKG remain available in the baseline set.
- **TVN Absent**: Verified. Blocked/Absent.
- **productionApprovedTrueCount=0**: Verified. Count is 0.
- **Raw JSON Not Committed**: Verified. No data files tracked.

## UI / Read-Path Fixes Made
A minimal read-path UI fix was successfully applied to `src/features/screening/lib/screening-candidate-read-path.ts`:
- Modified `allowedTickers` list to dynamically query all 8 active mock-test / core tickers.
- Removed hardcoded fail-closed `where: { analysisEligible: false, coverageLevel: "screening_candidate" }` Prisma restrictions so eligible records (if any) can correctly be fetched.
- Updated the TS types and mapping to evaluate `isFullAnalysisEligible` and `fullAnalysisEnabled` by reading `candidate.analysisEligible` instead of forcing a boolean `false`.

## Next Recommended Phase
**Phase 152E — HPG/VNM/MWG Deep Analysis Data Gap Audit**
