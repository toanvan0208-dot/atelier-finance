# Phase 151J - HSG/NKG Manual CFO Source Package Closure Dry Run

## Goal
Update HSG/NKG screening candidate source packages to close manual CFO gaps using user-reviewed consolidated cash-flow data, while keeping HSG_PE open. This is a dry-run phase to validate the updated source metric boundary definitions without writing to the database.

## Scope
- HSG_CFO and NKG_CFO updated to use manual consolidated source.
- HSG_PE remains missing and open.
- TVN excluded entirely.
- HSG/NKG remain screening_candidate only.
- No full analysis enablement.
- No DB writes, no UI change, no Assistant change, no schema migration, no IndustryMetric, no benchmark, no ranking/scoring.

## Files Changed
- `scripts/screening-steel-direct-peer-reviewed-sources.ts` (added manual CFO values)
- `scripts/dry-run-screening-steel-direct-peer-metrics.ts` (added validation for manual CFO write eligibility constraints and 151J output format)

## Manual CFO Source Summary
### HSG
- **Value**: 3,659,840,645,961 VND
- **Source**: HSG - Báo cáo tài chính hợp nhất Quý IV niên độ 2024-2025 (Period: 2025, Fiscal Year)
- **Extracted Quote**: "20 Lưu chuyển tiền thuần từ hoạt động kinh doanh ... 3.659.840.645.961"
- **Review Note**: CFO lấy từ báo cáo lưu chuyển tiền tệ hợp nhất, dòng "Lưu chuyển tiền thuần từ hoạt động kinh doanh" (Mã số 20).
- **Status**: closed_by_manual_consolidated_source

### NKG
- **Value**: 1,326,940,472,262 VND
- **Source**: 20260413 - NKG - Bao cao thuong nien 2025-w.pdf (Period: 2025, Annual)
- **Extracted Quote**: "Lưu chuyển tiền thuần từ hoạt động kinh doanh ... 1.326.940.472.262"
- **Review Note**: CFO lấy từ báo cáo lưu chuyển tiền tệ hợp nhất.
- **Status**: closed_by_manual_consolidated_source

## Gap List Status
- **Missing Source Gaps Before**: HSG_PE, HSG_CFO, NKG_CFO
- **Closed Source Gaps**: HSG_CFO, NKG_CFO
- **Remaining Source Gaps**: HSG_PE

## Explicit TVN Exclusion
- `tvnPresentInCandidatePackages`: false
- `tvnScreeningEligible`: false

## Guardrail Confirmation
- **DB write attempted**: false
- **Provider fetch attempted**: false
- **Schema changed**: false
- **UI changed**: false
- **Assistant changed**: false
- **IndustryMetric created**: false
- **Benchmark created**: false
- **Ranking/Scoring created**: false
- **HSG/NKG full analysis enablement**: false
- **TVN screening data presence**: false
- **productionApprovedTrueCount**: 0
- **readyForConfirmWrite**: false (because HSG_PE remains missing)
- **readyForPartialScreeningConfirmWrite**: false

## Recommended Next Phase
Phase 151K — HSG_PE manual/provider market snapshot source closure dry-run.
