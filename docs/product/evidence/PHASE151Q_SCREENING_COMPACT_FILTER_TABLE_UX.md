# Phase 151Q — Screening Compact Filter Table UX

## Goal

Redesign the Screening module into a compact, user-facing filter and comparison table using the existing read-only `ScreeningCandidate` read-path.

Screening remains a data-readiness workflow only. It is not an investment recommendation, not a ranking, not a score, and not a valuation/risk benchmark.

## Scope

- UI/read-path only.
- No DB write.
- No schema change.
- No provider fetch.
- No Assistant change.
- No Industry module change.
- No new data import.
- No Supabase migration.
- No ranking/scoring/benchmark/IndustryMetric.
- No full-analysis enablement for HSG/NKG.
- TVN remains excluded.

## Files Changed

- `src/features/screening/components/ScreeningPage.tsx`
- `src/features/screening/components/__tests__/ScreeningPage.copy.test.ts`
- `scripts/smoke-screening-api-ui-caveat-surfacing-mvp.ts`
- `docs/product/evidence/PHASE151Q_SCREENING_COMPACT_FILTER_TABLE_UX.md`

## UI Before/After Summary

Before this phase, Screening surfaced HSG/NKG as large vertical caveat cards and still rendered older MVP copy around FPT/MWG/VNM. The page felt closer to an internal data-quality audit than a compact Screening interface.

After this phase, the main Screening surface is:

- Header with concise non-advice framing.
- Compact filter bar.
- Small horizontal summary cards.
- Compact candidate comparison table.
- Expandable source/caveat detail panel.
- Secondary collapsed screening-flow support section.

## Filter Bar Behavior

The filter bar includes:

- Ticker search input.
- Industry filter.
- Coverage level filter.
- Data status filter.
- Metric availability checkboxes:
  - Có P/E
  - Có P/B
  - Có CFO
  - Có thanh khoản
- Analysis eligibility filter.
- Reset filters action.

No attractiveness sorting, ranking, or recommendation ordering was added.

## Summary Card Behavior

Summary cards are computed from the read-only `ScreeningCandidate` payload:

- Tổng mã trong phạm vi.
- Ứng viên screening.
- Có thể phân tích tiếp.
- Cần rà soát.
- Chưa mở phân tích sâu.

For the current HSG/NKG candidate payload, the intended user-facing totals are:

- Total candidates: 2
- Screening candidates: 2
- Analysis eligible: 0
- Needs review: 2
- Full analysis not open: 2

## Candidate Table Behavior

The large HSG/NKG card layout was replaced with a compact table:

- Mã
- Công ty
- Ngành
- Loại dữ liệu
- P/E
- P/B
- CFO
- Thanh khoản
- Trạng thái
- Đi tiếp?
- Hành động

HSG and NKG remain `screening_candidate` only. They do not unlock Business, Financials, Valuation, or Risk deep-analysis.

## Detail/Caveat Behavior

Detailed caveats are no longer repeated under every candidate row. The user opens them through `Xem nguồn / caveat`.

The detail panel exposes:

- `coverageLevel=screening_candidate`
- `dataMode=research_only`
- `needsReview=true`
- `analysisEligible=false`
- `fullAnalysisEnabled=false`
- `productionApproved=false`
- Not investment advice.
- Not full analysis.
- Not valuation/risk benchmark.
- P/E as provider market-ratio snapshot.
- CFO as manual consolidated cash-flow source.
- Provenance summary.

## HSG/NKG Data Displayed

HSG:

- P/E: 14.72
- Provider period: 2026-Q2
- P/B: 0.95
- CFO: compact VND billion display from `3659840645961`
- Liquidity: `210000000 VND_AVERAGE_TRADING_VALUE_30D`
- Status: `research_only`, `needsReview`, not full analysis

NKG:

- P/E: 16.1
- P/B: 0.85
- CFO: compact VND billion display from `1326940472262`
- Liquidity: `160000000 VND_AVERAGE_TRADING_VALUE_30D`
- Status: `research_only`, `needsReview`, not full analysis

## TVN Exclusion

TVN remains absent from the Screening table and filter result set.

## Stale Copy Handling

The main Screening UI no longer renders stale old MVP sections such as:

- `Đang lọc tiếp: FPT / MWG / VNM`
- `Bảng mức độ đủ dữ liệu của FPT, MWG và VNM`

The new table states that the displayed rows reflect the current `ScreeningCandidate` table.

## Guardrail Confirmation

- DB write: no.
- Schema change: no.
- Provider fetch: no.
- Assistant change: no.
- IndustryMetric created: false.
- Benchmark created: false.
- Ranking/scoring created: false.
- Full-analysis enablement for HSG/NKG: false.
- Forbidden advice wording introduced: false.
- TVN visible: false.
- `productionApprovedTrueCount=0`.

## Validation Results

Commands run:

- `npx eslint src/features/screening/components/ScreeningPage.tsx src/features/screening/lib/load-screening-runtime-data.ts src/features/screening/lib/screening-candidate-read-path.ts scripts/smoke-screening-api-ui-caveat-surfacing-mvp.ts`
- `npx vitest run src/features/screening/lib/__tests__/screening-readiness-mvp.test.ts src/features/screening/components/__tests__/ScreeningPage.copy.test.ts`
- `npx tsx scripts/smoke-screening-api-ui-caveat-surfacing-mvp.ts`
- `npm run typecheck`

Result: passed after Phase 151Q implementation.

## Next Recommended Phase

Phase 151R — Screening filter interactions and empty-state polish.

Alternative later phase when ready for cloud sync: Phase 151S — Supabase Screening migration.
